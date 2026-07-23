// Ambient declaration for the process.env used inside MCP tool handlers.
// The MCP entry and tools are bundled by @lovable.dev/mcp-js into a Deno
// Supabase Edge Function at build time; at runtime `process.env` is populated
// there. This declaration only satisfies the TypeScript checker.
declare const process: {
  env: Record<string, string | undefined>;
};
