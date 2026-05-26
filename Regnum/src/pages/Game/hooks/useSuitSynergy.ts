import { useMemo } from 'react';
import { type CardData } from '../../../utils/cardData';
import { type BoardSlot } from './useGameState';

// Palos válidos en mesa (los jokers nunca llegan al tablero, pero lo excluimos igual)
type Suit = 'espadas' | 'copas' | 'oros' | 'bastos';

export interface SuitSynergyResult {
  /** Indica si las tres columnas están ocupadas Y todas las cartas son del mismo palo */
  isActive: boolean;
  /** El palo que completa la sinergia, o null si no hay */
  suit: Suit | null;
  /** Las tres cartas que forman la sinergia */
  cards: [CardData, CardData, CardData] | null;
}

/**
 * Dados los slots del tablero de un jugador (3 columnas),
 * devuelve si hay sinergia de palo completa (las 3 cartas del mismo palo).
 *
 * La función es pura y memoizada: no dispara efectos por sí sola.
 * El componente o hook que la consuma es el responsable de reaccionar
 * con un useEffect cuando `isActive` cambie a `true`.
 */
const detectSuitSynergy = (slots: BoardSlot[]): SuitSynergyResult => {
  // Necesitamos exactamente 3 slots con carta
  const cards = slots.map(s => s.card);
  if (cards.some(c => c === null)) {
    return { isActive: false, suit: null, cards: null };
  }

  // En este punto sabemos que las 3 existen
  const [c0, c1, c2] = cards as [CardData, CardData, CardData];

  const firstSuit = c0.suit;

  // Excluir jokers (nunca deberían estar en mesa, pero por seguridad)
  if (firstSuit === 'jokers') {
    return { isActive: false, suit: null, cards: null };
  }

  const allSameSuit = c1.suit === firstSuit && c2.suit === firstSuit;

  if (!allSameSuit) {
    return { isActive: false, suit: null, cards: null };
  }

  return {
    isActive: true,
    suit: firstSuit as Suit,
    cards: [c0, c1, c2],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Bonus por palo: define aquí qué otorga cada sinergia.
// Centralizar esto aquí facilita balancear sin tocar lógica de estado.
// ─────────────────────────────────────────────────────────────────────────────
export interface SuitSynergyBonus {
  /** Voluntad extra que recibe el jugador */
  voluntadBonus: number;
  /** Vida extra que recibe el jugador (avatar) */
  hpBonus: number;
  /** Descripción legible para mostrar en UI / notificaciones */
  description: string;
}

export const SUIT_SYNERGY_BONUSES: Record<Suit, SuitSynergyBonus> = {
  espadas: {
    voluntadBonus: 0,
    hpBonus: 0,
    description: 'Bonus de Espadas: +1 de daño en todos los ataques.',
  },
  copas: {
    voluntadBonus: 0,
    hpBonus: 0,
    description: 'Bonus de Copas: +1 HP por turno a todas las cartas y purga efectos negativos.',
  },
  oros: {
    voluntadBonus: 1,
    hpBonus: 0,
    description: 'Bonus de Oros: +1 de voluntad adicional por turno.',
  },
  bastos: {
    voluntadBonus: 0,
    hpBonus: 0,
    description: 'Bonus de Bastos: -1 de daño recibido a todas las cartas.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook público
// ─────────────────────────────────────────────────────────────────────────────

interface UseSuitSynergyParams {
  playerBoard: BoardSlot[];
  opponentBoard: BoardSlot[];
}

interface UseSuitSynergyReturn {
  playerSynergy: SuitSynergyResult;
  opponentSynergy: SuitSynergyResult;
  /** Helper: dado un resultado de sinergia, devuelve su bonus o null */
  getBonusForSynergy: (synergy: SuitSynergyResult) => SuitSynergyBonus | null;
}

/**
 * Hook que detecta sinergias de palo completo en el tablero del jugador
 * y del rival, y expone los resultados de forma memoizada.
 *
 * @example
 * const { playerSynergy, opponentSynergy, getBonusForSynergy } = useSuitSynergy({
 *   playerBoard: board,
 *   opponentBoard,
 * });
 *
 * useEffect(() => {
 *   if (playerSynergy.isActive) {
 *     const bonus = getBonusForSynergy(playerSynergy);
 *     // aplicar bonus al jugador...
 *   }
 * }, [playerSynergy.isActive, playerSynergy.suit]);
 */
export const useSuitSynergy = ({
  playerBoard,
  opponentBoard,
}: UseSuitSynergyParams): UseSuitSynergyReturn => {
  const playerSynergy = useMemo(
    () => detectSuitSynergy(playerBoard),
    // Recalcula solo cuando cambien las cartas presentes en mesa
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      playerBoard[0].card?.id,
      playerBoard[1].card?.id,
      playerBoard[2].card?.id,
    ]
  );

  const opponentSynergy = useMemo(
    () => detectSuitSynergy(opponentBoard),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      opponentBoard[0].card?.id,
      opponentBoard[1].card?.id,
      opponentBoard[2].card?.id,
    ]
  );

  const getBonusForSynergy = (synergy: SuitSynergyResult): SuitSynergyBonus | null => {
    if (!synergy.isActive || !synergy.suit) return null;
    return SUIT_SYNERGY_BONUSES[synergy.suit];
  };

  return {
    playerSynergy,
    opponentSynergy,
    getBonusForSynergy,
  };
};
