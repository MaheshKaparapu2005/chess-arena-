/**
 * Recognized Chess Openings Dictionary and Identification Utility
 */

interface OpeningPattern {
  name: string;
  eco?: string;
  moves: string[]; // sequence of SANs
}

const OPENINGS: OpeningPattern[] = [
  { name: 'Ruy Lopez: Morphy Defense', eco: 'C78', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'] },
  { name: 'Ruy Lopez', eco: 'C60', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
  { name: 'Italian Game: Giuoco Piano', eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] },
  { name: 'Italian Game: Two Knights Defense', eco: 'C55', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
  { name: 'Italian Game', eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
  { name: 'Scotch Game', eco: 'C45', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
  { name: 'Four Knights Game', eco: 'C47', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'] },
  { name: "Petrov's Defense", eco: 'C42', moves: ['e4', 'e5', 'Nf3', 'Nf6'] },
  { name: "King's Gambit", eco: 'C30', moves: ['e4', 'e5', 'f4'] },
  { name: 'Vienna Game', eco: 'C25', moves: ['e4', 'e5', 'Nc3'] },
  { name: "King's Pawn: Open Game", eco: 'C20', moves: ['e4', 'e5'] },
  { name: 'Sicilian: Najdorf', eco: 'B90', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },
  { name: 'Sicilian: Dragon', eco: 'B70', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] },
  { name: 'Sicilian: Classical', eco: 'B56', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'Nc6'] },
  { name: 'Sicilian: Open', eco: 'B27', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4'] },
  { name: 'Sicilian Defense', eco: 'B20', moves: ['e4', 'c5'] },
  { name: 'French: Winawer', eco: 'C15', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'] },
  { name: 'French: Classical', eco: 'C14', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'] },
  { name: 'French: Advance', eco: 'C02', moves: ['e4', 'e6', 'd4', 'd5', 'e5'] },
  { name: 'French Defense', eco: 'C00', moves: ['e4', 'e6'] },
  { name: 'Caro-Kann: Advance', eco: 'B12', moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
  { name: 'Caro-Kann: Classical', eco: 'B18', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'] },
  { name: 'Caro-Kann Defense', eco: 'B10', moves: ['e4', 'c6'] },
  { name: 'Scandinavian Defense', eco: 'B01', moves: ['e4', 'd5'] },
  { name: "Alekhine's Defense", eco: 'B02', moves: ['e4', 'Nf6'] },
  { name: 'Pirc Defense', eco: 'B07', moves: ['e4', 'd6', 'd4', 'Nf6'] },
  { name: "Queen's Gambit Declined", eco: 'D30', moves: ['d4', 'd5', 'c4', 'e6'] },
  { name: "Queen's Gambit Accepted", eco: 'D20', moves: ['d4', 'd5', 'c4', 'dxc4'] },
  { name: 'Slav Defense', eco: 'D10', moves: ['d4', 'd5', 'c4', 'c6'] },
  { name: "Queen's Gambit", eco: 'D06', moves: ['d4', 'd5', 'c4'] },
  { name: 'London System', eco: 'D02', moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'] },
  { name: "Queen's Pawn Game", eco: 'D00', moves: ['d4', 'd5'] },
  { name: "King's Indian Defense", eco: 'E60', moves: ['d4', 'Nf6', 'c4', 'g6'] },
  { name: 'Nimzo-Indian Defense', eco: 'E20', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
  { name: "Queen's Indian Defense", eco: 'E12', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'] },
  { name: 'Grünfeld Defense', eco: 'D80', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'] },
  { name: 'Indian Defense', eco: 'A45', moves: ['d4', 'Nf6'] },
  { name: 'English Opening', eco: 'A10', moves: ['c4'] },
  { name: 'Réti Opening', eco: 'A04', moves: ['Nf3'] },
  { name: "Bird's Opening", eco: 'A02', moves: ['f4'] },
  { name: "King's Pawn Opening", eco: 'B00', moves: ['e4'] },
  { name: "Queen's Pawn Opening", eco: 'A40', moves: ['d4'] },
];

export function identifyOpening(moves: { san?: string }[]): { name: string; eco?: string } | null {
  const sans = moves.map((m) => m.san || '').filter(Boolean);
  if (sans.length === 0) return null;

  // Search from longest pattern to shortest
  for (const op of OPENINGS) {
    if (sans.length >= op.moves.length) {
      let match = true;
      for (let i = 0; i < op.moves.length; i++) {
        if (sans[i] !== op.moves[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        return { name: op.name, eco: op.eco };
      }
    }
  }

  return null;
}
