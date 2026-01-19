import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth to validate JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabaseAuth.auth.getClaims(token);
    
    if (authError || !claims?.claims?.sub) {
      console.log("Invalid authorization:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestingUserId = claims.claims.sub;

    // Create admin client with service role for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if requesting user is a team owner or team admin
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("team_id, team_role")
      .eq("id", requestingUserId)
      .single();

    // Also check if user owns a team
    const { data: ownedTeam } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("owner_id", requestingUserId)
      .maybeSingle();

    const isTeamAdmin = userProfile?.team_role === "team_admin";
    const isTeamOwner = !!ownedTeam;

    if (!isTeamAdmin && !isTeamOwner) {
      console.log("User is not a team owner or team admin:", requestingUserId);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Team admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Verify target user is in the same team as requester
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("team_id, email")
      .eq("email", email)
      .maybeSingle();

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ error: "User not found in any team" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Team owners can only resend invitations to their own team members
    if (isTeamOwner && ownedTeam) {
      if (targetProfile.team_id !== ownedTeam.id) {
        console.log("Team owner attempted to resend invitation for user not in their team");
        return new Response(
          JSON.stringify({ error: "User is not in your team" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Team admins can only resend invitations to users in the same team
    if (isTeamAdmin && !isTeamOwner) {
      if (targetProfile.team_id !== userProfile?.team_id) {
        console.log("Team admin attempted to resend invitation for user not in their team");
        return new Response(
          JSON.stringify({ error: "User is not in your team" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Resending invitation to:", email);

    // Generate a new recovery link - Supabase will send the email
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth`,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({ error: resetError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use resetPasswordForEmail to actually send the email
    const { error: emailError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth`,
    });

    if (emailError) {
      console.error("Error sending reset email:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Password reset email sent successfully to:", email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully",
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
