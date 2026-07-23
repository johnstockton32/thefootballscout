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
  name: "list_players",
  title: "List players",
  description:
    "List scouted players belonging to the signed-in user. Supports optional filters by position, nationality, and current club, and a result limit.",
  inputSchema: {
    position: z.string().optional().describe("Filter by exact position (e.g. striker, winger, centre_back)."),
    nationality: z.string().optional().describe("Filter by nationality."),
    current_club: z.string().optional().describe("Filter by current club (partial match)."),
    limit: z.number().int().min(1).max(200).optional().describe("Maximum number of players to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ position, nationality, current_club, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("players")
      .select("id, full_name, position, nationality, current_club, date_of_birth, preferred_foot, height_cm")
      .order("full_name", { ascending: true })
      .limit(limit ?? 50);
    if (position) q = q.eq("position", position);
    if (nationality) q = q.eq("nationality", nationality);
    if (current_club) q = q.ilike("current_club", `%${current_club}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { players: data ?? [] },
    };
  },
});
