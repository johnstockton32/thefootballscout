declare const process: { env: Record<string, string | undefined> };
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
  name: "search_players",
  title: "Search players",
  description:
    "Free-text search across the signed-in user's players by name, club, or nationality.",
  inputSchema: {
    query: z.string().min(1).describe("Text to search across full_name, current_club, and nationality."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const like = `%${query}%`;
    const { data, error } = await supabaseForUser(ctx)
      .from("players")
      .select("id, full_name, position, nationality, current_club, date_of_birth")
      .or(`full_name.ilike.${like},current_club.ilike.${like},nationality.ilike.${like}`)
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { players: data ?? [] },
    };
  },
});
