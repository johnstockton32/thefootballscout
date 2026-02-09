import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface PlayerData {
  id: string;
  full_name: string;
  position: string;
  current_club: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  preferred_foot: string | null;
  height_cm: number | null;
  weight_kg: number | null;
}

interface ReportData {
  player_id: string;
  overall_rating: number | null;
  potential_rating: number | null;
  technical_dribbling: number | null;
  technical_passing: number | null;
  technical_shooting: number | null;
  technical_crossing: number | null;
  technical_first_touch: number | null;
  technical_heading: number | null;
  physical_pace: number | null;
  physical_strength: number | null;
  physical_stamina: number | null;
  physical_agility: number | null;
  physical_balance: number | null;
  tactical_positioning: number | null;
  tactical_awareness: number | null;
  tactical_decision_making: number | null;
  tactical_off_ball_movement: number | null;
  tactical_defensive_contribution: number | null;
  mental_composure: number | null;
  mental_concentration: number | null;
  mental_leadership: number | null;
  mental_work_rate: number | null;
  mental_aggression: number | null;
  strengths: string | null;
  weaknesses: string | null;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub;

    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's players
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("*")
      .eq("scout_id", userId);

    if (playersError) {
      console.error("Error fetching players:", playersError);
      throw new Error("Failed to fetch players");
    }

    if (!players || players.length === 0) {
      return new Response(
        JSON.stringify({
          players: [],
          summary: "You don't have any players in your database yet. Add some players to start searching.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch reports for all players
    const playerIds = players.map((p) => p.id);
    const { data: reports, error: reportsError } = await supabase
      .from("scouting_reports")
      .select("*")
      .in("player_id", playerIds)
      .eq("scout_id", userId);

    if (reportsError) {
      console.error("Error fetching reports:", reportsError);
    }

    // Build COMPACT player profiles for faster AI processing
    const playerProfiles = players.map((player: PlayerData) => {
      const playerReports = reports?.filter((r) => r.player_id === player.id) || [];
      
      // Calculate averages more efficiently
      const avgStats: Record<string, number> = {};
      if (playerReports.length > 0) {
        const statKeys = [
          "overall_rating", "potential_rating", "technical_dribbling", "technical_passing",
          "technical_shooting", "physical_pace", "physical_strength", 
          "tactical_positioning", "tactical_awareness", "mental_composure", "mental_work_rate"
        ];
        
        statKeys.forEach((key) => {
          const values = playerReports
            .map((r) => r[key as keyof ReportData])
            .filter((v): v is number => typeof v === "number");
          if (values.length > 0) {
            avgStats[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
          }
        });
      }

      const age = player.date_of_birth 
        ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / 31557600000)
        : null;

      // Compact format - only essential data
      return {
        id: player.id,
        n: player.full_name,
        p: player.position,
        c: player.current_club || '',
        nat: player.nationality || '',
        a: age,
        f: player.preferred_foot,
        h: player.height_cm,
        ...avgStats,
      };
    });

    // Call AI with optimized prompt
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a football scout assistant. Match players from the database to the search query.

IMPORTANT: Respond using the return_search_results tool with player_id, match_score (0-1), and match_reason.

Player data format: id, n=name, p=position (goalkeeper/centre_back/full_back/defensive_midfielder/central_midfielder/attacking_midfielder/winger/striker), c=club, nat=nationality, a=age, f=foot, h=height_cm, plus stat averages (1-20 scale): overall_rating, potential_rating, technical_dribbling/passing/shooting, physical_pace/strength, tactical_positioning/awareness, mental_composure/work_rate.

Interpret queries naturally: "fast"=high pace, "young"=under 23, "creative"=high passing+awareness, "strong in the air"=heading+height.`;

    const userPrompt = `Query: "${query}"
Players: ${JSON.stringify(playerProfiles)}
Return up to 10 matches.`;

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "openai/gpt-5-nano"];
    let aiResponse: Response | null = null;
    let lastError = "";

    for (const model of models) {
      console.log(`Smart discovery trying model: ${model}`);
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_search_results",
                description: "Return the search results with matching players",
                parameters: {
                  type: "object",
                  properties: {
                    matches: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          player_id: { type: "string", description: "The player's ID" },
                          match_score: { type: "number", description: "Match score from 0 to 1" },
                          match_reason: { type: "string", description: "Brief explanation of why this player matches" },
                        },
                        required: ["player_id", "match_score", "match_reason"],
                      },
                    },
                    summary: { type: "string", description: "Brief summary of the search results" },
                  },
                  required: ["matches", "summary"],
                },
              },
            },
          ],
          tool_choice: "auto",
        }),
      });

      console.log(`Model ${model} response status:`, aiResponse.status);

      if (aiResponse.ok) break;

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      lastError = await aiResponse.text();
      console.warn(`Model ${model} failed:`, aiResponse.status, lastError);
      aiResponse = null;
    }

    if (!aiResponse || !aiResponse.ok) {
      console.error("All AI models failed. Last error:", lastError);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again in a moment." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received:", JSON.stringify(aiData).slice(0, 500));
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let searchResults;
    if (toolCall?.function?.arguments) {
      try {
        searchResults = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error("Failed to parse tool arguments:", parseError);
        throw new Error("Failed to parse AI response");
      }
    } else {
      // Fallback: try to extract from content if tool call failed
      const content = aiData.choices?.[0]?.message?.content;
      console.log("No tool call found, content:", content?.slice(0, 200));
      
      // Return empty results if AI couldn't process
      searchResults = { matches: [], summary: "No matching players found for your query." };
    }
    
    // Map results to player data
    const matchedPlayers = searchResults.matches
      .map((match: { player_id: string; match_score: number; match_reason: string }) => {
        const player = players.find((p) => p.id === match.player_id);
        if (!player) return null;
        return {
          id: player.id,
          full_name: player.full_name,
          position: player.position,
          current_club: player.current_club,
          nationality: player.nationality,
          date_of_birth: player.date_of_birth,
          photo_url: player.photo_url,
          match_reason: match.match_reason,
          match_score: match.match_score,
        };
      })
      .filter(Boolean)
      .sort((a: { match_score: number }, b: { match_score: number }) => b.match_score - a.match_score);

    return new Response(
      JSON.stringify({
        players: matchedPlayers,
        summary: searchResults.summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Smart discovery error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
