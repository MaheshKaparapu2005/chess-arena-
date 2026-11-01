import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

interface DeepDiveRequestBody {
  move?: {
    san: string;
    from?: string;
    to?: string;
    piece?: string;
    captured?: string;
  };
  turn?: 'w' | 'b';
  ply?: number;
  moveNumber?: number;
  fen?: string;
  evalBefore?: number;
  evalAfter?: number;
  evalDelta?: number;
  classification?: string;
  bestMoveSan?: string;
  bestMoveReason?: string;
  recentPgn?: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
}

export interface DeepDiveResponse {
  summary: string;
  tacticalIdea: string;
  strategicContext: string;
  recommendedAlternative: string;
  grandmasterTakeaway: string;
  evaluationTrend: string;
  isAiGenerated: boolean;
}

function generateFallbackDeepDive(body: DeepDiveRequestBody): DeepDiveResponse {
  const moveSan = body.move?.san || 'this move';
  const moverColor = body.turn === 'w' ? 'White' : 'Black';
  const opponentColor = body.turn === 'w' ? 'Black' : 'White';
  const classification = (body.classification || 'good').toLowerCase();
  const delta = body.evalDelta !== undefined ? Number(body.evalDelta.toFixed(2)) : 0;
  const bestMove = body.bestMoveSan || 'a calmer alternative';
  const evalBefore = body.evalBefore !== undefined ? (body.evalBefore > 0 ? `+${body.evalBefore.toFixed(1)}` : body.evalBefore.toFixed(1)) : '0.0';
  const evalAfter = body.evalAfter !== undefined ? (body.evalAfter > 0 ? `+${body.evalAfter.toFixed(1)}` : body.evalAfter.toFixed(1)) : '0.0';

  if (classification === 'blunder') {
    return {
      summary: `${moverColor} made a critical blunder with ${moveSan}, swinging the position sharply by ${Math.abs(delta)} pawns in ${opponentColor}'s favor.`,
      tacticalIdea: `${moveSan} overlooks an immediate tactical vulnerability or leaves a vital defensive outpost undefended, opening the door for ${opponentColor} to seize decisive counterplay or material.`,
      strategicContext: `This move severely compromises ${moverColor}'s king shelter or leaves overloaded pieces vulnerable without sufficient compensation in central control or tempo.`,
      recommendedAlternative: `The engine highlights ${bestMove} as the required move to maintain stability (${evalBefore}), containing ${opponentColor}'s threats before expanding.`,
      grandmasterTakeaway: `Before playing a forcing or aggressive move, always verify your opponent's most direct checks, captures, and threats (C-C-T principle).`,
      evaluationTrend: `Evaluation dropped drastically from ${evalBefore} to ${evalAfter} (${delta > 0 ? `+${delta}` : delta} pawns).`,
      isAiGenerated: false,
    };
  }

  if (classification === 'mistake') {
    return {
      summary: `${moveSan} is a noticeable mistake that relinquishes ${moverColor}'s positional pressure and concedes the initiative.`,
      tacticalIdea: `While not immediately dropping a full piece, ${moveSan} misplaces a vital piece or permits an unpleasant positional bind that ${opponentColor} can exploit.`,
      strategicContext: `By playing ${moveSan}, ${moverColor} surrenders key dark or light squares and weakens coordination among the rooks and minors.`,
      recommendedAlternative: `${bestMove} was considerably stronger, keeping dynamic tension and exerting maximum pressure on ${opponentColor}'s weaknesses.`,
      grandmasterTakeaway: `When having several attractive moves, calculate which one keeps your opponent under maximum defensive restriction.`,
      evaluationTrend: `Evaluation shifted from ${evalBefore} to ${evalAfter} (${delta > 0 ? `+${delta}` : delta} pawns).`,
      isAiGenerated: false,
    };
  }

  if (classification === 'inaccuracy') {
    return {
      summary: `${moveSan} is a slight inaccuracy that misses the most incisive continuation in the position.`,
      tacticalIdea: `${moveSan} isn't tactically losing, but it lets ${opponentColor} untangle and equalise more easily than the sharper alternative.`,
      strategicContext: `The move is slightly passive and delays piece activation, giving ${opponentColor} a free tempo to shore up defensive weaknesses.`,
      recommendedAlternative: `The engine preferred ${bestMove}, which immediately challenges open lines and targets vulnerable enemy outposts.`,
      grandmasterTakeaway: `Strive for harmonious piece placement where every piece coordinates toward a unified central goal.`,
      evaluationTrend: `Small evaluation dip from ${evalBefore} to ${evalAfter}.`,
      isAiGenerated: false,
    };
  }

  if (classification === 'brilliant' || classification === 'best') {
    return {
      summary: `Outstanding play! ${moveSan} is the absolute top engine choice, seizing command of the board with clinical accuracy.`,
      tacticalIdea: `${moveSan} combines deep prophylactic defense with lethal tactical threats that restrict ${opponentColor}'s legal options to purely passive defenses.`,
      strategicContext: `This move maximizes piece harmony, solidifies central dominance, and creates long-term structural superiority that cannot easily be challenged.`,
      recommendedAlternative: `${moveSan} was the single best move found by the engine, demonstrating grandmaster-level positional vision.`,
      grandmasterTakeaway: `When you find a harmonious move that coordinates pieces while neutralizing your opponent's ideas, you dictate the entire game tempo.`,
      evaluationTrend: `Maintained a strong position: ${evalAfter} pawns.`,
      isAiGenerated: false,
    };
  }

  return {
    summary: `${moveSan} is a solid, functional move by ${moverColor} that maintains the current balance of the position.`,
    tacticalIdea: `The move preserves tactical safety and avoids tactical traps while continuing normal piece development and central presence.`,
    strategicContext: `This move contributes to steady board control and prepares future coordination along active diagonals and files.`,
    recommendedAlternative: `${bestMove ? `The alternative ${bestMove} was also viable` : 'The move fits well into the overall game plan'}.`,
    grandmasterTakeaway: `Consistent, purposeful moves build a rock-solid foundation for decisive middlegame tactics.`,
    evaluationTrend: `Position evaluated at ${evalAfter} pawns.`,
    isAiGenerated: false,
  };
}

