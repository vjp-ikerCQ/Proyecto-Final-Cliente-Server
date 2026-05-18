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

      // Carta inicial del oponente en tablero para pruebas
      const initialOpponentBoard = [
        { card: opponentInitialHand[0], stack: [opponentInitialHand[0]] },
        { card: null, stack: [] },
        { card: null, stack: [] }
      ];
      setOpponentHand(opponentInitialHand.slice(1));
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

      if (!board[slotIndex].card) {
        const newBoard = [...board];
        newBoard[slotIndex] = { card, stack: [card] };
        setBoard(newBoard);
        setHand(prev => prev.filter((_, i) => i !== handCardIndex));
      }
    } else {
      const card = opponentHand[handCardIndex];
      if (card.suit === 'jokers') return;

      if (!opponentBoard[slotIndex].card) {
        const newBoard = [...opponentBoard];
        newBoard[slotIndex] = { card, stack: [card] };
        setOpponentBoard(newBoard);
        setOpponentHand(prev => prev.filter((_, i) => i !== handCardIndex));
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
    if (isPlayer) {
      if (playerAttackedIndices.includes(attackerSlotIndex)) return; // ya atacó
      const attackerSlot = board[attackerSlotIndex];
      const targetSlot = opponentBoard[targetSlotIndex];
      if (!attackerSlot.card || !targetSlot.card) return;

      const damage = attackerSlot.card.attack;
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

      const newOpponentBoard = [...opponentBoard];
      if (remainingHealth <= 0) {
        newOpponentBoard[targetSlotIndex] = { card: null, stack: [] };
      } else {
        newOpponentBoard[targetSlotIndex] = {
          ...targetSlot,
          card: { ...targetSlot.card, health: remainingHealth }
        };
      }
      setOpponentBoard(newOpponentBoard);
      setPlayerAttackedIndices(prev => [...prev, attackerSlotIndex]);
    } else {
      if (opponentAttackedIndices.includes(attackerSlotIndex)) return; // ya atacó
      const attackerSlot = opponentBoard[attackerSlotIndex];
      const targetSlot = board[targetSlotIndex];
      if (!attackerSlot.card || !targetSlot.card) return;

      const damage = attackerSlot.card.attack;
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

      const newBoard = [...board];
      if (remainingHealth <= 0) {
        newBoard[targetSlotIndex] = { card: null, stack: [] };
      } else {
        newBoard[targetSlotIndex] = {
          ...targetSlot,
          card: { ...targetSlot.card, health: remainingHealth }
        };
      }
      setBoard(newBoard);
      setOpponentAttackedIndices(prev => [...prev, attackerSlotIndex]);
    }
  };

  // Lógica de ataque directo al rival
  const attackDirectly = (isPlayer: boolean, attackerSlotIndex: number) => {
    if (isPlayer) {
      if (playerAttackedIndices.includes(attackerSlotIndex)) return; // ya atacó
      const attackerSlot = board[attackerSlotIndex];
      if (!attackerSlot.card) return;

      const damage = attackerSlot.card.attack;
      let damageNum = 0;
      if (typeof damage === 'number') {
        damageNum = damage;
      } else if (typeof damage === 'string') {
        if (damage === '1/2') {
          damageNum = Math.floor(opponentHp / 2);
        } else {
          damageNum = parseInt(damage, 10) || 0;
        }
      }

      setOpponentHp(prev => Math.max(0, prev - damageNum));
      setPlayerAttackedIndices(prev => [...prev, attackerSlotIndex]);
    } else {
      if (opponentAttackedIndices.includes(attackerSlotIndex)) return; // ya atacó
      const attackerSlot = opponentBoard[attackerSlotIndex];
      if (!attackerSlot.card) return;

      const damage = attackerSlot.card.attack;
      let damageNum = 0;
      if (typeof damage === 'number') {
        damageNum = damage;
      } else if (typeof damage === 'string') {
        if (damage === '1/2') {
          damageNum = Math.floor(hp / 2);
        } else {
          damageNum = parseInt(damage, 10) || 0;
        }
      }

      setHp(prev => Math.max(0, prev - damageNum));
      setOpponentAttackedIndices(prev => [...prev, attackerSlotIndex]);
    }
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
    playerAttackedIndices,
    opponentAttackedIndices
  };
};
