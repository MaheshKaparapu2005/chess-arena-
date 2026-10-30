import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Move, GameAnalysisReport } from '../models/chess';
import {
  History,
  Copy,
  Check,
  Download,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  BookOpen,
  Eye,
  Radio,
} from 'lucide-react';
import { identifyOpening } from '../services/chess-openings';

export interface MoveHistoryProps {
  moves: Move[];
  currentStep: number; // 0 = initial position, 1 = after move 1, ..., moves.length = latest
  onSelectStep: (step: number) => void;
  onGoToStart: () => void;
  onGoToPrev: () => void;
  onGoToNext: () => void;
  onGoToLive: () => void;
  isLive: boolean;
  whitePlayerName?: string;
  blackPlayerName?: string;
  analysisReport?: GameAnalysisReport | null;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  currentStep,
  onSelectStep,
  onGoToStart,
  onGoToPrev,
  onGoToNext,
  onGoToLive,
  isLive,
  whitePlayerName = 'White',
  blackPlayerName = 'Black',
  analysisReport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const [copied, setCopied] = useState(false);
  const [isPlayingReplay, setIsPlayingReplay] = useState(false);

  // Group moves into pairs: [White move, Black move]
  const movePairs = useMemo(() => {
    const pairs: {
      number: number;
      white: { move: Move; step: number };
      black?: { move: Move; step: number };
    }[] = [];

    for (let i = 0; i < moves.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: {
          move: moves[i],
          step: i + 1,
        },
        black: moves[i + 1]
          ? {
              move: moves[i + 1],
              step: i + 2,
            }
          : undefined,
      });
    }
    return pairs;
  }, [moves]);

  // Detected opening
  const opening = useMemo(() => identifyOpening(moves), [moves]);

  // Classification badge for moves in review mode
  const renderMoveBadge = (step: number) => {
    if (!analysisReport || step <= 0 || step > analysisReport.moves.length) return null;
    const analysis = analysisReport.moves[step - 1];
    const cat = analysis.classification;
    if (cat === 'good') return null;

    let badgeClass = '';
    let symbol = '';

    switch (cat) {
      case 'brilliant':
        badgeClass = 'bg-teal-400 text-stone-950 font-black';
        symbol = '!!';
        break;
      case 'best':
        badgeClass = 'bg-emerald-500 text-stone-950 font-black';
        symbol = '★';
        break;
      case 'excellent':
        badgeClass = 'bg-sky-500 text-white font-bold';
        symbol = '✓';
        break;
      case 'inaccuracy':
        badgeClass = 'bg-amber-400 text-stone-950 font-black';
        symbol = '?!';
        break;
      case 'mistake':
        badgeClass = 'bg-orange-500 text-white font-black';
        symbol = '?';
        break;
      case 'blunder':
        badgeClass = 'bg-red-600 text-white font-black animate-pulse';
        symbol = '??';
        break;
    }

    return (
      <span
        className={`ml-1 px-1 py-0.2 rounded text-[9px] font-mono leading-none ${badgeClass}`}
        title={`${analysis.classificationLabel}: ${analysis.commentary}`}
      >
        {symbol}
      </span>
    );
  };

  // Auto-scroll to active move button when currentStep changes
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [currentStep]);

  // Auto-replay interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingReplay) {
      interval = setInterval(() => {
        if (currentStep < moves.length) {
          onGoToNext();
        } else {
          setIsPlayingReplay(false);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingReplay, currentStep, moves.length, onGoToNext]);

  // Stop replay on user selection
  const handleManualSelect = (step: number) => {
    if (isPlayingReplay) setIsPlayingReplay(false);
    onSelectStep(step);
  };

  // Generate standard PGN format text
  const generatePgn = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
    const header = [
      `[Event "Chess Arena Match"]`,
      `[Site "Chess Arena Online"]`,
      `[Date "${dateStr}"]`,
      `[White "${whitePlayerName}"]`,
      `[Black "${blackPlayerName}"]`,
      `[Result "*"]`,
      '',
    ].join('\n');

    const movesText = movePairs
      .map((p) => {
        const w = p.white.move.san || 'move';
        const b = p.black ? ` ${p.black.move.san || 'move'}` : '';
        return `${p.number}. ${w}${b}`;
      })
      .join(' ');

    return `${header}${movesText}`;
  };

  // Copy PGN text to clipboard
  const handleCopyPgn = () => {
    const text = generatePgn();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .pgn file
  const handleDownloadPgn = () => {
    const text = generatePgn();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess_arena_game_${Date.now()}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-stone-900/95 border border-stone-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-stone-950/80 border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-stone-200 uppercase tracking-wider">
            Move History
          </span>
          {isLive ? (
            <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              <Eye className="w-3 h-3 text-amber-400" />
              <span>REVIEWING</span>
            </span>
          )}
        </div>

        {/* PGN Actions */}
        <div className="flex items-center space-x-1.5">
          {moves.length > 0 && (
            <>
              <button
                onClick={handleCopyPgn}
                className="flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="Copy standard PGN notation"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-stone-400" />
                    <span>PGN</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPgn}
                className="p-1 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                title="Download .pgn file"
              >
                <Download className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Opening Banner if identified */}
      {opening && (
        <div className="px-3 py-1.5 bg-stone-950/40 border-b border-stone-800/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5 text-amber-300 font-medium truncate">
            <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{opening.name}</span>
          </div>
          {opening.eco && (
            <span className="px-1.5 py-0.2 rounded bg-stone-800 font-mono text-[10px] text-stone-400 font-bold shrink-0 ml-1">
              {opening.eco}
            </span>
          )}
        </div>
      )}

      {/* Review Mode Banner / Jump to Live Button */}
      {!isLive && (
        <div className="px-3 py-1.5 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-xs">
          <span className="text-amber-200/90 text-[11px] font-medium flex items-center space-x-1">
            <span>Viewing past ply</span>
            <strong className="text-amber-300">#{currentStep}</strong>
          </span>
          <button
            onClick={onGoToLive}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold transition-colors cursor-pointer"
          >
            <span>Resume Live</span>
            <SkipForward className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Moves Table Header */}
      <div className="grid grid-cols-[40px_1fr_1fr] px-3 py-1.5 bg-stone-950/60 border-b border-stone-800/80 text-[11px] font-bold uppercase tracking-wider text-stone-400">
        <span className="text-center">#</span>
        <span className="pl-2">White</span>
        <span className="pl-2">Black</span>
      </div>

      {/* Scrollable Move List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto max-h-[220px] min-h-[140px] p-1.5 space-y-0.5 font-mono text-xs select-none"
      >
        {/* Starting Position Row */}
        <div className="px-2 py-1 mb-1 border-b border-stone-800/40">
          <button
            onClick={() => handleManualSelect(0)}
            ref={currentStep === 0 ? activeItemRef : null}
            className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
              currentStep === 0
                ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-500/50 shadow-xs'
                : 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-200'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
              <span>Initial Setup</span>
            </span>
            <span className="text-[10px] text-stone-500">Move 0</span>
          </button>
        </div>

        {movePairs.length === 0 ? (
          <div className="h-28 flex flex-col items-center justify-center text-stone-500 text-xs italic space-y-1">
            <Radio className="w-4 h-4 text-stone-600 animate-pulse" />
            <span>Awaiting first move...</span>
          </div>
        ) : (
          movePairs.map((pair) => {
            const isWhiteActive = currentStep === pair.white.step;
            const isBlackActive = pair.black && currentStep === pair.black.step;

            return (
              <div
                key={pair.number}
                className="grid grid-cols-[40px_1fr_1fr] items-center px-1 py-0.5 rounded text-xs transition-colors hover:bg-stone-800/30"
              >
                {/* Move Number */}
                <span className="text-stone-500 font-semibold text-center text-[11px]">
                  {pair.number}.
                </span>

                {/* White Move */}
                <div className="px-1">
                  <button
                    onClick={() => handleManualSelect(pair.white.step)}
                    ref={isWhiteActive ? activeItemRef : null}
                    className={`w-full text-left px-2 py-1 rounded transition-all cursor-pointer font-semibold ${
                      isWhiteActive
                        ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-500/60 shadow-xs'
                        : 'text-stone-200 hover:bg-stone-800/80 hover:text-white'
                    }`}
                    title={`View White's move ${pair.number}: ${pair.white.move.san}`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex items-center">
                        <span>{pair.white.move.san || 'move'}</span>
                        {renderMoveBadge(pair.white.step)}
                      </span>
                      {pair.white.move.captured && (
                        <span className="text-[9px] text-red-400/80 font-normal">x</span>
                      )}
                    </span>
                  </button>
                </div>

                {/* Black Move */}
                <div className="px-1">
                  {pair.black ? (
                    <button
                      onClick={() => handleManualSelect(pair.black!.step)}
                      ref={isBlackActive ? activeItemRef : null}
                      className={`w-full text-left px-2 py-1 rounded transition-all cursor-pointer font-semibold ${
                        isBlackActive
                          ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-500/60 shadow-xs'
                          : 'text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
                      }`}
                      title={`View Black's move ${pair.number}: ${pair.black.move.san}`}
                    >
                      <span className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span>{pair.black.move.san || 'move'}</span>
                          {renderMoveBadge(pair.black!.step)}
                        </span>
                        {pair.black.move.captured && (
                          <span className="text-[9px] text-red-400/80 font-normal">x</span>
                        )}
                      </span>
                    </button>
                  ) : (
                    <span className="text-stone-700 pl-2">·</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Step Toolbar & Controls */}
      <div className="p-2.5 bg-stone-950 border-t border-stone-800 space-y-2">
        {/* Navigation Buttons: |< < Play > >| */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => {
              if (isPlayingReplay) setIsPlayingReplay(false);
              onGoToStart();
            }}
            disabled={currentStep === 0}
            className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-stone-800 cursor-pointer"
            title="Go to Start (Home)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (isPlayingReplay) setIsPlayingReplay(false);
              onGoToPrev();
            }}
            disabled={currentStep === 0}
            className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-stone-800 cursor-pointer"
            title="Previous Move (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Auto-Replay Play/Pause */}
          <button
            onClick={() => {
              if (currentStep >= moves.length && !isPlayingReplay) {
                // If at the end, restart from step 0 and play
                onGoToStart();
                setIsPlayingReplay(true);
              } else {
                setIsPlayingReplay(!isPlayingReplay);
              }
            }}
            disabled={moves.length === 0}
            className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition-colors border cursor-pointer ${
              isPlayingReplay
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800 disabled:opacity-30 disabled:pointer-events-none'
            }`}
            title={isPlayingReplay ? 'Pause auto-replay' : 'Auto-play move replay'}
          >
            {isPlayingReplay ? (
              <Pause className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          <button
            onClick={() => {
              if (isPlayingReplay) setIsPlayingReplay(false);
              onGoToNext();
            }}
            disabled={currentStep >= moves.length}
            className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-stone-800 cursor-pointer"
            title="Next Move (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (isPlayingReplay) setIsPlayingReplay(false);
              onGoToLive();
            }}
            disabled={isLive}
            className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-400 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-stone-800 cursor-pointer"
            title="Go to Live Game (End)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Status Counter & Keyboard Hint */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 pt-0.5">
          <span className="font-mono">
            {currentStep === 0
              ? 'Start Position'
              : `Ply ${currentStep} of ${moves.length}`}
          </span>
          <span className="text-[10px] text-stone-500">
            Use <kbd className="px-1 py-0.2 rounded bg-stone-900 border border-stone-800 font-mono text-[9px] text-stone-400">←</kbd>{' '}
            <kbd className="px-1 py-0.2 rounded bg-stone-900 border border-stone-800 font-mono text-[9px] text-stone-400">→</kbd> keys
          </span>
        </div>
      </div>
    </div>
  );
};
