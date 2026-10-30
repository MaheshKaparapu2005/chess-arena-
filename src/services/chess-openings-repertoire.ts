export interface OpeningMoveAnnotation {
  ply: number;
  san: string;
  comment: string;
  keyIdea?: string;
}

export interface OpeningRepertoire {
  id: string;
  name: string;
  eco: string;
  category: 'King\'s Pawn (e4)' | 'Queen\'s Pawn (d4)' | 'Flank / Indian';
  description: string;
  whitePlan: string;
  blackPlan: string;
  keyPawnBreaks: string[];
  keySquares: string[];
  famousGame: {
    players: string;
    event: string;
    year: string;
    result: string;
  };
  moves: string[]; // SAN sequence
  annotations: OpeningMoveAnnotation[];
}

export const REPERTOIRE_DATABASE: OpeningRepertoire[] = [
  {
    id: 'ruy-lopez-morphy',
    name: 'Ruy Lopez: Morphy Defense (Spanish Opening)',
    eco: 'C78',
    category: 'King\'s Pawn (e4)',
    description:
      'The Spanish Opening (1. e4 e5 2. Nf3 Nc6 3. Bb5) is one of the oldest, deepest, and most respected openings in chess history. Played by virtually every World Champion from Steinitz to Carlsen.',
    whitePlan:
      'Pressure Black\'s center pawn on e5 by menacing the defending knight on c6, build a massive classical center with c3 and d4, and route the b1 knight via d2-f1-g3 to join a kingside assault.',
    blackPlan:
      'Ask the Bishop the question with 3... a6, maintain solid central presence with ...d6 or ...e5, expand on the queenside with ...b5, and coordinate piece play via ...Be7 and ...O-O.',
    keyPawnBreaks: ['c3 then d4 for White', '...b5 and ...d5 or ...c5 for Black'],
    keySquares: ['d4', 'e5', 'c6', 'f5'],
    famousGame: {
      players: 'Garry Kasparov vs. Anatoly Karpov',
      event: 'World Chess Championship Match',
      year: '1990',
      result: '1-0'
    },
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O'],
    annotations: [
      { ply: 1, san: 'e4', comment: 'Controls d5 and f5, opens diagonals for Queen and light-square Bishop.' },
      { ply: 2, san: 'e5', comment: 'Black stakes equal claim in the center and prevents White from immediate d4.' },
      { ply: 3, san: 'Nf3', comment: 'Develops knight with tempo, directly attacking the e5 pawn.' },
      { ply: 4, san: 'Nc6', comment: 'Natural and most resilient defense of the e5 pawn.' },
      { ply: 5, san: 'Bb5', comment: 'The hallmark of the Ruy Lopez. Puts pressure on the defender of e5 without rushing to take it.' },
      { ply: 6, san: 'a6', comment: 'The Morphy Defense! Paul Morphy\'s move forces White to declare intentions with the bishop.' },
      { ply: 7, san: 'Ba4', comment: 'Retains the pin on the knight while keeping future diagonals open.' },
      { ply: 8, san: 'Nf6', comment: 'Black develops the kingside knight and attacks White\'s e4 pawn.' },
      { ply: 9, san: 'O-O', comment: 'White protects the king and prepares to support e4 with the rook.' },
      { ply: 10, san: 'Be7', comment: 'Calm development, unpinning the king and preparing kingside castling.' },
      { ply: 11, san: 'Re1', comment: 'Centralizes the rook, fortifies e4, and frees the d2 pawn for d4 preparation.' },
      { ply: 12, san: 'b5', comment: 'Kicks the bishop away from the a4-e8 diagonal before playing ...d6.' },
      { ply: 13, san: 'Bb3', comment: 'The Spanish Bishop finds its ideal retreat square targeting f7.' },
      { ply: 14, san: 'd6', comment: 'Solidifies the e5 pawn chain and opens c8 for the light-squared bishop.' },
      { ply: 15, san: 'c3', comment: 'Prepares the classic d4 pawn center while providing an escape hatch on c2 for the bishop.' },
      { ply: 16, san: 'O-O', comment: 'Both sides have completed basic development; the deep strategic middlegame begins.' }
    ]
  },
  {
    id: 'sicilian-najdorf',
    name: 'Sicilian Defense: Najdorf Variation',
    eco: 'B90',
    category: 'King\'s Pawn (e4)',
    description:
      'The Rolls-Royce of chess openings. Popularized by Miguel Najdorf and wielded with devastating effect by Bobby Fischer and Garry Kasparov, the Najdorf is dynamic, sharp, and rich in counterattacking resources.',
    whitePlan:
      'Launch aggressive pawn storms with f3/g4/h4 or rapid piece attacks with Bg5, Bc4, and kingside castling, aiming for direct tactical assault against Black\'s king.',
    blackPlan:
      'Control the critical d5 and b4 squares with 5... a6, counter-strike along the half-open c-file, strike in the center with ...e5 or ...e6, and generate relentless queenside counterplay.',
    keyPawnBreaks: ['f4-f5 for White', '...d5 and ...b5-b4 for Black'],
    keySquares: ['d5', 'c4', 'e5', 'd6'],
    famousGame: {
      players: 'Bobby Fischer vs. Boris Spassky',
      event: 'World Chess Championship (Game 6)',
      year: '1972',
      result: '1-0'
    },
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3', 'e5', 'Nb3', 'Be6', 'f3', 'Be7', 'Qd2', 'O-O', 'O-O-O'],
    annotations: [
      { ply: 1, san: 'e4', comment: 'White claims the center and opens king bishop lines.' },
      { ply: 2, san: 'c5', comment: 'The Sicilian! Asymmetrical fight: Black fights for center d4 without mirroring White.' },
      { ply: 3, san: 'Nf3', comment: 'Prepares d4 to blow open central lines.' },
      { ply: 4, san: 'd6', comment: 'Prevents e5 pawn pushes and controls e5 and c5 squares.' },
      { ply: 5, san: 'd4', comment: 'Open Sicilian: White trades a flank c-pawn for central open lines.' },
      { ply: 6, san: 'cxd4', comment: 'Black gains an extra central pawn majority and an open c-file.' },
      { ply: 7, san: 'Nxd4', comment: 'Knight recaptures centrally.' },
      { ply: 8, san: 'Nf6', comment: 'Attacks e4, forcing White to commit a piece to defense.' },
      { ply: 9, san: 'Nc3', comment: 'Solid development defending e4.' },
      { ply: 10, san: 'a6', comment: 'The Najdorf move! Controls b5 and prepares rapid queenside pawn storms with ...b5.' },
      { ply: 11, san: 'Be3', comment: 'English Attack setup, preparing f3, Qd2, and long castles.' },
      { ply: 12, san: 'e5', comment: 'The thematic Najdorf pawn thrust! Drives back the d4 knight.' },
      { ply: 13, san: 'Nb3', comment: 'Knight retreats safely to b3.' },
      { ply: 14, san: 'Be6', comment: 'Controls d5 and keeps eye on the queenside flank.' },
      { ply: 15, san: 'f3', comment: 'Anchors e4 and prepares g4 pawn storm.' },
      { ply: 16, san: 'Be7', comment: 'Develops the bishop safely.' },
      { ply: 17, san: 'Qd2', comment: 'Prepares O-O-O opposite side castling warfare.' },
      { ply: 18, san: 'O-O', comment: 'Black King finds safety before launching the c-file counterattack.' },
      { ply: 19, san: 'O-O-O', comment: 'Opposite-side castling reached! A high-voltage race of attacks begins.' }
    ]
  },
  {
    id: 'queens-gambit-declined',
    name: 'Queen\'s Gambit Declined (Orthodox Defense)',
    eco: 'D30',
    category: 'Queen\'s Pawn (d4)',
    description:
      'The gold standard of classical opening play. White offers a flank pawn (c4) to establish total central dominance. Black declines to maintain a rock-solid stronghold in the center.',
    whitePlan:
      'Establish knight outposts on c3 and e5, apply pins on the f6 knight with Bg5, control the half-open c-file, and break open Black\'s position with e4.',
    blackPlan:
      'Hold the d5 anchor pawn at all costs with ...e6 and ...c6, complete kingside castling, and prepare the freeing central breaks ...c5 or ...e5.',
    keyPawnBreaks: ['e4 for White', '...c5 and ...e5 for Black'],
    keySquares: ['d5', 'e4', 'c4', 'f6'],
    famousGame: {
      players: 'José Raúl Capablanca vs. Alexander Alekhine',
      event: 'World Chess Championship Match',
      year: '1927',
      result: '1/2-1/2'
    },
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'Nbd7', 'Rc1', 'c6'],
    annotations: [
      { ply: 1, san: 'd4', comment: 'Firm central control, queen defends d4 directly.' },
      { ply: 2, san: 'd5', comment: 'Equal symmetrical central dispute.' },
      { ply: 3, san: 'c4', comment: 'The Queen\'s Gambit! White offers the c-pawn to deflect Black\'s d5 pawn.' },
      { ply: 4, san: 'e6', comment: 'Declined! Black reinforces d5 with a strong pawn chain.' },
      { ply: 5, san: 'Nc3', comment: 'Develops knight and piles pressure onto d5.' },
      { ply: 6, san: 'Nf6', comment: 'Natural knight development fortifying d5.' },
      { ply: 7, san: 'Bg5', comment: 'Pins the f6 knight, reducing defense of d5.' },
      { ply: 8, san: 'Be7', comment: 'Breaks the pin on the knight and prepares kingside castle.' },
      { ply: 9, san: 'e3', comment: 'Opens path for the light-square bishop and fortifies c4.' },
      { ply: 10, san: 'O-O', comment: 'Kingside safety secured.' },
      { ply: 11, san: 'Nf3', comment: 'Harmonious minor piece coordination.' },
      { ply: 12, san: 'Nbd7', comment: 'Supports the f6 knight and prepares the ...c5 counter-break.' },
      { ply: 13, san: 'Rc1', comment: 'Places the rook on the prospective c-file.' },
      { ply: 14, san: 'c6', comment: 'The solid Capablanca / Orthodox pawn pyramid is complete.' }
    ]
  },
  {
    id: 'french-defense',
    name: 'French Defense: Advance Variation',
    eco: 'C02',
    category: 'King\'s Pawn (e4)',
    description:
      'The French Defense is famous for its asymmetrical, locked pawn structures. White grabs space on the kingside with e5, while Black relentlessly attacks White\'s pawn chain at its base with ...c5 and ...Qb6.',
    whitePlan:
      'Lock the center with e5, anchor the d4 pawn with c3 and Nf3, and leverage the kingside space advantage to generate direct threats against Black\'s king.',
    blackPlan:
      'Strike immediately at the d4 pawn base with ...c5, ...Nc6, and ...Qb6. Later execute the ...f6 pawn break to destroy White\'s e5 vanguard.',
    keyPawnBreaks: ['f4-f5 for White', '...c5 and ...f6 for Black'],
    keySquares: ['d4', 'e5', 'c5', 'f6'],
    famousGame: {
      players: 'Aron Nimzowitsch vs. Akiba Rubinstein',
      event: 'Semmering Chess Masters',
      year: '1926',
      result: '1-0'
    },
    moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6', 'a3', 'c4'],
    annotations: [
      { ply: 1, san: 'e4', comment: 'White opens with King\'s Pawn.' },
      { ply: 2, san: 'e6', comment: 'Prepares ...d5 with solid pawn backing.' },
      { ply: 3, san: 'd4', comment: 'White claims the classical center.' },
      { ply: 4, san: 'd5', comment: 'Black challenges the e4 pawn immediately.' },
      { ply: 5, san: 'e5', comment: 'The Advance Variation! Grabs space and cramps Black\'s kingside.' },
      { ply: 6, san: 'c5', comment: 'The cardinal rule of pawn chains: attack the base of the chain (d4)!' },
      { ply: 7, san: 'c3', comment: 'White bolsters d4 with another pawn support.' },
      { ply: 8, san: 'Nc6', comment: 'Brings a third attacker against d4.' },
      { ply: 9, san: 'Nf3', comment: 'Brings a second defender to d4.' },
      { ply: 10, san: 'Qb6', comment: 'Piles on maximum pressure against d4 and eyes the weak b2 square.' },
      { ply: 11, san: 'a3', comment: 'Prepares b4 expansion.' },
      { ply: 12, san: 'c4', comment: 'Clamps down on b3, locking the queenside and setting up a protracted positional duel.' }
    ]
  },
  {
    id: 'kings-indian-defense',
    name: 'King\'s Indian Defense: Classical Variation',
    eco: 'E60',
    category: 'Flank / Indian',
    description:
      'A hypermodern masterpiece favored by Garry Kasparov and Hikaru Nakamura. Black concedes the entire pawn center to White, fianchettos the dark-squared bishop, and later launches a ferocious kingside mating storm with ...f5!',
    whitePlan:
      'Dominate the queenside with c5 pawn advances, infiltrate along the c-file, and penetrate Black\'s back lines before Black\'s kingside attack arrives.',
    blackPlan:
      'Lock the center with ...e5, retreat the f6 knight, thrust ...f5, and sacrifice material to rip open White\'s king with ...g5, ...f4, and ...Rf7-g7.',
    keyPawnBreaks: ['c5 for White', '...f5 and ...e5 for Black'],
    keySquares: ['e5', 'd5', 'f4', 'c7'],
    famousGame: {
      players: 'Garry Kasparov vs. Judit Polgar',
      event: 'Linares Super Tournament',
      year: '1997',
      result: '0-1'
    },
    moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7'],
    annotations: [
      { ply: 1, san: 'd4', comment: 'Queen\'s pawn first move.' },
      { ply: 2, san: 'Nf6', comment: 'Indian defense: controls e4 flexibly.' },
      { ply: 3, san: 'c4', comment: 'White claims broad queenside space.' },
      { ply: 4, san: 'g6', comment: 'Prepares the dragon-like fianchetto.' },
      { ply: 5, san: 'Nc3', comment: 'Develops knight to support e4 push.' },
      { ply: 6, san: 'Bg7', comment: 'The King\'s Indian Bishop breathes fire along the h8-a1 diagonal.' },
      { ply: 7, san: 'e4', comment: 'White establishes a formidable central trio (c4, d4, e4).' },
      { ply: 8, san: 'd6', comment: 'Prevents e5 from White and controls key central dark squares.' },
      { ply: 9, san: 'Nf3', comment: 'Smooth kingside development.' },
      { ply: 10, san: 'O-O', comment: 'Black tucks king into safety before the central storm.' },
      { ply: 11, san: 'Be2', comment: 'Modest bishop development, keeping options open.' },
      { ply: 12, san: 'e5', comment: 'The thematic KID strike! Challenging the center.' },
      { ply: 13, san: 'O-O', comment: 'White castles safely.' },
      { ply: 14, san: 'Nc6', comment: 'Attacks d4, forcing White to decide on the central tension.' },
      { ply: 15, san: 'd5', comment: 'The center locks shut! The famous Mar del Plata race is on.' },
      { ply: 16, san: 'Ne7', comment: 'Knight reroutes to g6 or f5 to fuel the upcoming ...f5 kingside hurricane!' }
    ]
  },
  {
    id: 'italian-game',
    name: 'Italian Game: Giuoco Piano',
    eco: 'C50',
    category: 'King\'s Pawn (e4)',
    description:
      'Dating back to the 16th century, the Italian Game (1. e4 e5 2. Nf3 Nc6 3. Bc4) focuses on quick harmonious development and targeted pressure on Black\'s fragile f7 square.',
    whitePlan:
      'Control the center with c3 and d4 (or quiet d3 in Giuoco Pianissimo), coordinate knight jumps to g5 or f1-g3, and create mating threats along the a2-g8 diagonal.',
    blackPlan:
      'Respond with 3... Bc5 matching White\'s activity, anchor the center with ...d6 and ...Nf6, and challenge White\'s center with ...a6 and ...b5.',
    keyPawnBreaks: ['d4 for White', '...d5 for Black'],
    keySquares: ['f7', 'd4', 'c5', 'e5'],
    famousGame: {
      players: 'Magnus Carlsen vs. Fabiano Caruana',
      event: 'Sinquefield Cup',
      year: '2019',
      result: '1-0'
    },
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'a6', 'Bb3', 'Ba7'],
    annotations: [
      { ply: 1, san: 'e4', comment: 'King\'s pawn opening.' },
      { ply: 2, san: 'e5', comment: 'Symmetrical open game.' },
      { ply: 3, san: 'Nf3', comment: 'Attacking the e5 pawn.' },
      { ply: 4, san: 'Nc6', comment: 'Defending e5.' },
      { ply: 5, san: 'Bc4', comment: 'The Italian Bishop! Targets Black\'s weakest square: f7.' },
      { ply: 6, san: 'Bc5', comment: 'Giuoco Piano ("The Quiet Game"). Develops actively without blocking the queen.' },
      { ply: 7, san: 'c3', comment: 'Prepares either immediate d4 or sets up the modern slow setup.' },
      { ply: 8, san: 'Nf6', comment: 'Counterattacks White\'s e4 pawn.' },
      { ply: 9, san: 'd3', comment: 'Giuoco Pianissimo: solidifies e4 and opens c1 for the dark-square bishop.' },
      { ply: 10, san: 'd6', comment: 'Black mirrors White\'s solidity, strengthening e5.' },
      { ply: 11, san: 'O-O', comment: 'Kingside safety.' },
      { ply: 12, san: 'a6', comment: 'Secures an escape square on a7 for the c5 bishop against Na4.' },
      { ply: 13, san: 'Bb3', comment: 'Proactively tucks the bishop away from future pins or attacks.' },
      { ply: 14, san: 'Ba7', comment: 'Black does the same, maintaining long-range battery along the a7-g1 diagonal.' }
    ]
  }
];
