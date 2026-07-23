import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPlayers from "./tools/list-players";
import getPlayer from "./tools/get-player";
import listReports from "./tools/list-reports";
import searchPlayers from "./tools/search-players";

// Direct Supabase issuer is required (mcp-js rejects proxy URLs whose
// discovery document publishes a different issuer). Built from the project
// ref, which Vite inlines as a literal at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "the-football-scout-mcp",
  title: "The Football Scout",
  version: "0.1.0",
  instructions:
    "Tools for The Football Scout. Use search_players / list_players to find players in the signed-in scout's database, get_player for full detail with all scouting reports, and list_reports to browse reports.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPlayers, getPlayer, listReports, searchPlayers],
});
