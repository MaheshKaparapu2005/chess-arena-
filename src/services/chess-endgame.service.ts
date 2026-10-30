import { Board, GameState, Move, PieceColor } from '../models/chess';
import { fenToGameState, isPuzzleMoveCorrect } from './chess-puzzle.service';
import { getLegalMovesForPiece, executeMove, coordToAlgebraic } from './chess-move.service';

export interface EndgameLesson {
  id: string;
  title: string;
  category: 'Rook Endgames' | 'King & Pawn' | 'Checkmate Techniques' | 'Queen Endgames';
  difficulty: 'Essential' | 'Intermediate' | 'Master';
  fen: string;
  playerColor: PieceColor;
  objective: string;
  keyConcept: string;
  whyItMatters: string;
  moves: string[]; // Master line SAN moves
  stepAnnotations: string[]; // Annotation explaining each move in the master line
}

export const ENDGAME_LESSONS: EndgameLesson[] = [
  {
    id: 'endgame-lucena',
    title: 'The Lucena Position (Building a Bridge)',
    category: 'Rook Endgames',
    difficulty: 'Master',
    fen: '1K1k4/1P1r4/8/8/8/8/8/5R2 w - - 0 1',
    playerColor: 'w',
    objective: 'White to move and promote the pawn by building a bridge',
    keyConcept:
      'The Lucena Position is the foundational winning technique in rook endgames. When your pawn is on the 7th rank and your king is trapped in front of it, you cut off the opponent king with a check, place your rook on the 4th rank (1. Rf4 or 1. Rd1+), walk your king out, and use your rook on the 4th rank to shield ("bridge") against enemy vertical checks.',
    whyItMatters:
      'Almost all winning single-rook endgames simplify into the Lucena position. If you know this technique, you can convert won rook endgames with 100% precision.',
    moves: ['Rf8+', 'Ke7', 'Rf4', 'Rd1', 'Kc7', 'Rc1+', 'Kb6', 'Rb1+', 'Kc6', 'Rc1+', 'Kd5', 'Rd1+', 'Ke4', 'Re1+', 'Kd4', 'Rd1+', 'Rd4'],
    stepAnnotations: [
      '1. Rf8+ checks the Black king and drives it further away from the promotion square.',
      'Black is forced to step away with 1... Ke7.',
      '2. Rf4! The key bridge move! White prepares the 4th rank to interpose against Black rook checks.',
      'Black can only wait on the d-file with 2... Rd1.',
      '3. Kc7! The White king steps out from in front of the passed pawn.',
      'Black attempts to check the king away from the promotion square.',
      '4. Kb6! King uses the pawn as a shield.',
      'Black checks again: 4... Rb1+.',
      '5. Kc6! Edge closer to the rook to execute the bridge.',
      'Black checks once more: 5... Rc1+.',
      '6. Kd5! Walking toward the 4th rank.',
      'Black keeps checking: 6... Rd1+.',
      '7. Ke4! Close to the bridge rank.',
      '7... Re1+ gives the final check.',
      '8. Kd4! Moving forward.',
      '8... Rd1+ is Black\'s last attempt.',
      '9. Rd4! THE BRIDGE! The White rook blocks the check, shielding the king while the pawn promotes next turn!'
    ]
  },
  {
    id: 'endgame-philidor',
    title: 'The Philidor Defense (3rd-Rank Barrier)',
    category: 'Rook Endgames',
    difficulty: 'Intermediate',
    fen: '8/4k3/8/4P3/8/1r6/4K3/5R2 b - - 0 1',
    playerColor: 'b',
    objective: 'Black to move and hold a draw against White\'s 5th-rank pawn',
    keyConcept:
      'Named after François-André Danican Philidor (1777). Black cuts off the White king from advancing by keeping the rook on the 3rd rank (6th rank from Black perspective: b3/a3). As soon as White pushes the pawn to e6 to shield the king, Black drops the rook all the way to the 8th/1st rank and delivers endless vertical checks from behind!',
    whyItMatters:
      'The most important drawing defense in all of chess. Without it, you will lose countless holdable rook and pawn endings.',
    moves: ['Rb6', 'Rf6', 'Rb5', 'Ke3', 'Rb6', 'Kd4', 'Rb5', 'e6', 'Rb1', 'Ke5', 'Re1+'],
    stepAnnotations: [
      '1... Rb6! Black plants the rook on the 6th rank (White\'s 3rd rank), preventing the White King from advancing.',
      'White attempts to reposition the rook.',
      '2... Rb5! Black waits on the 6th/3rd rank barrier.',
      'White king tries to shuffle forward.',
      '3... Rb6! Patiently maintaining the barrier.',
      'White prepares the pawn advance.',
      '4... Rb5! Still holding the 3rd rank cutting line.',
      'White pushes 5. e6! The pawn has committed.',
      '5... Rb1! The moment the pawn pushes, Black drops to the 1st rank for rear checks!',
      'White king tries to step forward to e5.',
      '6... Re1+! Long-distance rear check! The pawn can no longer shield the king, securing an easy draw.'
    ]
  },
  {
    id: 'endgame-opposition',
    title: 'The Direct Opposition (King & Pawn)',
    category: 'King & Pawn',
    difficulty: 'Essential',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    playerColor: 'w',
    objective: 'White to move and promote the pawn by seizing the key squares',
    keyConcept:
      'The Opposition is when two kings face each other on the same rank, file, or diagonal with one empty square between them. The player who does NOT have to move "has the opposition" and can outflank the opponent. With White King on e6 and pawn on e5, White wins regardless because Black must yield the key squares (d7 or f7).',
    whyItMatters:
      'King and pawn endings form the root of all chess endgames. Understanding the opposition allows you to calculate pawn races with certainty.',
    moves: ['Kd6', 'Kd8', 'e6', 'Ke8', 'e7', 'Kf7', 'Kd7', 'Kg7', 'e8=Q'],
    stepAnnotations: [
      '1. Kd6! White steps to the side, preparing to outflank the Black King.',
      'Black is forced to step back to d8.',
      '2. e6! Pushing the pawn safely with the King controlling the advance.',
      'Black retreats to e8.',
      '3. e7! Black King has only one legal square: Kf7.',
      'Black king moves to f7.',
      '4. Kd7! Seizing the promotion square e8.',
      'Black is helpless.',
      '5. e8=Q! The pawn crowns into a Queen!'
    ]
  },
  {
    id: 'endgame-trebuchet',
    title: 'The Trebuchet Position (Mutual Zugzwang)',
    category: 'King & Pawn',
    difficulty: 'Intermediate',
    fen: '8/8/3k4/3p4/3P4/3K4/8/8 w - - 0 1',
    playerColor: 'w',
    objective: 'White to move and maintain pawn security without falling into zugzwang',
    keyConcept:
      'In a Trebuchet, both pawns are locked on the same file with kings defending their respective pawns. It is a position of "mutual zugzwang": whichever player is forced to move first must relinquish defense of their pawn and lose the game!',
    whyItMatters:
      'Teaches the profound chess principle of triangulation and distant zugzwang, where tempo determines victory or defeat.',
    moves: ['Kc3', 'Kc6', 'Kb4', 'Kb6', 'Ka4', 'Ka6'],
    stepAnnotations: [
      '1. Kc3! White wisely avoids stepping onto d4 immediately, waiting for Black to commit.',
      'Black matches White\'s waiting maneuver.',
      '2. Kb4! White probes Black\'s defensive square.',
      '2... Kb6! Black seizes the opposition and preserves balance.',
      '3. Ka4! Shuffling on the flank.',
      '3... Ka6! Perfect mutual opposition, holding the defensive draw.'
    ]
  },
  {
    id: 'endgame-rook-box',
    title: 'King & Rook Checkmate (The Box Technique)',
    category: 'Checkmate Techniques',
    difficulty: 'Essential',
    fen: '4k3/8/8/8/8/8/4K3/R7 w - - 0 1',
    playerColor: 'w',
    objective: 'White to move and shrink the box to deliver checkmate with Rook and King',
    keyConcept:
      'To deliver checkmate with King and Rook, you must confine the enemy king into an ever-shrinking "box" using the rook. Bring your king into opposition to protect the rook and push the enemy king to the edge of the board where checkmate is inevitable.',
    whyItMatters:
      'The most frequently occurring checkmate ending in tournament chess. Must be executed swiftly and without stalemate blunders.',
    moves: ['Ra7', 'Kd8', 'Kd3', 'Kc8', 'Kc3', 'Kb8', 'Rh7', 'Kc8', 'Kd4', 'Kd8', 'Kd5', 'Ke8', 'Kd6', 'Kf8', 'Ke6', 'Kg8', 'Ra7', 'Kf8', 'Rb7', 'Kg8', 'Kf6', 'Kh8', 'Kg6', 'Kg8', 'Rb8#'],
    stepAnnotations: [
      '1. Ra7! Cutting the Black King off from the 7th and 8th ranks — establishing the box!',
      'Black tries to stay in the center.',
      '2. Kd3! Bringing the White King closer to support the rook.',
      'Black moves along the 8th rank.',
      '3. Kc3! The White King marches forward.',
      'Black attacks the rook with 4... Kb8.',
      '4. Rh7! Swing the rook to the opposite side of the 7th rank while keeping the cut-off!',
      'Black returns to c8.',
      '5. Kd4! King keeps advancing.',
      'Black steps to d8.',
      '6. Kd5! Tightening the pressure.',
      'Black retreats to e8.',
      '7. Kd6! Seizing the opposition.',
      'Black steps to f8.',
      '8. Ke6! Maintaining king coordination.',
      'Black runs towards the corner with 8... Kg8.',
      '9. Ra7! Shifting the rook back while keeping the 7th rank sealed.',
      'Black is trapped on the back rank.',
      '10. Rb7! A waiting move, forcing Black\'s King to step in front of White.',
      'Black steps towards h8.',
      '11. Kf6! Direct opposition!',
      'Black king forced into the corner: 11... Kh8.',
      '12. Kg6! Covering all escape squares.',
      'Black has only 12... Kg8.',
      '13. Rb8# CHECKMATE! King covers f7/g7/h7 while the rook sweeps the 8th rank!'
    ]
  },
  {
    id: 'endgame-queen-7th',
    title: 'Queen vs Pawn on 7th Rank (Stalemate Tricks)',
    category: 'Queen Endgames',
    difficulty: 'Intermediate',
    fen: '8/2P1k3/8/8/8/8/8/1Q2K3 b - - 0 1',
    playerColor: 'b',
    objective: 'Black to defend and understand the bishop-pawn stalemate resource',
    keyConcept:
      'When fighting a Queen with a solitary pawn on the 7th rank, Bishop pawns (c7, f7) and Rook pawns (a7, h7) have drawing resources because the defending king can step into the corner square creating an instantaneous stalemate when the Queen captures or approaches!',
    whyItMatters:
      'Many players resign prematurely with pawns on the 7th rank, unaware of the magical drawing power of the c-pawn and f-pawn.',
    moves: ['Kd7', 'Qb7', 'Kd6', 'c8=Q'],
    stepAnnotations: [
      '1... Kd7! Black King rushes to support the pawn.',
      '2. Qb7 pins the pawn against the king.',
      '2... Kd6! Stepping away to allow the push.',
      '3. c8=Q! Pawn promotes to Queen, proving the power of 7th rank passed pawns.'
    ]
  }
];

const ENDGAME_STORAGE_KEY = 'chess_arena_endgame_mastery';

export function getCompletedEndgameIds(): string[] {
  try {
    const raw = localStorage.getItem(ENDGAME_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return [];
}

export function markEndgameCompleted(id: string): string[] {
  const current = getCompletedEndgameIds();
  if (!current.includes(id)) {
    current.push(id);
    try {
      localStorage.setItem(ENDGAME_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      // ignore
    }
  }
  return current;
}
