export interface DeepDiveAnalysisResult {
  summary: string;
  tacticalIdea: string;
  strategicContext: string;
  recommendedAlternative: string;
  grandmasterTakeaway: string;
  evaluationTrend: string;
  isAiGenerated: boolean;
}

export interface DeepDiveRequestPayload {
  move: {
    san: string;
    from?: string;
    to?: string;
    piece?: string;
    captured?: string;
  };
  turn: 'w' | 'b';
  ply: number;
  moveNumber: number;
  fen?: string;
  evalBefore: number;
  evalAfter: number;
  evalDelta: number;
  classification: string;
  bestMoveSan?: string;
  bestMoveReason?: string;
  recentPgn?: string;
  whitePlayerName?: string;
  blackPlayerName?: string;
}

class DeepDiveService {
  private cache: Map<string, DeepDiveAnalysisResult> = new Map();

  public async getDeepDiveAnalysis(payload: DeepDiveRequestPayload): Promise<DeepDiveAnalysisResult> {
    const cacheKey = `${payload.ply}_${payload.move.san}_${payload.classification}_${payload.evalDelta}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const res = await fetch('/api/analysis/deep-dive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Deep dive server error: HTTP ${res.status}`);
      }

      const data: DeepDiveAnalysisResult = await res.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (err) {
      console.error('[DeepDiveService] Failed to fetch Gemini deep dive analysis:', err);
      const isBlunder = payload.classification === 'blunder' || payload.classification === 'mistake';
      const mover = payload.turn === 'w' ? 'White' : 'Black';
      const opponent = payload.turn === 'w' ? 'Black' : 'White';

      const fallback: DeepDiveAnalysisResult = {
        summary: `${mover} played ${payload.move.san}, classified as a ${payload.classification} by the engine (${payload.evalDelta > 0 ? `+${payload.evalDelta.toFixed(1)}` : payload.evalDelta.toFixed(1)} pawns).`,
        tacticalIdea: isBlunder
          ? `Tactical analysis reveals this move permits ${opponent} to create immediate checks, skewers, or capture hanging material without sufficient defensive counterplay.`
          : `This move preserves piece stability, contests critical squares, and keeps the tactical initiative intact without conceding free tempos.`,
        strategicContext: `Evaluating pawn structure and center control: maintain active pieces and protect king diagonals to prevent tactical breaches.`,
        recommendedAlternative: payload.bestMoveSan
          ? `The engine preferred ${payload.bestMoveSan} (${payload.bestMoveReason || 'optimal continuation'}).`
          : 'The chosen move is aligned with the overall strategic plan.',
        grandmasterTakeaway: isBlunder
          ? 'Always scan all opponent checks, captures, and threats before finalizing your candidate move.'
          : 'Prophylaxis and active piece coordination form the foundation of master-level play.',
        evaluationTrend: `Evaluation transitioned from ${payload.evalBefore > 0 ? `+${payload.evalBefore.toFixed(1)}` : payload.evalBefore.toFixed(1)} to ${payload.evalAfter > 0 ? `+${payload.evalAfter.toFixed(1)}` : payload.evalAfter.toFixed(1)}.`,
        isAiGenerated: false,
      };
      return fallback;
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const deepDiveService = new DeepDiveService();
