import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Move } from '../models/chess';
import {
  FileText,
  Copy,
  Check,
  Download,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Upload,
  Code,
  Eye,
  BookOpen,
  Share2,
  Tag,
  Terminal,
} from 'lucide-react';
import { identifyOpening } from '../services/chess-openings';
import { soundService } from '../services/sound.service';

export interface PgnViewerPanelProps {
  moves: Move[];
  currentStep: number; // 0 = start, 1..moves.length
  onSelectStep: (step: number) => void;
  onGoToStart: () => void;
  onGoToPrev: () => void;
  onGoToNext: () => void;
  onGoToLive: () => void;
  isLive: boolean;
  whitePlayerName?: string;
  blackPlayerName?: string;
  gameResult?: string; // "1-0" | "0-1" | "1/2-1/2" | "*"
  onImportPgn?: (movesSans: string[]) => void;
}

export const PgnViewerPanel: React.FC<PgnViewerPanelProps> = ({
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
  gameResult = '*',
  onImportPgn,
}) => {
  const [viewMode, setViewMode] = useState<'interactive' | 'raw'>('interactive');
  const [showTags, setShowTags] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  const activeTokenRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Detect opening
  const opening = useMemo(() => identifyOpening(moves), [moves]);

  // Standard PGN Metadata Tags
  const dateStr = useMemo(() => {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  }, []);

  const pgnTags = useMemo(() => {
    const tags: { key: string; value: string }[] = [
      { key: 'Event', value: 'Chess Arena Tournament' },
      { key: 'Site', value: 'Chess Arena Online (Asia-Southeast)' },
      { key: 'Date', value: dateStr },
      { key: 'Round', value: '1' },
      { key: 'White', value: whitePlayerName },
      { key: 'Black', value: blackPlayerName },
      { key: 'Result', value: gameResult },
    ];

    if (opening?.eco) tags.push({ key: 'ECO', value: opening.eco });
    if (opening?.name) tags.push({ key: 'Opening', value: opening.name });

    return tags;
  }, [whitePlayerName, blackPlayerName, gameResult, opening, dateStr]);

  // Build standard PGN text output
  const rawPgnText = useMemo(() => {
    const headers = pgnTags.map((t) => `[${t.key} "${t.value}"]`).join('\n');

    const moveChunks: string[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const w = moves[i]?.san || '';
      const b = moves[i + 1]?.san ? ` ${moves[i + 1]?.san}` : '';
      moveChunks.push(`${moveNum}. ${w}${b}`);
    }

    const movesStr = moveChunks.join(' ');
    const resultSuffix = gameResult !== '*' ? ` ${gameResult}` : ' *';

    return `${headers}\n\n${movesStr ? movesStr + resultSuffix : resultSuffix}`;
  }, [pgnTags, moves, gameResult]);

  // Scroll active token into view
  useEffect(() => {
    if (activeTokenRef.current && scrollContainerRef.current) {
      activeTokenRef.current.scrollIntoView({
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

  // Copy PGN to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(rawPgnText);
    setCopied(true);
    soundService.playSelect();
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .pgn file
  const handleDownload = () => {
    soundService.playSelect();
    const blob = new Blob([rawPgnText], { type: 'application/x-chess-pgn;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chess_arena_${Date.now()}.pgn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle move token click
  const handleTokenClick = (stepIndex: number) => {
    if (isPlayingReplay) setIsPlayingReplay(false);
    onSelectStep(stepIndex);
  };

  // Keyboard arrow keys navigation handler (Left/Up for Prev, Right/Down for Next, Home for Start, End for Live)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea or in import dialog
      if (showImportDialog) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (isPlayingReplay) setIsPlayingReplay(false);
        onGoToPrev();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (isPlayingReplay) setIsPlayingReplay(false);
        onGoToNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (isPlayingReplay) setIsPlayingReplay(false);
        onGoToStart();
      } else if (e.key === 'End') {
        e.preventDefault();
        if (isPlayingReplay) setIsPlayingReplay(false);
        onGoToLive();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlayingReplay((prev) => !prev);
      }
    },
    [isPlayingReplay, onGoToPrev, onGoToNext, onGoToStart, onGoToLive, showImportDialog]
  );

  // Global window listener when PgnViewerPanel is mounted
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle PGN Import parser
  const handleExecuteImport = () => {
    if (!importText.trim()) return;
    try {
      setImportError('');
      // Clean comments ({...}), variations ((...)), headers ([...])
      let cleaned = importText
        .replace(/\[.*?\]/g, ' ') // remove headers
        .replace(/\{.*?\}/g, ' ') // remove comments
        .replace(/\(.*?\)/g, ' ') // remove variations
        .replace(/\$[0-9]+/g, ' '); // remove NAGs

      // Extract moves tokens
      const tokens = cleaned
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const sans: string[] = [];
      for (const token of tokens) {
        // Skip results
        if (['1-0', '0-1', '1/2-1/2', '*'].includes(token)) continue;

        // Strip move numbers like "1.", "12...", etc.
        const san = token.replace(/^[0-9]+\.+/, '').trim();
        if (san && !san.includes('.')) {
          sans.push(san);
        }
      }

      if (sans.length === 0) {
        setImportError('No valid chess moves found in provided PGN.');
        return;
      }

      if (onImportPgn) {
        onImportPgn(sans);
        soundService.playVictory();
        setShowImportDialog(false);
        setImportText('');
      } else {
        setImportError('Importing is currently active during gameplay.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse PGN text.');
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex flex-col h-full bg-stone-900/95 border border-stone-800 focus:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xs outline-none focus:ring-1 focus:ring-amber-500/30 transition-all group"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-stone-950/80 border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-stone-100 uppercase tracking-wider">
                PGN Game Notation
              </span>
              {isLive ? (
                <span className="flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Eye className="w-2.5 h-2.5 text-amber-400" />
                  <span>PLY #{currentStep}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Toggle & Action Icons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setViewMode(viewMode === 'interactive' ? 'raw' : 'interactive');
              soundService.playSelect();
            }}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
            title={viewMode === 'interactive' ? 'Switch to Raw PGN Code' : 'Switch to Clickable PGN Tokens'}
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setShowTags(!showTags);
              soundService.playSelect();
            }}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              showTags
                ? 'bg-stone-800 text-stone-200'
                : 'text-stone-500 hover:text-stone-300'
            }`}
            title={showTags ? 'Hide PGN header tags' : 'Show PGN header tags'}
          >
            <Tag className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
            title="Copy standard PGN notation to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-stone-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={moves.length === 0}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Download .pgn file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onImportPgn && (
            <button
              onClick={() => {
                setShowImportDialog(true);
                soundService.playSelect();
              }}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
              title="Import custom PGN text"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Opening Tag Banner */}
      {opening && (
        <div className="px-3 py-1.5 bg-stone-950/40 border-b border-stone-800/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5 text-amber-300 font-medium truncate">
            <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{opening.name}</span>
          </div>
          {opening.eco && (
            <span className="px-1.5 py-0.2 rounded bg-stone-800 font-mono text-[10px] text-amber-400 font-bold shrink-0 ml-1">
              {opening.eco}
            </span>
          )}
        </div>
      )}

      {/* Collapsible PGN Seven-Tag Roster */}
      {showTags && (
        <div className="p-2.5 bg-stone-950/60 border-b border-stone-800/80 grid grid-cols-2 gap-1.5 text-[10px] font-mono select-text">
          {pgnTags.map((tag) => (
            <div key={tag.key} className="flex items-center space-x-1 truncate">
              <span className="text-stone-500 font-semibold">{tag.key}:</span>
              <span className="text-stone-300 truncate font-medium">"{tag.value}"</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Body: Interactive Clickable PGN vs Raw Text */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto max-h-[220px] min-h-[140px] p-3 font-mono text-xs leading-relaxed select-none"
      >
        {viewMode === 'raw' ? (
          /* Raw Monospaced PGN Code Block */
          <div className="p-2 rounded-xl bg-stone-950 border border-stone-800/80 text-[11px] text-stone-300 whitespace-pre-wrap select-text font-mono">
            {rawPgnText}
          </div>
        ) : (
          /* Formatted Interactive PGN Tokens */
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
            {/* Start token (Move 0) */}
            <button
              onClick={() => handleTokenClick(0)}
              ref={currentStep === 0 ? activeTokenRef : null}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                currentStep === 0
                  ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                  : 'bg-stone-950 text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-stone-800'
              }`}
              title="Jump to Initial Board Setup (0 moves)"
            >
              [Start]
            </button>

            {moves.length === 0 ? (
              <span className="text-stone-600 italic text-xs ml-1">
                Awaiting opening moves...
              </span>
            ) : (
              // Group and render each move ply as an interactive button
              moves.map((m, idx) => {
                const plyNumber = idx + 1;
                const isWhite = idx % 2 === 0;
                const moveNumber = Math.floor(idx / 2) + 1;
                const isCurrent = currentStep === plyNumber;

                return (
                  <React.Fragment key={idx}>
                    {/* Render move number label for White's turn */}
                    {isWhite && (
                      <span className="text-stone-500 font-bold ml-1 text-[11px] select-none">
                        {moveNumber}.
                      </span>
                    )}

                    {/* Move Token Button */}
                    <button
                      onClick={() => handleTokenClick(plyNumber)}
                      ref={isCurrent ? activeTokenRef : null}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-stone-950 font-black shadow-md shadow-amber-500/30 scale-105 ring-2 ring-amber-300'
                          : plyNumber < currentStep
                          ? 'text-stone-200 hover:bg-stone-800 hover:text-white'
                          : 'text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
                      }`}
                      title={`Jump to Move ${moveNumber} (${isWhite ? 'White' : 'Black'}): ${m.san}`}
                    >
                      <span className={m.captured ? 'text-red-300/90' : ''}>
                        {m.san || 'move'}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })
            )}

            {/* Game Result Ending Token */}
            {moves.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded bg-stone-950 border border-stone-800 text-amber-400 font-bold text-[11px]">
                {gameResult}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step Navigation Bar */}
      <div className="p-2.5 bg-stone-950 border-t border-stone-800 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => {
              if (isPlayingReplay) setIsPlayingReplay(false);
              onGoToStart();
            }}
            disabled={currentStep === 0}
            className="flex-1 flex items-center justify-center p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-stone-800 cursor-pointer"
            title="Go to Start (0 moves)"
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
            title="Previous Move"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (currentStep >= moves.length && !isPlayingReplay) {
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
            title="Next Move"
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
            title="Return to Live Board"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Line with Interactive Keyboard Arrow Hints */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 pt-0.5">
          <span className="font-mono text-amber-300/90 font-semibold">
            {currentStep === 0
              ? 'Starting Position'
              : `Ply ${currentStep} of ${moves.length}`}
          </span>
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="text-stone-500 hidden sm:inline">Navigate:</span>
            <kbd
              onClick={onGoToPrev}
              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-850 hover:text-amber-300 border border-stone-800 font-mono text-stone-300 font-bold transition-colors cursor-pointer select-none"
              title="Step Backward (Left Arrow ← or Up Arrow ↑)"
            >
              ← / ↑
            </kbd>
            <kbd
              onClick={onGoToNext}
              className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-850 hover:text-amber-300 border border-stone-800 font-mono text-stone-300 font-bold transition-colors cursor-pointer select-none"
              title="Step Forward (Right Arrow → or Down Arrow ↓)"
            >
              → / ↓
            </kbd>
          </div>
        </div>
      </div>

      {/* PGN Import Modal */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Import Custom PGN Game</h3>
              </div>
              <button
                onClick={() => setShowImportDialog(false)}
                className="text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Paste standard Portable Game Notation below to load and step through the moves.
            </p>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`[Event "World Championship"]\n[White "Kasparov"]\n[Black "Karpov"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...`}
              rows={6}
              className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-800 font-mono text-xs text-stone-200 outline-none focus:border-amber-500 resize-none"
            />

            {importError && (
              <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-800/60">
                {importError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleExecuteImport}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors cursor-pointer shadow-md"
              >
                Load PGN Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
