import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Admin client for deletions
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for admin-initiated deletions
    let targetUserId: string | null = null;
    let isAdminDeletion = false;
    
    try {
      const body = await req.json();
      if (body?.userId) {
        targetUserId = body.userId;
      }
    } catch {
      // No body or invalid JSON — self-deletion
    }

    // Verify caller identity using getClaims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claims.claims.sub as string;

    // If admin is deleting another user, verify admin status
    if (targetUserId && targetUserId !== callerId) {
      const { data: isAdmin } = await supabaseAdmin.rpc('is_super_admin', { _user_id: callerId });
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Unauthorized: Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      isAdminDeletion = true;
    }

    const userId = targetUserId || callerId;

    console.log(`Starting account deletion for user: ${userId}`);

    // Delete in order of dependencies using service role
    const deletionSteps = [
      { table: 'video_clips', column: 'user_id' },
      { table: 'ai_insights', column: 'user_id' },
      { table: 'watchlist_players', column: 'watchlist_id', subquery: true },
      { table: 'watchlists', column: 'user_id' },
      { table: 'push_subscriptions', column: 'user_id' },
      { table: 'report_templates', column: 'user_id' },
      { table: 'custom_attribute_weights', column: 'user_id' },
      { table: 'branding_settings', column: 'user_id' },
      { table: 'saved_searches', column: 'user_id' },
      { table: 'promo_code_redemptions', column: 'user_id' },
      { table: 'feature_feedback', column: 'user_id' },
      { table: 'contact_messages', column: 'user_id' },
      { table: 'player_development_notes', column: 'scout_id' },
      { table: 'scouting_reports', column: 'scout_id' },
      { table: 'players', column: 'scout_id' },
      { table: 'user_roles', column: 'user_id' },
    ];

    // Handle watchlist_players specially (needs to get watchlist IDs first)
    const { data: watchlists } = await supabaseAdmin
      .from('watchlists')
      .select('id')
      .eq('user_id', userId);

    if (watchlists && watchlists.length > 0) {
      const watchlistIds = watchlists.map(w => w.id);
      await supabaseAdmin
        .from('watchlist_players')
        .delete()
        .in('watchlist_id', watchlistIds);
    }

    // Delete from all other tables
    for (const step of deletionSteps) {
      if (step.subquery) continue; // Already handled above
      
      const { error } = await supabaseAdmin
        .from(step.table)
        .delete()
        .eq(step.column, userId);
      
      if (error) {
        console.log(`Warning: Could not delete from ${step.table}: ${error.message}`);
      } else {
        console.log(`Deleted from ${step.table}`);
      }
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error(`Error deleting profile: ${profileError.message}`);
    }

    // Finally delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error(`Error deleting auth user: ${deleteUserError.message}`);
      return new Response(
        JSON.stringify({ error: "Failed to delete account. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in delete-account function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
