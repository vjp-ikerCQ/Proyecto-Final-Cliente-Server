import { useEffect, useRef } from 'react';
import { type CardData } from '../../../utils/cardData';
import { type BoardSlot } from './useGameState';

interface BotAIOptions {
  isPlayerTurn: boolean;
  isLoading: boolean;
  opponentVoluntad: number;
  opponentHand: CardData[];
  opponentBoard: BoardSlot[];
  deck: CardData[];
  setOpponentHand: React.Dispatch<React.SetStateAction<CardData[]>>;
  setDeck: React.Dispatch<React.SetStateAction<CardData[]>>;
  setOpponentVoluntad: React.Dispatch<React.SetStateAction<number>>;
  setOpponentBoard: React.Dispatch<React.SetStateAction<BoardSlot[]>>;
  endTurn: (isPlayer: boolean) => void;
  board: BoardSlot[];
  hp: number;
  attackCard: (isPlayer: boolean, attackerSlotIndex: number, targetSlotIndex: number) => void;
  attackDirectly: (isPlayer: boolean, attackerSlotIndex: number) => void;
  healCard: (isPlayer: boolean, healerSlotIndex: number, targetSlotIndex: number) => void;
  useJoker: (isPlayer: boolean, handCardIndex: number) => void;
  playCard: (isPlayer: boolean, slotIndex: number, handCardIndex: number) => void;
  drawCard: (isPlayer: boolean) => void;
  opponentAttackedIndices: number[];
  opponentMagoAttacks: Record<number, number[]>;
}

export const useBotAI = ({
  isPlayerTurn,
  isLoading,
  opponentVoluntad,
  opponentHand,
  opponentBoard,
  deck,
  setOpponentHand: _setOpponentHand,
  setDeck: _setDeck,
  setOpponentVoluntad: _setOpponentVoluntad,
  setOpponentBoard: _setOpponentBoard,
  endTurn,
  board,
  hp,
  attackCard,
  attackDirectly,
  healCard,
  useJoker,
  playCard,
  drawCard,
  opponentAttackedIndices,
  opponentMagoAttacks
}: BotAIOptions) => {

  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (isPlayerTurn || isLoading) {
      isExecutingRef.current = false;
      return;
    }

    if (isExecutingRef.current) return;

    isExecutingRef.current = true;

    const timer = setTimeout(() => {
      let actionTaken = false;

      // 1. Usar Jokers
      const jokerIndex = opponentHand.findIndex(c => c.suit === 'jokers');
      if (jokerIndex !== -1 && opponentVoluntad >= 1) {
        useJoker(false, jokerIndex);
        actionTaken = true;
      }

      // 2. Bajar Cartas (slots vacíos primero)
      if (!actionTaken) {
        for (let i = 0; i < 3; i++) {
          if (!opponentBoard[i].card) {
            const playableIndex = opponentHand.findIndex(c => c.suit !== 'jokers');
            if (playableIndex !== -1) {
              playCard(false, i, playableIndex);
              actionTaken = true;
              break;
            }
          }
        }
      }

      // 2b. Escaleras: apilar carta si el rango siguiente está en la mano
      if (!actionTaken) {
        for (let i = 0; i < 3; i++) {
          const topCard = opponentBoard[i].card;
          if (topCard && topCard.rank < 12) {
            const ladderIdx = opponentHand.findIndex(
              c => c.suit !== 'jokers' && c.rank === topCard.rank + 1
            );
            if (ladderIdx !== -1) {
              playCard(false, i, ladderIdx);
              actionTaken = true;
              break;
            }
          }
        }
      }

      // 3. Atacar o Curar
      if (!actionTaken) {
        for (let i = 0; i < 3; i++) {
          const slot = opponentBoard[i];
          if (!slot.card) continue;
          
          const card = slot.card;
          const isMago = card.role.toUpperCase() === 'MAGO';
          const magoAttacks = opponentMagoAttacks[i] || [];
          const hasAttackedOnce = isMago && magoAttacks.length > 0;
          
          if (opponentAttackedIndices.includes(i)) continue;
          if (!hasAttackedOnce && opponentVoluntad < card.cost) continue;

          if (card.role === 'CURANDERO') {
            let targetToHeal = -1;
            for (let j = 0; j < 3; j++) {
              if (i !== j && opponentBoard[j].card) {
                const ally = opponentBoard[j].card!;
                // Cura si tiene menos de 5 de vida o si es la única carta
                if (ally.health <= 5) {
                  targetToHeal = j;
                  break;
                }
              }
            }
            if (targetToHeal !== -1) {
              healCard(false, i, targetToHeal);
              actionTaken = true;
              break;
            } else {
              continue; // Curandero no ataca
            }
          }

          if (card.attackType !== 'SOPORTE') {
            let canAttackDir = false;
            let validTargets: number[] = [];
            const TARGETING_ROLES = ['ASESINO', 'TANQUE', 'TIRADOR', 'PICARO', 'SOTA'];
            const isTargeting = TARGETING_ROLES.includes(card.role.toUpperCase()) || isMago;
            const hasPlayerCards = board.some(s => s.card);

            if (isMago) {
              const alreadyAttackedCara = magoAttacks.includes(-1);
              if (!alreadyAttackedCara && board.filter(s => s.card).length < 2) {
                 canAttackDir = true;
              }
              for (let j = 0; j < 3; j++) {
                if (board[j].card && !magoAttacks.includes(j)) {
                  validTargets.push(j);
                }
              }
            } else if (isTargeting) {
              if (!hasPlayerCards) canAttackDir = true;
              else {
                 for (let j = 0; j < 3; j++) {
                   if (board[j].card) validTargets.push(j);
                 }
              }
            } else if (card.attackType === 'COLUMNA') {
              if (!board[i].card) canAttackDir = true;
              else validTargets.push(i);
            } else if (card.attackType === 'DIRECTO') {
              canAttackDir = true;
            } else {
              if (!hasPlayerCards) canAttackDir = true;
              else if (board[i].card) validTargets.push(i);
            }

            if (validTargets.length > 0) {
              attackCard(false, i, validTargets[0]);
              actionTaken = true;
              break;
            } else if (canAttackDir) {
              attackDirectly(false, i);
              actionTaken = true;
              break;
            }
          }
        }
      }

      // 4. Robar cartas
      if (!actionTaken && opponentVoluntad >= 1 && opponentHand.length < 5 && deck.length > 0) {
        drawCard(false);
        actionTaken = true;
      }

      if (!actionTaken) {
        endTurn(false);
      }

    }, 800); // 800ms de pausa entre acciones del bot

    return () => {
      clearTimeout(timer);
      isExecutingRef.current = false;
    };
  }, [
    isPlayerTurn,
    isLoading,
    opponentHand,
    opponentVoluntad,
    opponentBoard,
    deck,
    board,
    hp,
    opponentAttackedIndices,
    opponentMagoAttacks,
    useJoker,
    playCard,
    drawCard,
    healCard,
    attackCard,
    attackDirectly,
    endTurn
  ]);
};

export const generateMockBotReply = (playerMessage: string): string => {
  const replies = [
    "¡Vaya, eso fue más útil que una cuchara de oro!",
    "¿De verdad piensas que eso funciona? 😂",
    "¡Ja! Ni siquiera la sombra de tu estrategia sirve.",
    "¿Otra jugada? Mejor guarda la dignidad.",
    "¡Esa frase suena como un hechizo fallido!",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};
