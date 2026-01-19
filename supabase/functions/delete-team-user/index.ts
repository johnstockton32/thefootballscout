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

    // Verify the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.log("Invalid authorization:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is a super admin
    const { data: superAdminRecord } = await supabaseAdmin
      .from("super_admins")
      .select("email")
      .eq("email", requestingUser.email)
      .maybeSingle();

    const isSuperAdmin = !!superAdminRecord;

    // Check if requesting user is an admin
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin");

    const isAdmin = roles && roles.length > 0;

    // Check if user owns a team
    const { data: ownedTeam } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("owner_id", requestingUser.id)
      .maybeSingle();

    if (!isAdmin && !ownedTeam) {
      console.log("User is not an admin or team owner:", requestingUser.id);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin or team owner access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent user from deleting themselves
    if (userId === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if target user exists
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, subscription_tier, team_id")
      .eq("id", userId)
      .single();

    if (profileError || !targetProfile) {
      console.log("User not found:", userId);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If requester is a team owner (not admin), verify they can only delete their team members
    if (!isAdmin && ownedTeam) {
      if (targetProfile.team_id !== ownedTeam.id) {
        return new Response(
          JSON.stringify({ error: "You can only remove members from your own team" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check if target is an admin (only super admins can delete admins)
    const { data: targetRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");

    if (targetRoles && targetRoles.length > 0 && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Only super admins can delete admin users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if target is a team owner (prevent deleting team owners without transferring ownership)
    const { data: targetTeam } = await supabaseAdmin
      .from("teams")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (targetTeam && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: "Cannot delete team owners. Transfer ownership first." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Deleting user:", userId);

    // Delete all user data first (in order to avoid FK constraints)
    // Delete video clips
    await supabaseAdmin.from("video_clips").delete().eq("user_id", userId);
    
    // Delete AI insights
    await supabaseAdmin.from("ai_insights").delete().eq("user_id", userId);
    
    // Delete watchlist players (via watchlists)
    const { data: userWatchlists } = await supabaseAdmin
      .from("watchlists")
      .select("id")
      .eq("user_id", userId);
    
    if (userWatchlists && userWatchlists.length > 0) {
      const watchlistIds = userWatchlists.map(w => w.id);
      await supabaseAdmin.from("watchlist_players").delete().in("watchlist_id", watchlistIds);
    }
    
    // Delete watchlists
    await supabaseAdmin.from("watchlists").delete().eq("user_id", userId);
    
    // Delete scouting reports
    await supabaseAdmin.from("scouting_reports").delete().eq("scout_id", userId);
    
    // Delete players
    await supabaseAdmin.from("players").delete().eq("scout_id", userId);
    
    // Delete branding settings
    await supabaseAdmin.from("branding_settings").delete().eq("user_id", userId);
    
    // Delete custom attribute weights
    await supabaseAdmin.from("custom_attribute_weights").delete().eq("user_id", userId);
    
    // Delete report templates
    await supabaseAdmin.from("report_templates").delete().eq("user_id", userId);
    
    // Delete team activity
    await supabaseAdmin.from("team_activity").delete().eq("user_id", userId);
    
    // Delete promo code redemptions
    await supabaseAdmin.from("promo_code_redemptions").delete().eq("user_id", userId);
    
    // Delete user roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    
    // If user is a team owner and super admin is deleting, handle the team
    if (targetTeam && isSuperAdmin) {
      // Remove all members from the team first
      await supabaseAdmin
        .from("profiles")
        .update({ team_id: null, team_role: null })
        .eq("team_id", targetTeam.id);
      
      // Delete the team
      await supabaseAdmin.from("teams").delete().eq("id", targetTeam.id);
    }
    
    // Remove user from any team they're a member of
    await supabaseAdmin
      .from("profiles")
      .update({ team_id: null, team_role: null })
      .eq("id", userId);
    
    // Delete the profile
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Finally, delete the user from auth (this completely removes their ability to sign in)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully deleted user and all data:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User and all associated data deleted successfully. They will need to sign up again to use the app.",
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
