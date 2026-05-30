import { useEffect, useRef } from 'react';
import { type CardData } from '../../../utils/cardData';
import { type BoardSlot } from './useGameState';

interface BotAIOptions {
  difficulty?: 'normal' | 'hard';
  isPlayerTurn: boolean;
  isLoading: boolean;
  opponentVoluntad: number;
  opponentHand: CardData[];
  opponentBoard: BoardSlot[];
  deck: CardData[];
  discardPile: CardData[];
  endTurn: (isPlayer: boolean) => void;
  board: BoardSlot[];
  hp: number;
  attackCard: (isPlayer: boolean, attackerSlotIndex: number, targetSlotIndex: number) => void;
  attackDirectly: (isPlayer: boolean, attackerSlotIndex: number) => void;
  healCard: (isPlayer: boolean, healerSlotIndex: number, targetSlotIndex: number) => void;
  activateJoker: (isPlayer: boolean, handCardIndex: number) => void;
  playCard: (isPlayer: boolean, slotIndex: number, handCardIndex: number) => void;
  drawCard: (isPlayer: boolean) => void;
  discardCard: (isPlayer: boolean, handCardIndex: number) => void;
  opponentHasDiscarded: boolean;
  opponentAttackedIndices: number[];
  opponentMagoAttacks: Record<number, number[]>;
}

export const evaluateTargetScore = (attackerCard: CardData, targetCard: CardData | null, difficulty: 'normal' | 'hard' = 'hard'): number => {
  if (difficulty === 'normal') {
    // Comportamiento aleatorio/menos óptimo en dificultad normal
    return Math.random() * 50;
  }

  let score = 0;

  if (!targetCard) {
    // Ataque directo a la cara del jugador
    return 10;
  }

  const role = targetCard.role.toUpperCase();
  
  // Puntuación base por nivel de amenaza
  if (['REY', 'AS', 'TIRADOR', 'MAGO', 'ASESINO', 'CABALLO'].includes(role)) {
    score += 30;
  } else if (['CLERIGO', 'CURANDERO'].includes(role)) {
    score += 15;
  } else {
    score += 5; // Amenaza baja
  }

  // Cálculo aproximado del daño
  let damageNum = 0;
  const isHalf = attackerCard.effect === 'half' || attackerCard.attack === '1/2';
  if (isHalf) {
    damageNum = Math.floor(targetCard.health / 2);
  } else if (typeof attackerCard.attack === 'number') {
    damageNum = attackerCard.attack;
  } else if (typeof attackerCard.attack === 'string') {
    damageNum = parseInt(attackerCard.attack, 10) || 0;
  }
  damageNum += attackerCard.ladderBonus || 0;
  if (attackerCard.suit === 'espadas' && !isHalf) damageNum += 1;
  
  let effectiveDamage = damageNum;
  if (targetCard.shield) effectiveDamage = Math.max(0, effectiveDamage - 1);
  if ((targetCard.bleedTurns ?? 0) > 0) effectiveDamage += 1;

  if (effectiveDamage >= targetCard.health) {
    score += 50; // Bonus letal! Limpiar cartas es prioritario.
  } else {
    score += effectiveDamage; // Si no lo mata, priorizamos hacer el mayor daño posible.
  }

  return score;
};

