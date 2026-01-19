import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user using getClaims for signing-keys compatibility
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's auth header for getClaims
    const supabaseUserClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUserClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestingUserId = claimsData.claims.sub as string;
    console.log("Authenticated user ID:", requestingUserId);

    // Check if requesting user is an admin OR a team owner
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUserId)
      .eq("role", "admin");

    const isAdmin = roles && roles.length > 0;

    // Check if user owns a team
    const { data: ownedTeam } = await supabaseAdmin
      .from("teams")
      .select("id, name")
      .eq("owner_id", requestingUserId)
      .maybeSingle();

    // Check if user is a team admin (from profiles.team_role)
    const { data: requesterProfile } = await supabaseAdmin
      .from("profiles")
      .select("team_id, team_role")
      .eq("id", requestingUserId)
      .maybeSingle();

    const isTeamAdmin = requesterProfile?.team_role === "team_admin";

    // Get the effective team (either owned or member of)
    let effectiveTeamId = ownedTeam?.id || null;
    if (!effectiveTeamId && isTeamAdmin && requesterProfile?.team_id) {
      effectiveTeamId = requesterProfile.team_id;
    }

    if (!isAdmin && !ownedTeam && !isTeamAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin, team owner, or team admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check team member limit based on purchased licenses
    if (effectiveTeamId) {
      // Get team's license count
      const { data: teamData, error: teamError } = await supabaseAdmin
        .from("teams")
        .select("license_count")
        .eq("id", effectiveTeamId)
        .single();

      if (teamError) {
        console.error("Error fetching team data:", teamError);
        return new Response(
          JSON.stringify({ error: "Failed to verify team license" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const licenseLimit = teamData?.license_count ?? 10;

      const { count: memberCount, error: countError } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("team_id", effectiveTeamId);

      if (countError) {
        console.error("Error counting team members:", countError);
        return new Response(
          JSON.stringify({ error: "Failed to verify team member limit" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if ((memberCount ?? 0) >= licenseLimit) {
        return new Response(
          JSON.stringify({ 
            error: `Team license limit reached. You have ${licenseLimit} licenses. Purchase additional licenses to add more members.`,
            needsUpgrade: true,
            currentMembers: memberCount,
            licenseLimit: licenseLimit
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse request body
    const { email, fullName, organization, role, password } = await req.json();

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: "Email and full name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    const validRoles = ["scout", "senior_scout", "team_admin"];
    if (!role || !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Valid role is required (scout, senior_scout, or team_admin)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, team_id, subscription_tier")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      // User already exists - add them to the team instead of creating new
      console.log("User already exists, adding to team:", existingProfile.id);

      // Check if user is already in a team
      if (existingProfile.team_id) {
        if (existingProfile.team_id === effectiveTeamId) {
          return new Response(
            JSON.stringify({ error: "This user is already a member of your team" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: "This user is already a member of another team. They must leave their current team first." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Add existing user to the team
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          team_id: effectiveTeamId,
          team_role: role,
          subscription_tier: "team",
          subscription_started_at: new Date().toISOString(),
        })
        .eq("id", existingProfile.id);

      if (updateError) {
        console.error("Error adding user to team:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to add user to team" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Existing user added to your team successfully.",
          user: {
            id: existingProfile.id,
            email: existingProfile.email,
          },
          isExistingUser: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User doesn't exist - create new user
    // Password is required for new users
    if (!password) {
      return new Response(
        JSON.stringify({ error: "Password is required for new users" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user with provided password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the profile with team tier, organization, team_id and selected role
    const updateData: Record<string, unknown> = {
      subscription_tier: "team",
      organization: organization || null,
      subscription_started_at: new Date().toISOString(),
      team_role: role,
    };

    // If requesting user has a team (owner or team admin), add the new user to their team
    if (effectiveTeamId) {
      updateData.team_id = effectiveTeamId;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", newUser.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "New user created and added to your team successfully.",
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
        isExistingUser: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
