import React from 'react';
import { BookOpen, ShieldCheck, Zap, Sparkles, Swords } from 'lucide-react';
import { ChessPiece } from '../components/ChessPiece';

export const HowToPlayPage: React.FC = () => {
  const pieces = [
    {
      type: 'k' as const,
      name: 'King',
      movement: 'Moves exactly one square in any direction (horizontal, vertical, or diagonal).',
      note: 'The most important piece. Cannot move into check or onto an attacked square.',
    },
    {
      type: 'q' as const,
      name: 'Queen',
      movement: 'Moves any number of unoccupied squares along rows, columns, or diagonals.',
      note: 'The most versatile and powerful attacking piece on the board (valued at 9 points).',
    },
    {
      type: 'r' as const,
      name: 'Rook',
      movement: 'Moves horizontally or vertically through any number of empty squares.',
      note: 'Controls files and ranks. Works with the King to perform castling (valued at 5 points).',
    },
    {
      type: 'b' as const,
      name: 'Bishop',
      movement: 'Moves diagonally through any number of unoccupied squares.',
      note: 'Each bishop is permanently bound to its starting square color (light or dark, valued at 3 points).',
    },
    {
      type: 'n' as const,
      name: 'Knight',
      movement: 'Moves in an "L-shape": two squares in one cardinal direction and one perpendicular.',
      note: 'The only piece that can jump over other friendly or enemy pieces (valued at 3 points).',
    },
    {
      type: 'p' as const,
      name: 'Pawn',
      movement: 'Advances 1 square forward (or 2 on its initial move). Captures 1 square diagonally forward.',
      note: 'Supports en passant and pawn promotion upon reaching the opposing back rank (valued at 1 point).',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Chess Arena Academy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          How to Play Chess
        </h1>
        <p className="text-xs sm:text-sm text-stone-400">
          Learn the official FIDE chess rules, legal movements, special moves, and win conditions.
        </p>
      </div>

      {/* Piece Movements Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-stone-100 flex items-center space-x-2">
          <Swords className="w-4 h-4 text-amber-400" />
          <span>Piece Rules & Movements</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pieces.map((p) => (
            <div
              key={p.type}
              className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-3 hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-stone-950 border border-stone-800 p-1 flex items-center justify-center">
                  <ChessPiece type={p.type} color="w" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{p.name}</h3>
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">Standard Piece</span>
                </div>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">{p.movement}</p>
              <p className="text-[11px] text-stone-500 italic border-t border-stone-800 pt-2">
                {p.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Special Moves */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-stone-100 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Special Chess Rules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-amber-300 text-sm">1. Castling</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Move your King two squares toward a Rook, and that Rook hops over the King to the adjacent square. Both pieces must not have moved previously, the path must be clear, the King cannot be in check, and no square crossed can be under attack.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-amber-300 text-sm">2. En Passant</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              When an opponent advances a pawn two squares from its starting square past your pawn's capture square, you can capture it diagonally on your immediate next turn as if it had only moved one square.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-amber-300 text-sm">3. Pawn Promotion</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              When a pawn reaches the 8th rank (opponent's back row), it is immediately transformed into a Queen, Rook, Bishop, or Knight of your choice, granting immense tactical strength.
            </p>
          </div>
        </div>
      </div>

      {/* Victory Conditions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-stone-100 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Check, Checkmate, & Draws</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-emerald-400 text-sm">Checkmate (Win)</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              When a player's King is under attack ("in check") and there is no legal move to escape the attack, block the line of sight, or capture the attacking piece. The game ends in victory for the attacker.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-amber-400 text-sm">Stalemate (Draw)</h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              When the player whose turn it is has NO legal moves, but their King is NOT in check. The game immediately concludes in an official draw (1/2 point each).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
