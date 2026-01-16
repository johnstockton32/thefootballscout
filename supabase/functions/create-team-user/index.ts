import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    if (!isAdmin && !ownedTeam) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin or team owner access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check team member limit (max 10 members per team)
    if (ownedTeam) {
      const { count: memberCount, error: countError } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("team_id", ownedTeam.id);

      if (countError) {
        console.error("Error counting team members:", countError);
        return new Response(
          JSON.stringify({ error: "Failed to verify team member limit" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const MAX_TEAM_MEMBERS = 10;
      if ((memberCount ?? 0) >= MAX_TEAM_MEMBERS) {
        return new Response(
          JSON.stringify({ error: `Team member limit reached. Maximum ${MAX_TEAM_MEMBERS} members allowed per team.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse request body
    const { email, fullName, organization, role, password } = await req.json();

    if (!email || !fullName || !password) {
      return new Response(
        JSON.stringify({ error: "Email, full name, and password are required" }),
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
      team_role: role, // Use the role provided in the request
    };

    // If requesting user is a team owner, add the new user to their team
    if (ownedTeam) {
      updateData.team_id = ownedTeam.id;
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
        message: "User created successfully.",
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
        },
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