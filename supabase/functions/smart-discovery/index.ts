import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      .eq("scout_id", user.id);

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
      .eq("scout_id", user.id);

    if (reportsError) {
      console.error("Error fetching reports:", reportsError);
    }

    // Build player profiles with average stats
    const playerProfiles = players.map((player: PlayerData) => {
      const playerReports = reports?.filter((r) => r.player_id === player.id) || [];
      
      const avgStats: Record<string, number | null> = {};
      if (playerReports.length > 0) {
        const statKeys = [
          "overall_rating", "potential_rating", "technical_dribbling", "technical_passing",
          "technical_shooting", "technical_crossing", "technical_first_touch", "technical_heading",
          "physical_pace", "physical_strength", "physical_stamina", "physical_agility", "physical_balance",
          "tactical_positioning", "tactical_awareness", "tactical_decision_making",
          "tactical_off_ball_movement", "tactical_defensive_contribution",
          "mental_composure", "mental_concentration", "mental_leadership", "mental_work_rate", "mental_aggression"
        ];
        
        statKeys.forEach((key) => {
          const values = playerReports
            .map((r) => r[key as keyof ReportData])
            .filter((v): v is number => typeof v === "number");
          avgStats[key] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
        });
      }

      const latestReport = playerReports.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        id: player.id,
        name: player.full_name,
        position: player.position,
        club: player.current_club,
        nationality: player.nationality,
        dob: player.date_of_birth,
        age: player.date_of_birth 
          ? Math.floor((Date.now() - new Date(player.date_of_birth).getTime()) / 31557600000)
          : null,
        foot: player.preferred_foot,
        height: player.height_cm,
        weight: player.weight_kg,
        photo: player.photo_url,
        stats: avgStats,
        strengths: latestReport?.strengths,
        weaknesses: latestReport?.weaknesses,
        reportCount: playerReports.length,
      };
    });

    // Call AI to analyze query and match players
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a football scout assistant. Given a natural language search query and a database of players with their stats, find the best matching players.

IMPORTANT: You must respond with a JSON object using the exact tool format specified.

Available positions: goalkeeper, centre_back, full_back, defensive_midfielder, central_midfielder, attacking_midfielder, winger, striker

Stats are rated 1-10. Consider:
- Technical: dribbling, passing, shooting, crossing, first_touch, heading
- Physical: pace, strength, stamina, agility, balance
- Tactical: positioning, awareness, decision_making, off_ball_movement, defensive_contribution
- Mental: composure, concentration, leadership, work_rate, aggression

Be smart about interpreting the query:
- "fast" = high pace
- "strong in the air" = good heading + height
- "creative" = high passing + decision_making + off_ball_movement
- "young" = under 23
- age references like "under 25" or "between 20-25"`;

    const userPrompt = `Search query: "${query}"

Players in database:
${JSON.stringify(playerProfiles, null, 2)}

Find players that match the search criteria. Return up to 10 best matches.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
        tool_choice: { type: "function", function: { name: "return_search_results" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("Invalid AI response");
    }

    const searchResults = JSON.parse(toolCall.function.arguments);
    
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
