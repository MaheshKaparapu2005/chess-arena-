import React from 'react';
import { Piece, PieceColor, PieceType } from '../models/chess';
import { ChessPiece } from './ChessPiece';

interface CapturedPiecesProps {
  captured: Piece[];
  forColor: PieceColor;
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ captured, forColor }) => {
  // Filter pieces captured by this color (so enemy pieces)
  const enemyColor: PieceColor = forColor === 'w' ? 'b' : 'w';
  const pieces = captured.filter((p) => p.color === enemyColor);

  // Group pieces by type for ordered display: Q, R, B, N, P
  const order: PieceType[] = ['q', 'r', 'b', 'n', 'p'];
  const sorted = [...pieces].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));

  return (
    <div className="flex items-center space-x-0.5 min-h-[26px] overflow-x-auto py-0.5">
      {sorted.map((piece, idx) => (
        <div key={idx} className="w-5 h-5 -mr-1.5 opacity-90 drop-shadow-sm flex-shrink-0">
          <ChessPiece type={piece.type} color={piece.color} />
        </div>
      ))}
    </div>
  );
};
