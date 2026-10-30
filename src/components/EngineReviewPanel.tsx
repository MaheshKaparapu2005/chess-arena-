import React from 'react';
import {
  GameAnalysisReport,
  MoveAnalysis,
  MoveClassificationType,
} from '../models/chess';
import { formatEvaluation } from '../services/chess-eval.service';
import { soundManager } from '../services/sound.service';
import {
  Cpu,
  X,
  AlertTriangle,
  Zap,
  CheckCircle,
  HelpCircle,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  Sparkles,
  Info,
  BarChart2,
} from 'lucide-react';

interface EngineReviewPanelProps {
  report: GameAnalysisReport;
  currentStep: number;
  totalSteps: number;
  whitePlayerName: string;
  blackPlayerName: string;
  onSelectStep: (step: number) => void;
  onCloseReview: () => void;
  showBestAlternative: boolean;
  onToggleBestAlternative: () => void;
  showEvalBar?: boolean;
  onToggleEvalBar?: () => void;
}

export const EngineReviewPanel: React.FC<EngineReviewPanelProps> = ({
  report,
  currentStep,
  totalSteps,
  whitePlayerName,
  blackPlayerName,
  onSelectStep,
  onCloseReview,
  showBestAlternative,
  onToggleBestAlternative,
  showEvalBar = true,
  onToggleEvalBar,
}) => {
  // Current position evaluation
  const currentEval =
    currentStep >= 0 && currentStep < report.evaluations.length
      ? report.evaluations[currentStep]
      : 0;

  // Analysis for the move just played leading into currentStep (step 1 = move 0)
  const currentMoveAnalysis: MoveAnalysis | undefined =
    currentStep > 0 && currentStep <= report.moves.length
      ? report.moves[currentStep - 1]
      : undefined;

  // Win chance for White (0 - 100%)
  const whiteAdvantagePct = Math.max(
    5,
    Math.min(95, 50 + 50 * (2 / (1 + Math.exp(-0.004 * (currentEval * 100))) - 1))
  );

  // Jump to next blunder or mistake
  const handleJumpToNextBlunder = () => {
    const startIndex = Math.max(0, currentStep);
    for (let i = startIndex; i < report.moves.length; i++) {
      const m = report.moves[i];
      if (m.classification === 'blunder' || m.classification === 'mistake') {
        onSelectStep(i + 1);
        soundManager.playBlunderAlert();
        return;
      }
    }
    // Loop back from start if not found after current
    for (let i = 0; i < startIndex; i++) {
      const m = report.moves[i];
      if (m.classification === 'blunder' || m.classification === 'mistake') {
        onSelectStep(i + 1);
        soundManager.playBlunderAlert();
        return;
      }
    }
  };

  const handleJumpToPrevBlunder = () => {
    const startIndex = Math.max(0, currentStep - 2);
    for (let i = startIndex; i >= 0; i--) {
      const m = report.moves[i];
      if (m.classification === 'blunder' || m.classification === 'mistake') {
        onSelectStep(i + 1);
        soundManager.playBlunderAlert();
        return;
      }
    }
    // Wrap around to end
    for (let i = report.moves.length - 1; i > startIndex; i--) {
      const m = report.moves[i];
      if (m.classification === 'blunder' || m.classification === 'mistake') {
        onSelectStep(i + 1);
        soundManager.playBlunderAlert();
        return;
      }
    }
  };

  const classificationConfig: Record<
    MoveClassificationType,
    { label: string; symbol: string; color: string; badge: string; icon: React.ReactNode }
  > = {
    brilliant: {
      label: 'Brilliant',
      symbol: '!!',
      color: 'text-teal-400',
      badge: 'bg-teal-400/20 text-teal-300 border-teal-500/40',
      icon: <Sparkles className="w-3.5 h-3.5 text-teal-400" />,
    },
    best: {
      label: 'Best',
      symbol: '★',
      color: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
    },
    excellent: {
      label: 'Excellent',
      symbol: '✓',
      color: 'text-sky-400',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      icon: <CheckCircle className="w-3.5 h-3.5 text-sky-400" />,
    },
    good: {
      label: 'Good',
      symbol: '✓',
      color: 'text-stone-300',
      badge: 'bg-stone-700/40 text-stone-300 border-stone-600',
      icon: <CheckCircle className="w-3.5 h-3.5 text-stone-400" />,
    },
    inaccuracy: {
      label: 'Inaccuracy',
      symbol: '?!',
      color: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" />,
    },
    mistake: {
      label: 'Mistake',
      symbol: '?',
      color: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
    },
    blunder: {
      label: 'Blunder',
      symbol: '??',
      color: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300 border-red-500/40',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-red-400" />,
    },
  };

  const totalBlunders =
    (report.whiteCounts.blunder || 0) + (report.blackCounts.blunder || 0);
  const totalMistakes =
    (report.whiteCounts.mistake || 0) + (report.blackCounts.mistake || 0);

  return (
    <div className="flex flex-col bg-stone-900 border border-stone-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-950/80 border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
              <span>Engine Review</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                AI Depth 14
              </span>
            </h3>
            <p className="text-[11px] text-stone-400">Tactical analysis & blunder classification</p>
          </div>
        </div>

        <button
          onClick={onCloseReview}
          className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          title="Exit review"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Dynamic Evaluation Meter */}
        <div className="space-y-1.5 p-3 rounded-xl bg-stone-950/60 border border-stone-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-300 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Position Eval</span>
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-100">
                {formatEvaluation(currentEval)}
              </span>
              <span className="text-[11px] text-stone-400">
                {currentEval > 0 ? 'White ahead' : currentEval < 0 ? 'Black ahead' : 'Equal'}
              </span>
            </div>
          </div>

          {/* Dual Color Advantage Bar */}
          <div className="relative w-full h-3 rounded-full overflow-hidden bg-stone-800 border border-stone-700 shadow-inner flex">
            <div
              className="h-full bg-stone-100 transition-all duration-300"
              style={{ width: `${whiteAdvantagePct}%` }}
              title={`White advantage: ${Math.round(whiteAdvantagePct)}%`}
            />
            <div
              className="h-full bg-stone-900 transition-all duration-300"
              style={{ width: `${100 - whiteAdvantagePct}%` }}
              title={`Black advantage: ${Math.round(100 - whiteAdvantagePct)}%`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-stone-400 font-mono">
            <span>White {Math.round(whiteAdvantagePct)}%</span>
            <span>Black {Math.round(100 - whiteAdvantagePct)}%</span>
          </div>
        </div>

        {/* Accuracy Comparison Card */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-stone-400 truncate max-w-full">
              {whitePlayerName} (W)
            </span>
            <span className="text-xl font-black text-emerald-400 mt-0.5">
              {report.whiteAccuracy}%
            </span>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Accuracy
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-stone-400 truncate max-w-full">
              {blackPlayerName} (B)
            </span>
            <span className="text-xl font-black text-sky-400 mt-0.5">
              {report.blackAccuracy}%
            </span>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
              Accuracy
            </span>
          </div>
        </div>

        {/* Current Move Detail Card */}
        {currentMoveAnalysis ? (
          <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-stone-200">
                  Move {Math.ceil(currentMoveAnalysis.ply / 2)}
                  {currentMoveAnalysis.turn === 'w' ? '.' : '...'} {currentMoveAnalysis.move.san}
                </span>
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    classificationConfig[currentMoveAnalysis.classification].badge
                  }`}
                >
                  {classificationConfig[currentMoveAnalysis.classification].icon}
                  <span>{currentMoveAnalysis.classificationLabel}</span>
                  <span className="font-mono ml-0.5">
                    {classificationConfig[currentMoveAnalysis.classification].symbol}
                  </span>
                </span>
              </div>

              <span className="font-mono text-xs font-semibold text-stone-400">
                {currentMoveAnalysis.evalDelta > 0
                  ? `+${currentMoveAnalysis.evalDelta}`
                  : `${currentMoveAnalysis.evalDelta}`}{' '}
                pawns
              </span>
            </div>

            {/* Commentary explanation */}
            <p className="text-xs text-stone-300 leading-relaxed">
              {currentMoveAnalysis.commentary}
            </p>

            {/* Recommended Move Box (if not already best) */}
            {currentMoveAnalysis.classification !== 'best' &&
              currentMoveAnalysis.classification !== 'brilliant' && (
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
                    <span className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>Best Alternative: {currentMoveAnalysis.bestMoveSan}</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-400/80">
                      Eval {formatEvaluation(currentMoveAnalysis.evalBefore)}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    {currentMoveAnalysis.bestMoveReason}
                  </p>
                </div>
              )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800 text-center space-y-1 text-xs text-stone-400">
            <span className="font-bold text-stone-200">Initial Board Position</span>
            <p className="text-[11px]">Select any move or click "Next Blunder" to inspect game turning points.</p>
          </div>
        )}

        {/* Key Moments Navigator (Blunders & Mistakes) */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleJumpToPrevBlunder}
            disabled={totalBlunders + totalMistakes === 0}
            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700 disabled:opacity-40 transition-colors cursor-pointer"
            title="Jump to previous blunder/mistake"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev Blunder</span>
          </button>

          <button
            onClick={handleJumpToNextBlunder}
            disabled={totalBlunders + totalMistakes === 0}
            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-red-950/70 hover:bg-red-900/80 text-red-300 border border-red-500/40 text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-40"
            title="Jump to next blunder/mistake"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Next Blunder</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stepper Toolbar */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-stone-950 border border-stone-800">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onSelectStep(0)}
              disabled={currentStep === 0}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 cursor-pointer"
              title="First move"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 cursor-pointer"
              title="Previous move"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs font-mono font-semibold text-stone-300">
            Step {currentStep} / {totalSteps}
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onSelectStep(Math.min(totalSteps, currentStep + 1))}
              disabled={currentStep >= totalSteps}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 cursor-pointer"
              title="Next move"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectStep(totalSteps)}
              disabled={currentStep >= totalSteps}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 cursor-pointer"
              title="Latest move"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Evaluation Sparkline Graph across game */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span>Evaluation Momentum</span>
            <span className="font-mono text-[10px]">White (+) / Black (-)</span>
          </div>
          <div className="relative w-full h-12 bg-stone-950 rounded-lg border border-stone-800 overflow-hidden flex items-center">
            {/* Center 0.0 line */}
            <div className="absolute w-full top-1/2 -translate-y-1/2 border-b border-stone-800" />

            {/* Sparkline bars */}
            <div className="w-full h-full flex items-center px-1">
              {report.evaluations.map((ev, idx) => {
                const isSelected = idx === currentStep;
                // Height clamped from 4px to 22px
                const barHeight = Math.min(22, Math.max(3, Math.abs(ev) * 4));
                const isWhiteAdv = ev >= 0;

                return (
                  <button
                    key={idx}
                    onClick={() => onSelectStep(idx)}
                    title={`Step ${idx}: ${formatEvaluation(ev)}`}
                    className="flex-1 h-full flex flex-col justify-center items-center group relative cursor-pointer"
                  >
                    <div
                      className={`w-full max-w-[5px] rounded-xs transition-all ${
                        isSelected
                          ? 'bg-amber-400 ring-2 ring-amber-400 z-10'
                          : isWhiteAdv
                          ? 'bg-emerald-400/80 group-hover:bg-emerald-300'
                          : 'bg-sky-400/80 group-hover:bg-sky-300'
                      }`}
                      style={{
                        height: `${barHeight}px`,
                        marginTop: isWhiteAdv ? `-${barHeight / 2}px` : `${barHeight / 2}px`,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Classification Breakdown Table */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Move Classification
          </span>
          <div className="rounded-xl border border-stone-800 bg-stone-950/60 overflow-hidden text-xs">
            <div className="grid grid-cols-12 py-1.5 px-3 bg-stone-900/60 border-b border-stone-800/80 text-[10px] font-semibold text-stone-400 uppercase">
              <span className="col-span-6">Category</span>
              <span className="col-span-3 text-center">White</span>
              <span className="col-span-3 text-center">Black</span>
            </div>

            {(['brilliant', 'best', 'excellent', 'inaccuracy', 'mistake', 'blunder'] as MoveClassificationType[]).map(
              (cat) => {
                const conf = classificationConfig[cat];
                const whiteCount = report.whiteCounts[cat] || 0;
                const blackCount = report.blackCounts[cat] || 0;

                return (
                  <div
                    key={cat}
                    className="grid grid-cols-12 py-1 px-3 border-b border-stone-800/40 hover:bg-stone-900/30 items-center text-xs"
                  >
                    <div className="col-span-6 flex items-center space-x-1.5">
                      <span className="font-mono text-[11px] font-black w-4 text-center">
                        {conf.symbol}
                      </span>
                      <span className={`font-semibold ${conf.color}`}>{conf.label}</span>
                    </div>
                    <span className="col-span-3 text-center font-mono font-bold text-stone-200">
                      {whiteCount}
                    </span>
                    <span className="col-span-3 text-center font-mono font-bold text-stone-200">
                      {blackCount}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Show Best Alternative Toggle */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-stone-950/80 border border-stone-800 text-xs">
          <div className="flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-stone-300 font-medium">Highlight Best Move On Board</span>
          </div>
          <button
            onClick={onToggleBestAlternative}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              showBestAlternative ? 'bg-emerald-500' : 'bg-stone-700'
            }`}
            title="Toggle best alternative move arrows"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                showBestAlternative ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Side Evaluation Bar Toggle */}
        {onToggleEvalBar && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-stone-950/80 border border-stone-800 text-xs">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-stone-300 font-medium">Side Evaluation Bar</span>
            </div>
            <button
              onClick={onToggleEvalBar}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                showEvalBar ? 'bg-emerald-500' : 'bg-stone-700'
              }`}
              title="Toggle vertical evaluation thermometer bar on side of board"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  showEvalBar ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