export const useBotAI = ({
  difficulty = 'hard',
  isPlayerTurn,
  isLoading,
  opponentVoluntad,
  opponentHand,
  opponentBoard,
  deck,
  discardPile,
  endTurn,
  board,
  hp,
  attackCard,
  attackDirectly,
  healCard,
  activateJoker,
  playCard,
  drawCard,
  discardCard,
  opponentHasDiscarded,
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

      // 0. Ahorro de Voluntad (Solo en modo Difícil)
      let savingWillpower = false;
      if (difficulty === 'hard') {
        for (let i = 0; i < 3; i++) {
          const slot = opponentBoard[i];
          if (!slot.card) continue;
          if (opponentAttackedIndices.includes(i)) continue;
          
          const card = slot.card;
          const isMago = card.role.toUpperCase() === 'MAGO';
          const magoAttacks = opponentMagoAttacks[i] || [];
          const hasAttackedOnce = isMago && magoAttacks.length > 0;
          
          // Si no ha atacado y no tenemos voluntad para pagar su ataque, queremos ahorrar
          if (!hasAttackedOnce && opponentVoluntad < card.cost) {
            savingWillpower = true;
            break;
          }
        }
      }

      // 1. Usar Jokers (Saltar si estamos ahorrando voluntad)
      if (!savingWillpower) {
        const jokerIndex = opponentHand.findIndex(c => c.suit === 'jokers');
        if (jokerIndex !== -1 && opponentVoluntad >= 1) {
          activateJoker(false, jokerIndex);
          actionTaken = true;
        }
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
      // Se permite hacer escaleras incluso ahorrando voluntad porque son gratis. (Solo en Difícil)
      if (!actionTaken && difficulty === 'hard') {
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
             // Curación inteligente
             let bestTarget = -1;
             let maxScore = -1;
             
             if (difficulty === 'normal') {
               // En normal, cura a la primera carta que vea herida
               for (let j = 0; j < 3; j++) {
                 if (i !== j && opponentBoard[j].card) {
                   const ally = opponentBoard[j].card!;
                   const maxHp = ally.maxHealth ?? 5;
                   if (ally.health < maxHp) {
                     bestTarget = j;
                     break;
                   }
                 }
               }
             } else {
               for (let j = 0; j < 3; j++) {
                 if (i !== j && opponentBoard[j].card) {
                   const ally = opponentBoard[j].card!;
                   const maxHp = ally.maxHealth ?? 5; // Valor seguro por defecto
                   if (ally.health < maxHp) {
                     let allyScore = 0;
                     const role = ally.role.toUpperCase();
                     if (['REY', 'AS', 'TIRADOR', 'MAGO', 'ASESINO', 'CABALLO'].includes(role)) allyScore += 30;
                     else if (['CLERIGO', 'CURANDERO'].includes(role)) allyScore += 15;
                     else allyScore += 5;
                     
                     // Prioridad a cartas cerca de la muerte
                     if (ally.health <= 3) allyScore += 20;
  
                     if (allyScore > maxScore) {
                       maxScore = allyScore;
                       bestTarget = j;
                     }
                   }
                 }
               }
             }
             if (bestTarget !== -1) {
               healCard(false, i, bestTarget);
               actionTaken = true;
               break;
             } else {
               continue; // Curandero no ataca
             }
          }

          if (card.attackType !== 'SOPORTE') {
            let canAttackDir = false;
            const validTargets: number[] = [];
            const isAs = card.rank === 1;
            const TARGETING_ROLES = ['ASESINO', 'TANQUE', 'TIRADOR', 'PICARO', 'SOTA'];
            const isTargeting = TARGETING_ROLES.includes(card.role.toUpperCase()) || isMago || isAs;
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

            // Target evaluation
            let bestTarget = -1;
            let maxScore = -1;

            for (const targetIdx of validTargets) {
               const targetCard = board[targetIdx].card!;
               const score = evaluateTargetScore(card, targetCard, difficulty);
               if (score > maxScore) {
                 maxScore = score;
                 bestTarget = targetIdx;
               }
            }

            if (canAttackDir) {
               const dirScore = evaluateTargetScore(card, null, difficulty);
               if (dirScore > maxScore) {
                 bestTarget = -1; // -1 significa ataque directo al jugador
                 maxScore = dirScore;
               }
            }

            if (bestTarget !== -1 && maxScore > -1) {
              if (bestTarget === -1) {
                attackDirectly(false, i);
              } else {
                attackCard(false, i, bestTarget);
              }
              actionTaken = true;
              break;
            }
          }
        }
      }

      // 3b. Descartar si la mano está llena y no puede jugar ninguna carta
      if (!actionTaken && !opponentHasDiscarded && opponentHand.length >= 5) {
        const allSlotsOccupied = opponentBoard.every(s => s.card);
        if (allSlotsOccupied) {
          const discardableIdx = opponentHand.findIndex(c => c.suit !== 'jokers');
          if (discardableIdx !== -1) {
            discardCard(false, discardableIdx);
            actionTaken = true;
          }
        }
      }

      // 4. Robar cartas (Solo si NO estamos ahorrando voluntad)
      if (!actionTaken && !savingWillpower && opponentVoluntad >= 1 && opponentHand.length < 5 && (deck.length > 0 || discardPile.length > 0)) {
        drawCard(false);
        actionTaken = true;
      }

      if (!actionTaken) {
        endTurn(false);
      }

    }, difficulty === 'hard' ? 800 : 1500); // 800ms Difícil, 1500ms Normal

    return () => {
      clearTimeout(timer);
      isExecutingRef.current = false;
    };
  }, [
    difficulty,
    isPlayerTurn,
    isLoading,
    opponentHand,
    opponentVoluntad,
    opponentBoard,
    deck,
    discardPile,
    board,
    hp,
    opponentAttackedIndices,
    opponentMagoAttacks,
    activateJoker,
    playCard,
    drawCard,
    discardCard,
    opponentHasDiscarded,
    healCard,
    attackCard,
    attackDirectly,
    endTurn
  ]);
};

export const generateMockBotReply = (_playerMessage: string): string => {
  // Use the message to avoid unused variable warning or just ignore it
  console.log('Bot replying to:', _playerMessage);
  const replies = [
    "¡Vaya, eso fue más útil que una cuchara de oro!",
    "¿De verdad piensas que eso funciona? 😂",
    "¡Ja! Ni siquiera la sombra de tu estrategia sirve.",
    "¿Otra jugada? Mejor guarda la dignidad.",
    "¡Esa frase suena como un hechizo fallido!",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};