router.post('/deep-dive', async (req: Request, res: Response) => {
  const body: DeepDiveRequestBody = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const fallback = generateFallbackDeepDive(body);
    return res.json(fallback);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const moverColor = body.turn === 'w' ? 'White' : 'Black';
    const opponentColor = body.turn === 'w' ? 'Black' : 'White';
    const moveSan = body.move?.san || 'Unknown move';
    const classification = body.classification || 'good';
    const evalBefore = body.evalBefore !== undefined ? (body.evalBefore > 0 ? `+${body.evalBefore.toFixed(2)}` : body.evalBefore.toFixed(2)) : '0.0';
    const evalAfter = body.evalAfter !== undefined ? (body.evalAfter > 0 ? `+${body.evalAfter.toFixed(2)}` : body.evalAfter.toFixed(2)) : '0.0';
    const delta = body.evalDelta !== undefined ? body.evalDelta.toFixed(2) : '0.0';

    const prompt = `Analyze this specific chess move during a post-game review as a Grandmaster coach:

- Player moving: ${moverColor} (${body.turn === 'w' ? body.whitePlayerName || 'White' : body.blackPlayerName || 'Black'})
- Move played: ${moveSan} (Move number: ${body.moveNumber ? Math.ceil(body.moveNumber / 2) : 1}, Ply: ${body.ply || 1})
- Opponent: ${opponentColor} (${body.turn === 'w' ? body.blackPlayerName || 'Black' : body.whitePlayerName || 'White'})
- Engine Classification: ${classification.toUpperCase()}
- Evaluation before move: ${evalBefore} pawns (White perspective)
- Evaluation after move: ${evalAfter} pawns (White perspective)
- Evaluation impact on player: ${delta} pawns
- Engine Recommended Best Move: ${body.bestMoveSan || 'N/A'}
${body.recentPgn ? `- Game context / recent moves: ${body.recentPgn}` : ''}
${body.fen ? `- Board FEN: ${body.fen}` : ''}

Respond in JSON with these exact fields:
{
  "summary": "1-2 punchy, educational sentences explaining the move and its consequences",
  "tacticalIdea": "Deep dive into immediate tactical threats, pins, forks, sacrifices, or tactics overlooked by this move",
  "strategicContext": "Positional explanation regarding pawn structure, king safety, open files, outpost squares, or piece activity",
  "recommendedAlternative": "Explanation of why the engine recommendation (${body.bestMoveSan || 'the best move'}) was better or why this move was optimal",
  "grandmasterTakeaway": "A memorable rule of thumb or core chess principle that the player should apply in future games",
  "evaluationTrend": "Brief summary of how the evaluation swung, e.g. 'Shifted +0.4 to -2.8 (decisive mistake)'"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite International Grandmaster chess educator. Your job is to provide crisp, deeply instructive, and encouraging move analysis for club and tournament players. Return pure, valid JSON only.',
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return res.json({
      summary: parsed.summary || generateFallbackDeepDive(body).summary,
      tacticalIdea: parsed.tacticalIdea || generateFallbackDeepDive(body).tacticalIdea,
      strategicContext: parsed.strategicContext || generateFallbackDeepDive(body).strategicContext,
      recommendedAlternative: parsed.recommendedAlternative || generateFallbackDeepDive(body).recommendedAlternative,
      grandmasterTakeaway: parsed.grandmasterTakeaway || generateFallbackDeepDive(body).grandmasterTakeaway,
      evaluationTrend: parsed.evaluationTrend || generateFallbackDeepDive(body).evaluationTrend,
      isAiGenerated: true,
    });
  } catch (err: any) {
    console.error('[Chess Arena] Gemini Deep Dive analysis error:', err?.message || err);
    // Return high quality heuristic fallback on error
    const fallback = generateFallbackDeepDive(body);
    return res.json(fallback);
  }
});

export default router;
