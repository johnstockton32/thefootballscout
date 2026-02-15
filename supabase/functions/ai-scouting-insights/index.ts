import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface PlayerData {
  full_name: string;
  position: string;
  current_club: string | null;
  nationality: string | null;
  age: number | null;
}

interface ReportData {
  match_date: string;
  opposition: string | null;
  competition_level: string;
  overall_rating: number | null;
  potential_rating: number | null;
  technical_first_touch: number | null;
  technical_passing: number | null;
  technical_dribbling: number | null;
  technical_shooting: number | null;
  technical_crossing: number | null;
  technical_heading: number | null;
  tactical_positioning: number | null;
  tactical_decision_making: number | null;
  tactical_awareness: number | null;
  tactical_off_ball_movement: number | null;
  tactical_defensive_contribution: number | null;
  physical_pace: number | null;
  physical_agility: number | null;
  physical_strength: number | null;
  physical_stamina: number | null;
  physical_balance: number | null;
  mental_composure: number | null;
  mental_concentration: number | null;
  mental_work_rate: number | null;
  mental_leadership: number | null;
  mental_aggression: number | null;
  strengths: string | null;
  weaknesses: string | null;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  
  const corsHeaders = getCorsHeaders(req);

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the JWT token using getUser
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error("Auth validation failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authUser.id;
    console.log("Authenticated user:", userId);

    const { player, reports, insightType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const playerData = player as PlayerData;
    const reportsData = reports as ReportData[];

    // Build context from reports
    const reportsContext = reportsData.map((r, i) => {
      const technical = [r.technical_first_touch, r.technical_passing, r.technical_dribbling, r.technical_shooting, r.technical_crossing, r.technical_heading].filter((v): v is number => v !== null);
      const tactical = [r.tactical_positioning, r.tactical_decision_making, r.tactical_awareness, r.tactical_off_ball_movement, r.tactical_defensive_contribution].filter((v): v is number => v !== null);
      const physical = [r.physical_pace, r.physical_agility, r.physical_strength, r.physical_stamina, r.physical_balance].filter((v): v is number => v !== null);
      const mental = [r.mental_composure, r.mental_concentration, r.mental_work_rate, r.mental_leadership, r.mental_aggression].filter((v): v is number => v !== null);

      const techAvg = technical.length ? (technical.reduce((a, b) => a + b, 0) / technical.length).toFixed(1) : 'N/A';
      const tactAvg = tactical.length ? (tactical.reduce((a, b) => a + b, 0) / tactical.length).toFixed(1) : 'N/A';
      const physAvg = physical.length ? (physical.reduce((a, b) => a + b, 0) / physical.length).toFixed(1) : 'N/A';
      const mentAvg = mental.length ? (mental.reduce((a, b) => a + b, 0) / mental.length).toFixed(1) : 'N/A';

      return `Report ${i + 1} (${r.match_date}, vs ${r.opposition || 'Unknown'}, ${r.competition_level}):
- Overall: ${r.overall_rating}/20, Potential: ${r.potential_rating}/20
- Technical avg: ${techAvg}
- Tactical avg: ${tactAvg}
- Physical avg: ${physAvg}
- Mental avg: ${mentAvg}
- Strengths: ${r.strengths || 'Not specified'}
- Weaknesses: ${r.weaknesses || 'Not specified'}`;
    }).join('\n\n');

    let systemPrompt = '';
    let userPrompt = '';

    switch (insightType) {
      case 'development':
        systemPrompt = `You are an elite football scout and player development specialist. Provide actionable, specific development recommendations based on scouting data. Focus on concrete drills, training focus areas, and realistic timelines. Be concise but comprehensive. IMPORTANT: Write in clear, plain text paragraphs. Do NOT use markdown formatting, bullet points, asterisks, headers, or special symbols. Use natural sentence structure with clear sections separated by line breaks.`;
        userPrompt = `Analyze this player and provide development recommendations:

Player: ${playerData.full_name}
Position: ${playerData.position}
Club: ${playerData.current_club || 'Unknown'}
Age: ${playerData.age || 'Unknown'}

Scouting Reports:
${reportsContext}

Write your analysis in clear paragraphs covering: the top 3 priority development areas with specific training recommendations, a timeline for improvement over 3, 6, and 12 months, potential position versatility based on attributes, and key attributes to maintain as strengths. Use plain text only, no formatting.`;
        break;

      case 'comparison':
        systemPrompt = `You are an expert football analyst who compares players to professional footballers. Provide realistic comparisons based on playing style and attribute profiles, not just hype. IMPORTANT: Write in clear, plain text paragraphs. Do NOT use markdown formatting, bullet points, asterisks, headers, or special symbols. Use natural sentence structure.`;
        userPrompt = `Based on this player's profile, suggest professional player comparisons:

Player: ${playerData.full_name}
Position: ${playerData.position}
Age: ${playerData.age || 'Unknown'}

Scouting Data:
${reportsContext}

Write 2-3 professional player comparisons in clear paragraphs. For each comparison, explain the player name and why they are comparable, the key similar attributes, and what this player would need to reach that level. Use plain text only, no formatting.`;
        break;

      case 'transfer':
        systemPrompt = `You are a football transfer market analyst. Provide realistic transfer valuations and recommendations based on player attributes, age, and market trends. Be specific about suitable leagues and club types. IMPORTANT: Write in clear, plain text paragraphs. Do NOT use markdown formatting, bullet points, asterisks, headers, or special symbols. Use natural sentence structure.`;
        userPrompt = `Provide transfer market analysis for this player:

Player: ${playerData.full_name}
Position: ${playerData.position}
Club: ${playerData.current_club || 'Unknown'}
Age: ${playerData.age || 'Unknown'}
Nationality: ${playerData.nationality || 'Unknown'}

Performance Data:
${reportsContext}

Write your analysis in clear paragraphs covering: suitable league levels such as Championship or League One, types of clubs that would benefit from this player, an estimated market value range, and the best transfer window timing recommendation. Use plain text only, no formatting.`;
        break;

      default: // summary
        systemPrompt = `You are a professional football scout providing executive summaries. Be concise, insightful, and focus on what makes this player unique or concerning. IMPORTANT: Write in clear, plain text sentences. Do NOT use markdown formatting, bullet points, asterisks, headers, or special symbols.`;
        userPrompt = `Provide a brief executive summary of this player:

Player: ${playerData.full_name}
Position: ${playerData.position}
Club: ${playerData.current_club || 'Unknown'}
Age: ${playerData.age || 'Unknown'}

Scouting Reports:
${reportsContext}

Write a 3-4 sentence summary in plain text covering the overall assessment and standout qualities, any key concern or area to monitor, and your recommendation (sign, monitor, or pass). Use plain text only, no formatting.`;
    }

    console.log("Sending request to AI gateway with insight type:", insightType);
    console.log("Player:", playerData.full_name, "Reports count:", reportsData.length);
    
    const models = ["openai/gpt-5", "openai/gpt-5.2", "google/gemini-2.5-pro", "google/gemini-3-pro-preview", "openai/gpt-5-mini"];
    
    let response: Response | null = null;
    let lastError = "";

    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 1500));
          console.log(`Retrying model ${model}, attempt ${attempt + 1}`);
        }
        
        console.log(`Trying model: ${model}`);
        try {
          response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              temperature: 0.7,
            }),
          });

          console.log(`Model ${model} response status:`, response.status);

          if (response.ok) break;

          lastError = await response.text();
          console.warn(`Model ${model} failed (attempt ${attempt + 1}):`, response.status, lastError);
          response = null;
        } catch (fetchError) {
          console.warn(`Model ${model} fetch error (attempt ${attempt + 1}):`, fetchError);
          response = null;
        }
      }
      
      if (response?.ok) break;
    }

    if (!response || !response.ok) {
      const status = response?.status || 500;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.warn("AI gateway unavailable, using local fallback insights");
      const fallbackInsight = generateLocalInsight(playerData, reportsData, insightType);
      return new Response(
        JSON.stringify({ insight: fallbackInsight, insightType, fallback: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "Unable to generate insight.";

    return new Response(
      JSON.stringify({ insight, insightType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI insights error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateLocalInsight(player: PlayerData, reports: ReportData[], type: string): string {
  if (!reports.length) return `No scouting reports available for ${player.full_name} to generate insights.`;

  const latest = reports[reports.length - 1];
  const avg = (vals: (number | null)[]) => {
    const nums = vals.filter((v): v is number => v !== null);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  };

  const techAvg = avg([latest.technical_first_touch, latest.technical_passing, latest.technical_dribbling, latest.technical_shooting, latest.technical_crossing, latest.technical_heading]);
  const tactAvg = avg([latest.tactical_positioning, latest.tactical_decision_making, latest.tactical_awareness, latest.tactical_off_ball_movement, latest.tactical_defensive_contribution]);
  const physAvg = avg([latest.physical_pace, latest.physical_agility, latest.physical_strength, latest.physical_stamina, latest.physical_balance]);
  const mentAvg = avg([latest.mental_composure, latest.mental_concentration, latest.mental_work_rate, latest.mental_leadership, latest.mental_aggression]);

  const categories = [
    { name: "Technical", avg: techAvg },
    { name: "Tactical", avg: tactAvg },
    { name: "Physical", avg: physAvg },
    { name: "Mental", avg: mentAvg },
  ].sort((a, b) => b.avg - a.avg);

  const strongest = categories[0];
  const weakest = categories[categories.length - 1];
  const rating = latest.overall_rating ?? 0;
  const potential = latest.potential_rating ?? 0;

  switch (type) {
    case "development":
      return `${player.full_name} shows the most room for growth in ${weakest.name.toLowerCase()} attributes (avg ${weakest.avg.toFixed(1)}/20). Their strongest area is ${strongest.name.toLowerCase()} (avg ${strongest.avg.toFixed(1)}/20). With an overall rating of ${rating} and potential of ${potential}, focused training on ${weakest.name.toLowerCase()} skills could unlock significant improvement. ${latest.weaknesses ? "Key areas to address: " + latest.weaknesses : ""} ${latest.strengths ? "Building on existing strengths: " + latest.strengths : ""}`;

    case "comparison":
      return `${player.full_name} plays as a ${player.position.replace(/_/g, " ")} with a ${strongest.name.toLowerCase()}-first profile (avg ${strongest.avg.toFixed(1)}/20). Their overall rating of ${rating} with ${potential} potential suggests a player who could develop into a solid performer at this level. ${latest.strengths ? "Standout qualities include: " + latest.strengths : ""} A more detailed AI comparison will be available when the service recovers.`;

    case "transfer":
      const tierLabel = rating >= 75 ? "upper-tier" : rating >= 60 ? "mid-tier" : "development-level";
      return `${player.full_name} profiles as a ${tierLabel} ${player.position.replace(/_/g, " ")}${player.current_club ? " currently at " + player.current_club : ""}. With an overall rating of ${rating} and potential of ${potential}, they could suit clubs looking for ${strongest.name.toLowerCase()} quality. ${latest.strengths ? "Key selling points: " + latest.strengths : ""} ${latest.weaknesses ? "Considerations: " + latest.weaknesses : ""} Full market analysis will be available when the AI service recovers.`;

    default:
      return `${player.full_name} is a ${player.position.replace(/_/g, " ")}${player.current_club ? " at " + player.current_club : ""} rated ${rating}/20 with ${potential}/20 potential. Their strongest category is ${strongest.name.toLowerCase()} (${strongest.avg.toFixed(1)}/20) while ${weakest.name.toLowerCase()} (${weakest.avg.toFixed(1)}/20) could use improvement. ${latest.strengths ? latest.strengths : ""} Based on ${reports.length} report(s) observed.`;
  }
}
