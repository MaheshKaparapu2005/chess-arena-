import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundService } from '../services/sound.service';
import {
  X,
  Play,
  RotateCcw,
  Trophy,
  Flame,
  Eye,
  EyeOff,
  Zap,
  Timer,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface VisionTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const HIGH_SCORE_KEY = 'chess_arena_vision_highscore';

export const VisionTrainerModal: React.FC<VisionTrainerModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [score, setScore] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Current target square (e.g., "e4")
  const [targetSquare, setTargetSquare] = useState<string>('e4');
  const [feedbackSquare, setFeedbackSquare] = useState<{
    square: string;
    type: 'correct' | 'wrong';
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random square
  const getRandomSquare = useCallback((exclude?: string): string => {
    let sq: string;
    do {
      const file = FILES[Math.floor(Math.random() * 8)];
      const rank = RANKS[Math.floor(Math.random() * 8)];
      sq = `${file}${rank}`;
    } while (sq === exclude);
    return sq;
  }, []);

  // Start trainer run
  const startGame = useCallback(() => {
    setIsPlaying(true);
    setTimeLeft(30);
    setScore(0);
    setMistakes(0);
    setStreak(0);
    setBestStreak(0);
    setFeedbackSquare(null);
    setTargetSquare(getRandomSquare());
    soundService.playVictory();
  }, [getRandomSquare]);

  // Stop trainer run
  const stopGame = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // Timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopGame();
            soundService.playCheckmate();
            return 0;
          }
          if (prev <= 6) {
            soundService.playLowTime();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, stopGame]);

  // Update High score
  useEffect(() => {
    if (!isPlaying && timeLeft === 0 && score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem(HIGH_SCORE_KEY, score.toString());
      } catch {
        // ignore
      }
    }
  }, [isPlaying, timeLeft, score, highScore]);

  // Handle Square click
  const handleSquareClick = (file: string, rank: string) => {
    if (!isPlaying) return;

    const clicked = `${file}${rank}`;
    if (clicked === targetSquare) {
      // Correct!
      soundService.playMove();
      setScore((s) => s + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      setFeedbackSquare({ square: clicked, type: 'correct' });
      setTargetSquare(getRandomSquare(clicked));
    } else {
      // Wrong!
      soundService.playBlunder();
      setMistakes((m) => m + 1);
      setStreak(0);
      setFeedbackSquare({ square: clicked, type: 'wrong' });
    }

    // Clear feedback square after 300ms
    setTimeout(() => {
      setFeedbackSquare(null);
    }, 300);
  };

  if (!isOpen) return null;

  // Board layout according to orientation
  const displayedRanks = orientation === 'w' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];
  const displayedFiles = orientation === 'w' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

  const accuracy = score + mistakes > 0 ? Math.round((score / (score + mistakes)) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 text-stone-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Board Vision & Coordinate Speed Drill</h2>
            <p className="text-xs text-stone-400">
              Sharpen your algebraic board sight. Locate as many squares as you can in 30 seconds!
            </p>
          </div>
        </div>

        {/* Dashboard Bar */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
            <div className="flex items-center justify-center space-x-1 text-[10px] text-stone-400 font-semibold uppercase">
              <Timer className="w-3 h-3 text-amber-400" />
              <span>Time</span>
            </div>
            <div
              className={`text-lg font-black font-mono ${
                timeLeft <= 5 && isPlaying ? 'text-rose-400 animate-pulse' : 'text-stone-100'
              }`}
            >
              {timeLeft}s
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
            <div className="text-[10px] text-stone-400 font-semibold uppercase">Score</div>
            <div className="text-lg font-black font-mono text-emerald-400">{score}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
            <div className="flex items-center justify-center space-x-1 text-[10px] text-stone-400 font-semibold uppercase">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>Streak</span>
            </div>
            <div className="text-lg font-black font-mono text-orange-400">{streak}</div>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800">
            <div className="flex items-center justify-center space-x-1 text-[10px] text-stone-400 font-semibold uppercase">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>High</span>
            </div>
            <div className="text-lg font-black font-mono text-amber-400">{highScore}</div>
          </div>
        </div>

        {/* Target Coordinate Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-stone-800 to-amber-500/20 border border-amber-500/40 text-center relative overflow-hidden">
          {isPlaying ? (
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Click this square:
              </span>
              <div className="text-3xl font-black font-mono text-white tracking-widest drop-shadow-md animate-in zoom-in-75 duration-150">
                {targetSquare}
              </div>
            </div>
          ) : timeLeft === 0 ? (
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                Run Complete!
              </span>
              <p className="text-sm font-bold text-stone-200">
                You found {score} squares with {accuracy}% accuracy (Streak: {bestStreak})
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-stone-300">
                Ready to test your chess reflexes?
              </span>
              <p className="text-[11px] text-stone-400">
                Press "Start 30s Challenge" when ready!
              </p>
            </div>
          )}
        </div>

        {/* Interactive Coordinate Mini-Board */}
        <div className="relative flex justify-center">
          <div className="w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] bg-stone-950 p-2 rounded-2xl border-2 border-stone-700 shadow-xl select-none">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden relative">
              {displayedRanks.map((rank, rIdx) =>
                displayedFiles.map((file, fIdx) => {
                  const sq = `${file}${rank}`;
                  const isLight = (rIdx + fIdx) % 2 === 0;
                  const isFeedback = feedbackSquare?.square === sq;
                  const isFeedbackCorrect = isFeedback && feedbackSquare?.type === 'correct';
                  const isFeedbackWrong = isFeedback && feedbackSquare?.type === 'wrong';

                  return (
                    <button
                      key={sq}
                      onClick={() => handleSquareClick(file, rank)}
                      disabled={!isPlaying}
                      className={`relative flex items-center justify-center transition-all cursor-pointer ${
                        isFeedbackCorrect
                          ? 'bg-emerald-500 text-stone-950 scale-95 shadow-inner'
                          : isFeedbackWrong
                          ? 'bg-rose-500 text-white scale-95 animate-shake'
                          : isLight
                          ? 'bg-[#ebecd0] hover:bg-[#d5d7b5] text-stone-700'
                          : 'bg-[#779556] hover:bg-[#68834a] text-stone-900'
                      }`}
                    >
                      {/* Show corner coordinate label if enabled */}
                      {showLabels && (
                        <>
                          {fIdx === 0 && (
                            <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-60">
                              {rank}
                            </span>
                          )}
                          {rIdx === 7 && (
                            <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-60">
                              {file}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Options & Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setOrientation(orientation === 'w' ? 'b' : 'w');
                soundService.playSelect();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition-colors cursor-pointer"
            >
              Perspective: {orientation === 'w' ? 'White ♔' : 'Black ♚'}
            </button>

            <button
              onClick={() => {
                setShowLabels(!showLabels);
                soundService.playSelect();
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition-colors cursor-pointer"
            >
              {showLabels ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
              <span>{showLabels ? 'Labels On' : 'Blindfold'}</span>
            </button>
          </div>

          {/* Start / Reset Button */}
          {isPlaying ? (
            <button
              onClick={stopGame}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>End Drill Early</span>
            </button>
          ) : (
            <button
              onClick={startGame}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs shadow-xl shadow-amber-500/25 transition-all hover:scale-105 cursor-pointer flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-stone-950" />
              <span>{timeLeft === 0 ? 'Play Again (30s)' : 'Start 30s Challenge'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
