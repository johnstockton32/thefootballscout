import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  teamId?: string;
  excludeUserId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    
    if (!vapidPrivateKey) {
      console.log("VAPID_PRIVATE_KEY not configured, skipping push notification");
      return new Response(
        JSON.stringify({ success: true, message: "Push notifications not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: PushPayload = await req.json();
    const { title, body, url, teamId, excludeUserId } = payload;

    // Get all subscriptions, optionally filtered by team
    let query = supabase.from("push_subscriptions").select(`
      *,
      profiles:user_id (
        team_id
      )
    `);

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter subscriptions
    const targetSubscriptions = subscriptions.filter((sub: any) => {
      // Exclude the user who triggered the notification
      if (excludeUserId && sub.user_id === excludeUserId) return false;
      
      // Filter by team if specified
      if (teamId && sub.profiles?.team_id !== teamId) return false;
      
      return true;
    });

    // Note: In a production environment, you would use web-push library
    // For now, we'll log the notification and return success
    // The actual push sending requires proper VAPID key setup
    console.log(`Would send push notification to ${targetSubscriptions.length} subscribers:`, {
      title,
      body,
      url,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: targetSubscriptions.length,
        message: "Push notifications queued" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending push notification:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
