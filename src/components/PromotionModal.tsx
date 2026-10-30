import React from 'react';
import { PieceColor, PieceType } from '../models/chess';
import { ChessPiece } from './ChessPiece';

interface PromotionModalProps {
  color: PieceColor;
  isOpen: boolean;
  onSelect: (type: PieceType) => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, isOpen, onSelect }) => {
  if (!isOpen) return null;

  const choices: { type: PieceType; name: string }[] = [
    { type: 'q', name: 'Queen' },
    { type: 'r', name: 'Rook' },
    { type: 'b', name: 'Bishop' },
    { type: 'n', name: 'Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
        <h3 className="text-lg font-bold text-stone-100">Pawn Promotion</h3>
        <p className="text-xs text-stone-400">Choose a piece to replace your promoted pawn:</p>

        <div className="grid grid-cols-4 gap-3">
          {choices.map(({ type, name }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 hover:border-amber-400 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 group-hover:scale-110 transition-transform">
                <ChessPiece type={type} color={color} />
              </div>
              <span className="mt-2 text-xs font-medium text-stone-300 group-hover:text-amber-300">
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
