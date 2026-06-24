// deno-lint-ignore-file no-explicit-any
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const email = "test@test.com";
    const password = "Chester25064251";

    // Try to find existing user
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;

    if (!user) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Admin" },
      });
      if (createErr) throw createErr;
      user = created.user;
    } else {
      // Reset password
      await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    }

    if (!user) throw new Error("No user");

    // Ensure profile is pro
    await supabase.from("profiles").update({ subscription_tier: "pro" }).eq("id", user.id);

    // Ensure super_admin entry exists
    await supabase.from("super_admins").upsert({ email }, { onConflict: "email" });

    // Ensure admin role
    const { data: existingRole } = await supabase
      .from("user_roles").select("*").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!existingRole) {
      await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" });
    }

    return new Response(JSON.stringify({ ok: true, user_id: user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
