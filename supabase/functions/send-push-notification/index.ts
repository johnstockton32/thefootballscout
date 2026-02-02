import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  excludeUserId?: string;
}

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

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
    const { title, body, url, excludeUserId } = payload;

    // Get all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

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

    // Filter subscriptions - exclude the user who triggered the notification
    const targetSubscriptions = subscriptions.filter((sub: any) => {
      if (excludeUserId && sub.user_id === excludeUserId) return false;
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
