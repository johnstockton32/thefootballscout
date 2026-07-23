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
  name: "list_reports",
  title: "List scouting reports",
  description:
    "List scouting reports for the signed-in user. Optionally filter by player_id and limit the count.",
  inputSchema: {
    player_id: z.string().uuid().optional().describe("Filter reports to a specific player."),
    limit: z.number().int().min(1).max(200).optional().describe("Maximum number of reports to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ player_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("scouting_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (player_id) q = q.eq("player_id", player_id);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { reports: data ?? [] },
    };
  },
});
