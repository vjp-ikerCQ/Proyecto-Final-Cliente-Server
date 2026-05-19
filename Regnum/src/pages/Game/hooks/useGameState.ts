import { useState, useEffect } from 'react';
import { type CardData, allCards } from '../../../utils/cardData';
import { fetchShuffledDeck } from '../../../services/cardService';

export interface BoardSlot {
  card: CardData | null;
  stack: CardData[];
}

export const useGameState = () => {
  // Estado del Jugador
  const [voluntad, setVoluntad] = useState(10);
  const [hp, setHp] = useState(100);
  const [hand, setHand] = useState<CardData[]>([]);
  const [board, setBoard] = useState<BoardSlot[]>([
    { card: null, stack: [] },
    { card: null, stack: [] },
    { card: null, stack: [] }
  ]);

  // Estado del Oponente
  const [opponentHp, setOpponentHp] = useState(100);
  const [opponentVoluntad, setOpponentVoluntad] = useState(10);
  const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
  const [opponentBoard, setOpponentBoard] = useState<BoardSlot[]>([
    { card: null, stack: [] },
    { card: null, stack: [] },
    { card: null, stack: [] }
  ]);

  // Estado del Juego
  const [deck, setDeck] = useState<CardData[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Estado de ataque (rastrear qué cartas ya atacaron en el turno actual)
  const [playerAttackedIndices, setPlayerAttackedIndices] = useState<number[]>([]);
  const [opponentAttackedIndices, setOpponentAttackedIndices] = useState<number[]>([]);

  // Inicializar mazo
  const initializeGame = async () => {
    setIsLoading(true);
    try {
      const sharedShuffledDeck = await fetchShuffledDeck();

      // Repartir al jugador
      const playerInitialHand = sharedShuffledDeck.slice(0, 3);
      // Repartir al oponente
      const opponentInitialHand = sharedShuffledDeck.slice(3, 6);
      // Mazo compartido
      const remainingDeck = sharedShuffledDeck.slice(6);

      setHand(playerInitialHand);
      setOpponentHand(opponentInitialHand);
      setDeck(remainingDeck);

      // Carta inicial del oponente en el tablero para pruebas (nunca un Joker)
      const initialOpponentBoard = [
        { card: null as CardData | null, stack: [] as CardData[] },
        { card: null as CardData | null, stack: [] as CardData[] },
        { card: null as CardData | null, stack: [] as CardData[] }
      ];
      let finalOpponentHand = [...opponentInitialHand];

      const firstNonJokerIndex = opponentInitialHand.findIndex(card => card.suit !== 'jokers');
      if (firstNonJokerIndex !== -1) {
        const startCard = opponentInitialHand[firstNonJokerIndex];
        initialOpponentBoard[0] = { card: startCard, stack: [startCard] };
        finalOpponentHand = opponentInitialHand.filter((_, idx) => idx !== firstNonJokerIndex);
      }

      setOpponentHand(finalOpponentHand);
      setOpponentBoard(initialOpponentBoard);
    } catch (error) {
      console.error("Error inicializando el juego:", error);
      const fallbackHand = Array.from({ length: 3 }, () =>
        allCards[Math.floor(Math.random() * allCards.length)]
      );
      setHand(fallbackHand);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeGame();
  }, []);

  // Robar carta (jugador o bot)
  const drawCard = (isPlayer: boolean) => {
    if (isPlayer) {
      if (voluntad >= 1 && hand.length < 5 && deck.length > 0) {
        const nextCard = deck[0];
        setHand(prev => [...prev, nextCard]);
        setDeck(prev => prev.slice(1));
        setVoluntad(v => v - 1);
      }
    } else {
      if (opponentVoluntad >= 1 && opponentHand.length < 5 && deck.length > 0) {
        const nextCard = deck[0];
        setOpponentHand(prev => [...prev, nextCard]);
        setDeck(prev => prev.slice(1));
        setOpponentVoluntad(v => v - 1);
      }
    }
  };

  // Jugar carta en tablero (jugador o bot)
  const playCard = (isPlayer: boolean, slotIndex: number, handCardIndex: number) => {
    if (isPlayer) {
      const card = hand[handCardIndex];
      if (card.suit === 'jokers') return;
      if (voluntad < card.cost) return; // Validación de voluntad

      if (!board[slotIndex].card) {
        const newBoard = [...board];
        newBoard[slotIndex] = { card, stack: [card] };
        setBoard(newBoard);
        setHand(prev => prev.filter((_, i) => i !== handCardIndex));
        setVoluntad(v => v - card.cost); // Restar el coste de voluntad
      }
    } else {
      const card = opponentHand[handCardIndex];
      if (card.suit === 'jokers') return;
      if (opponentVoluntad < card.cost) return; // Validación de voluntad

      if (!opponentBoard[slotIndex].card) {
        const newBoard = [...opponentBoard];
        newBoard[slotIndex] = { card, stack: [card] };
        setOpponentBoard(newBoard);
        setOpponentHand(prev => prev.filter((_, i) => i !== handCardIndex));
        setOpponentVoluntad(v => v - card.cost); // Restar el coste de voluntad
      }
    }
  };

  // Usar Joker (jugador o bot)
  const useJoker = (isPlayer: boolean, handCardIndex: number) => {
    if (isPlayer) {
      const card = hand[handCardIndex];
      if (card.suit !== 'jokers') return;

      if (voluntad >= 1) {
        setHand(prev => prev.filter((_, i) => i !== handCardIndex));
        setVoluntad(v => v - 1);
      }
    } else {
      const card = opponentHand[handCardIndex];
      if (card.suit !== 'jokers') return;

      if (opponentVoluntad >= 1) {
        setOpponentHand(prev => prev.filter((_, i) => i !== handCardIndex));
        setOpponentVoluntad(v => v - 1);
      }
    }
  };

  // Lógica de ataque a una carta en tablero
  const attackCard = (isPlayer: boolean, attackerSlotIndex: number, targetSlotIndex: number) => {
    const attackerAttackedIndices = isPlayer ? playerAttackedIndices : opponentAttackedIndices;
    if (attackerAttackedIndices.includes(attackerSlotIndex)) return; // ya atacó

    const attackerBoard = isPlayer ? board : opponentBoard;
    const defenderBoard = isPlayer ? opponentBoard : board;

    const attackerSlot = attackerBoard[attackerSlotIndex];
    const targetSlot = defenderBoard[targetSlotIndex];
    if (!attackerSlot.card || !targetSlot.card) return;

    const attackerCard = attackerSlot.card;

    // Restricciones de combate según attackType
    if (attackerCard.attackType === 'SOPORTE') return; // Soporte no ataca
    if (attackerCard.attackType === 'DIRECTO') return; // Reyes no atacan cartas
    if (attackerCard.attackType === 'COLUMNA' && attackerSlotIndex !== targetSlotIndex) return; // Restricción de columna

    const damage = attackerCard.attack;
    let damageNum = 0;
    if (typeof damage === 'number') {
      damageNum = damage;
    } else if (typeof damage === 'string') {
      if (damage === '1/2') {
        damageNum = Math.floor(targetSlot.card.health / 2);
      } else {
        damageNum = parseInt(damage, 10) || 0;
      }
    }

    const remainingHealth = targetSlot.card.health - damageNum;

    // Actualizar tablero defensor
    const setDefenderBoard = isPlayer ? setOpponentBoard : setBoard;
    const newDefenderBoard = [...defenderBoard];
    if (remainingHealth <= 0) {
      newDefenderBoard[targetSlotIndex] = { card: null, stack: [] };
    } else {
      newDefenderBoard[targetSlotIndex] = {
        ...targetSlot,
        card: { ...targetSlot.card, health: remainingHealth }
      };
    }
    setDefenderBoard(newDefenderBoard);

    // Efecto perforante (Tirador) -> Daño directo a la vida del rival
    if (attackerCard.attackType === 'PERFORAR') {
      const setDefenderHp = isPlayer ? setOpponentHp : setHp;
      setDefenderHp(prev => Math.max(0, prev - damageNum));
    }

    // Habilidad de Asesino de Oros (Rank 2) -> +1 de voluntad
    if (attackerCard.rank === 2 && attackerCard.suit === 'oros') {
      const setAttackerVoluntad = isPlayer ? setVoluntad : setOpponentVoluntad;
      setAttackerVoluntad(v => Math.min(10, v + 1));
    }

    // Habilidad de Tirador de Oros (Rank 7) al eliminar -> +2 de voluntad
    if (attackerCard.rank === 7 && attackerCard.suit === 'oros' && remainingHealth <= 0) {
      const setAttackerVoluntad = isPlayer ? setVoluntad : setOpponentVoluntad;
      setAttackerVoluntad(v => Math.min(10, v + 2));
    }

    const setAttackerAttackedIndices = isPlayer ? setPlayerAttackedIndices : setOpponentAttackedIndices;
    setAttackerAttackedIndices(prev => [...prev, attackerSlotIndex]);
  };

  // Lógica de ataque directo al rival
  const attackDirectly = (isPlayer: boolean, attackerSlotIndex: number) => {
    const attackerAttackedIndices = isPlayer ? playerAttackedIndices : opponentAttackedIndices;
    if (attackerAttackedIndices.includes(attackerSlotIndex)) return; // ya atacó

    const attackerBoard = isPlayer ? board : opponentBoard;
    const attackerSlot = attackerBoard[attackerSlotIndex];
    if (!attackerSlot.card) return;

    const attackerCard = attackerSlot.card;

    // Restricciones de ataque directo
    if (attackerCard.attackType === 'SOPORTE') return; // Soporte no ataca directamente

    // Bloquear ataque directo si el defensor tiene cartas y no es ataque DIRECTO
    const defenderBoard = isPlayer ? opponentBoard : board;
    const hasDefenderCards = defenderBoard.some(s => s.card);
    if (attackerCard.attackType !== 'DIRECTO' && hasDefenderCards) return;

    const damage = attackerCard.attack;
    let damageNum = 0;
    const defenderHp = isPlayer ? opponentHp : hp;
    if (typeof damage === 'number') {
      damageNum = damage;
    } else if (typeof damage === 'string') {
      if (damage === '1/2') {
        damageNum = Math.floor(defenderHp / 2);
      } else {
        damageNum = parseInt(damage, 10) || 0;
      }
    }

    const setDefenderHp = isPlayer ? setOpponentHp : setHp;
    setDefenderHp(prev => Math.max(0, prev - damageNum));

    // Habilidad de Asesino de Oros (Rank 2) al atacar
    if (attackerCard.rank === 2 && attackerCard.suit === 'oros') {
      const setAttackerVoluntad = isPlayer ? setVoluntad : setOpponentVoluntad;
      setAttackerVoluntad(v => Math.min(10, v + 1));
    }

    const setAttackerAttackedIndices = isPlayer ? setPlayerAttackedIndices : setOpponentAttackedIndices;
    setAttackerAttackedIndices(prev => [...prev, attackerSlotIndex]);
  };

  const getMaxHealthByRank = (rank: number): number => {
    const hpMap: Record<number, number> = {
      1: 10, 2: 3, 3: 5, 4: 12, 5: 4, 6: 5, 7: 4, 8: 4, 9: 5, 10: 6, 11: 8, 12: 9
    };
    return hpMap[rank] || 5;
  };

  // Lógica de curación a una carta aliada en tablero (Curanderos)
  const healCard = (isPlayer: boolean, healerSlotIndex: number, targetSlotIndex: number) => {
    const attackerAttackedIndices = isPlayer ? playerAttackedIndices : opponentAttackedIndices;
    if (attackerAttackedIndices.includes(healerSlotIndex)) return; // ya actuó

    const attackerBoard = isPlayer ? board : opponentBoard;
    const healerSlot = attackerBoard[healerSlotIndex];
    const targetSlot = attackerBoard[targetSlotIndex];
    if (!healerSlot.card || !targetSlot.card) return;

    const healerCard = healerSlot.card;
    if (healerCard.role !== 'CURANDERO') return;

    const healAmount = 5;
    const maxHp = getMaxHealthByRank(targetSlot.card.rank);
    const currentHp = targetSlot.card.health;
    const targetNewHp = Math.min(maxHp, currentHp + healAmount);

    const setAttackerBoard = isPlayer ? setBoard : setOpponentBoard;
    const newBoard = [...attackerBoard];
    newBoard[targetSlotIndex] = {
      ...targetSlot,
      card: { ...targetSlot.card, health: targetNewHp }
    };
    setAttackerBoard(newBoard);

    // Curandero de Oros: +1 de voluntad si cura por completo
    if (healerCard.suit === 'oros' && targetNewHp === maxHp && currentHp < maxHp) {
      const setAttackerVoluntad = isPlayer ? setVoluntad : setOpponentVoluntad;
      setAttackerVoluntad(v => Math.min(10, v + 1));
    }

    const setAttackerAttackedIndices = isPlayer ? setPlayerAttackedIndices : setOpponentAttackedIndices;
    setAttackerAttackedIndices(prev => [...prev, healerSlotIndex]);
  };

  // Finalizar turno (jugador o bot)
  const endTurn = (isPlayer: boolean) => {
    if (isPlayer) {
      setVoluntad(v => Math.min(v + 2, 10));
      if (board.filter(s => s.card).length === 0) {
        setHp(prev => Math.max(0, prev - 10));
      }
      setPlayerAttackedIndices([]);
      setIsPlayerTurn(false);
    } else {
      setOpponentVoluntad(v => Math.min(v + 2, 10));
      if (opponentBoard.filter(s => s.card).length === 0) {
        setOpponentHp(prev => Math.max(0, prev - 10));
      }
      setOpponentAttackedIndices([]);
      setIsPlayerTurn(true);
    }
  };

  return {
    voluntad,
    setVoluntad,
    hp,
    setHp,
    hand,
    setHand,
    board,
    setBoard,
    opponentHp,
    setOpponentHp,
    opponentVoluntad,
    setOpponentVoluntad,
    opponentHand,
    setOpponentHand,
    opponentBoard,
    setOpponentBoard,
    deck,
    setDeck,
    isPlayerTurn,
    setIsPlayerTurn,
    isLoading,
    initializeGame,
    drawCard,
    playCard,
    useJoker,
    endTurn,
    attackCard,
    attackDirectly,
    healCard,
    playerAttackedIndices,
    opponentAttackedIndices
  };
};
