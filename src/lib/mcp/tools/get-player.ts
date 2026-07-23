import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_player",
  title: "Get player",
  description:
    "Get the full profile of a single scouted player (owned by the signed-in user) by id, including all scouting reports.",
  inputSchema: {
    player_id: z.string().uuid().describe("UUID of the player."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ player_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: player, error: pErr } = await supabase
      .from("players")
      .select("*")
      .eq("id", player_id)
      .maybeSingle();
    if (pErr) return { content: [{ type: "text", text: pErr.message }], isError: true };
    if (!player) return { content: [{ type: "text", text: "Player not found" }], isError: true };

    const { data: reports } = await supabase
      .from("scouting_reports")
      .select("*")
      .eq("player_id", player_id)
      .order("created_at", { ascending: false });

    const payload = { player, reports: reports ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
