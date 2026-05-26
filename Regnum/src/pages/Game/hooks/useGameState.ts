import { useState, useEffect } from 'react';
import { type CardData, allCards } from '../../../utils/cardData';
import { fetchShuffledDeck } from '../../../services/cardService';

const TARGETING_ROLES = ['ASESINO', 'TANQUE', 'TIRADOR', 'PICARO', 'MAGO', 'SOTA'];

type SynergyPalo = 'espadas' | 'copas' | 'oros' | 'bastos' | null;

const detectBoardSynergy = (slots: { card: CardData | null }[]): SynergyPalo => {
  const cards = slots.map(s => s.card);
  if (cards.some(c => c === null)) return null;
  const [c0, c1, c2] = cards as [CardData, CardData, CardData];
  if (c0.suit === 'jokers') return null;
  if (c0.suit !== c1.suit || c0.suit !== c2.suit) return null;
  return c0.suit as SynergyPalo;
};

// Devuelve true si la carta puede apilarse sobre el slot (escalera: rank+1, no jokers, no rank 12)
const canPlaceLadder = (card: CardData, slot: { card: CardData | null; stack: CardData[] }): boolean => {
  if (!slot.card || slot.card.suit === 'jokers' || card.suit === 'jokers') return false;
  return card.rank === slot.card.rank + 1 && slot.card.rank < 12;
};

export interface BoardSlot {
  card: CardData | null;
  stack: CardData[];
}

export const useGameState = () => {
  // Estado del Jugador
  const [voluntad, setVoluntad] = useState(10);
  const [hp, setHp] = useState(30);
  const [hand, setHand] = useState<CardData[]>([]);
  const [board, setBoard] = useState<BoardSlot[]>([
    { card: null, stack: [] },
    { card: null, stack: [] },
    { card: null, stack: [] }
  ]);

  // Estado del Oponente
  const [opponentHp, setOpponentHp] = useState(30);
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


  // Rastreo de objetivos atacados por Magos en el turno actual (key: índice del mago, value: array de índices de objetivos atacados)
  const [playerMagoAttacks, setPlayerMagoAttacks] = useState<Record<number, number[]>>({});
  const [opponentMagoAttacks, setOpponentMagoAttacks] = useState<Record<number, number[]>>({});

  // Descarte (máximo 1 por ronda, coste 0) — pila compartida
  const [playerHasDiscarded, setPlayerHasDiscarded] = useState(false);
  const [opponentHasDiscarded, setOpponentHasDiscarded] = useState(false);
  const [discardPile, setDiscardPile] = useState<CardData[]>([]);
  // Señal de rebaraje: se incrementa cada vez que los descartes pasan al mazo
  const [reshuffleCount, setReshuffleCount] = useState(0);

  // Inicializar mazo
  const initializeGame = async () => {
    // Resetear estados del juego
    setVoluntad(10);
    setHp(30);
    setBoard([
      { card: null, stack: [] },
      { card: null, stack: [] },
      { card: null, stack: [] }
    ]);
    setOpponentHp(30);
    setOpponentVoluntad(10);
    setPlayerAttackedIndices([]);
    setOpponentAttackedIndices([]);
    setPlayerMagoAttacks({});
    setOpponentMagoAttacks({});
    setPlayerHasDiscarded(false);
    setOpponentHasDiscarded(false);
    setDiscardPile([]);
    setIsPlayerTurn(true);

    try {
      const sharedShuffledDeck = await fetchShuffledDeck();

      // Repartir al jugador
      const playerInitialHand = sharedShuffledDeck.slice(0, 3);
      // Repartir al oponente
      const opponentInitialHand = sharedShuffledDeck.slice(3, 6);
      // Mazo compartido con el resto de cartas
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
    fetchShuffledDeck()
      .then(sharedShuffledDeck => {
        const playerInitialHand = sharedShuffledDeck.slice(0, 3);
        const opponentInitialHand = sharedShuffledDeck.slice(3, 6);
        const remainingDeck = sharedShuffledDeck.slice(6);

        setHand(playerInitialHand);
        setDeck(remainingDeck);

        const initialOpponentBoard: BoardSlot[] = [
          { card: null, stack: [] },
          { card: null, stack: [] },
          { card: null, stack: [] }
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
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error inicializando el juego:', error);
        const fallbackHand = Array.from({ length: 3 }, () =>
          allCards[Math.floor(Math.random() * allCards.length)]
        );
        setHand(fallbackHand);
        setIsLoading(false);
      });
  }, []);

  // Fisher-Yates shuffle
  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Robar carta (jugador o bot).
  // Si el mazo está vacío: rebarajea la pila de descartes como nuevo mazo
  // y ambos jugadores reciben 5 de daño como penalización.
  const drawCard = (isPlayer: boolean) => {
    const currentVoluntad = isPlayer ? voluntad : opponentVoluntad;
    const currentHand    = isPlayer ? hand : opponentHand;

    if (currentVoluntad < 1 || currentHand.length >= 5) return;

    // Determinar de qué pila robar (mazo actual o descartes rebarajados)
    let sourceDeck = deck;
    if (sourceDeck.length === 0) {
      if (discardPile.length === 0) return; // sin cartas disponibles
      // Rebarajar descartes → nuevo mazo; penalización de 5 HP a ambos
      sourceDeck = shuffle(discardPile);
      setDiscardPile([]);
      setHp(prev  => Math.max(0, prev - 5));
      setOpponentHp(prev => Math.max(0, prev - 5));
      setReshuffleCount(c => c + 1);
    }

    const nextCard  = sourceDeck[0];
    const remaining = sourceDeck.slice(1);

    if (isPlayer) {
      setHand(prev => [...prev, nextCard]);
      setVoluntad(v => v - 1);
    } else {
      setOpponentHand(prev => [...prev, nextCard]);
      setOpponentVoluntad(v => v - 1);
    }
    setDeck(remaining);
  };

  const applyStartDmg = (card: CardData, slotIndex: number, isPlayer: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cardAny = card as any;

    const isStartDmg = card.playEffect === 'start_dmg'
      || card.effect === 'start_dmg'
      || cardAny.efecto === 'start_dmg';

    // Busca cantidad_efecto en: playAmount → top-level → habilidad → fallback 0
    const rawAmount = card.playAmount
      ?? cardAny.cantidad_efecto
      ?? cardAny.habilidad?.cantidad_efecto
      ?? 0;
    const amount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) || 0;

    if (!isStartDmg || amount <= 0) return;

    const targetBoard = isPlayer ? opponentBoard : board;
    const setTargetBoard = isPlayer ? setOpponentBoard : setBoard;
    const targetSlot = targetBoard[slotIndex];

    if (!targetSlot.card) return;
    const newBoard = [...targetBoard];
    const remaining = targetSlot.card.health - amount;
    if (remaining <= 0 && targetSlot.stack.length > 0) {
      setDiscardPile(prev => [...prev, ...targetSlot.stack]);
    }
    newBoard[slotIndex] = remaining <= 0
      ? { card: null, stack: [] }
      : { ...targetSlot, card: { ...targetSlot.card, health: remaining } };
    setTargetBoard(newBoard);
  };

  // Jugar carta en tablero (jugador o bot)
  const playCard = (isPlayer: boolean, slotIndex: number, handCardIndex: number) => {
    if (isPlayer) {
      const card = hand[handCardIndex];
      if (card.suit === 'jokers') return;
      const slot = board[slotIndex];

      if (!slot.card) {
        const newBoard = [...board];
        newBoard[slotIndex] = { card, stack: [card] };
        setBoard(newBoard);
        setHand(prev => prev.filter((_, i) => i !== handCardIndex));
        applyStartDmg(card, slotIndex, true);
      } else if (canPlaceLadder(card, slot)) {
        // Escalera: apilar carta sobre la existente con bonus de ATK
        const bonus = slot.stack.length; // cards below = bonus for this card
        const stackedCard: CardData = { ...card, ladderBonus: (card.ladderBonus || 0) + bonus };
        const newBoard = [...board];
        newBoard[slotIndex] = { card: stackedCard, stack: [...slot.stack, stackedCard] };
        setBoard(newBoard);
        setHand(prev => prev.filter((_, i) => i !== handCardIndex));
        applyStartDmg(card, slotIndex, true);
      }
    } else {
      const card = opponentHand[handCardIndex];
      if (card.suit === 'jokers') return;
      const slot = opponentBoard[slotIndex];

      if (!slot.card) {
        const newBoard = [...opponentBoard];
        newBoard[slotIndex] = { card, stack: [card] };
        setOpponentBoard(newBoard);
        setOpponentHand(prev => prev.filter((_, i) => i !== handCardIndex));
        applyStartDmg(card, slotIndex, false);
      } else if (canPlaceLadder(card, slot)) {
        const bonus = slot.stack.length;
        const stackedCard: CardData = { ...card, ladderBonus: (card.ladderBonus || 0) + bonus };
        const newBoard = [...opponentBoard];
        newBoard[slotIndex] = { card: stackedCard, stack: [...slot.stack, stackedCard] };
        setOpponentBoard(newBoard);
        setOpponentHand(prev => prev.filter((_, i) => i !== handCardIndex));
      }
    }
  };

  // Usar Joker (jugador o bot) — la carta joker va a la pila de descartes
  const useJoker = (isPlayer: boolean, handCardIndex: number) => {
    if (isPlayer) {
      const card = hand[handCardIndex];
      if (card.suit !== 'jokers') return;

      if (voluntad >= 1) {
        setHand(prev => prev.filter((_, i) => i !== handCardIndex));
        setDiscardPile(prev => [...prev, card]);
        setVoluntad(v => v - 1);
      }
    } else {
      const card = opponentHand[handCardIndex];
      if (card.suit !== 'jokers') return;

      if (opponentVoluntad >= 1) {
        setOpponentHand(prev => prev.filter((_, i) => i !== handCardIndex));
        setDiscardPile(prev => [...prev, card]);
        setOpponentVoluntad(v => v - 1);
      }
    }
  };

  // Joker 1 — Intercambio: intercambia 2 cartas del jugador por 2 del rival
  const joker1Swap = (playerIndices: number[], opponentIndices: number[]) => {
    if (playerIndices.length !== 2 || opponentIndices.length !== 2) return;
    const newHand = [...hand];
    const newOpponentHand = [...opponentHand];
    const p0 = newHand[playerIndices[0]];
    const p1 = newHand[playerIndices[1]];
    newHand[playerIndices[0]] = newOpponentHand[opponentIndices[0]];
    newHand[playerIndices[1]] = newOpponentHand[opponentIndices[1]];
    newOpponentHand[opponentIndices[0]] = p0;
    newOpponentHand[opponentIndices[1]] = p1;
    setHand(newHand);
    setOpponentHand(newOpponentHand);
  };

  // Joker 3 — Resurrección: saca una carta aleatoria de la pila de descartes y la añade a la mano del jugador
  // Devuelve false si la pila estaba vacía
  const joker3Resurrect = (): boolean => {
    if (discardPile.length === 0) return false;
    const idx = Math.floor(Math.random() * discardPile.length);
    const card = discardPile[idx];
    // La carta revive con la vida máxima
    const revivedCard: CardData = {
      ...card,
      health: card.maxHealth ?? getMaxHealthByRank(card.rank),
      poisonTurns: undefined,
      bleedTurns: undefined,
      shield: undefined,
    };
    setDiscardPile(prev => prev.filter((_, i) => i !== idx));
    setHand(prev => [...prev, revivedCard]);
    return true;
  };

  // Joker 2 — Retorno: intercambia una carta del tablero con una de la mano.
  // Si handCardIndex no se proporciona, simplemente devuelve la carta del tablero a la mano.
  // Devuelve 'ok', 'ladder' (escalera bloqueada) o 'no_card' (slot vacío).
  type Joker2Result = 'ok' | 'ladder' | 'no_card';
  const joker2Swap = (boardSlotIndex: number, handCardIndex?: number): Joker2Result => {
    const slot = board[boardSlotIndex];
    if (!slot.card) return 'no_card';
    if (slot.stack.length > 1) return 'ladder';

    const boardCard = slot.card;
    const newBoard = [...board];

    if (handCardIndex !== undefined) {
      const handCard = hand[handCardIndex];
      newBoard[boardSlotIndex] = { card: handCard, stack: [handCard] };
      setBoard(newBoard);
      setHand(prev => prev.map((c, i) => (i === handCardIndex ? boardCard : c)));
    } else {
      // Solo devolver la carta del tablero a la mano
      newBoard[boardSlotIndex] = { card: null, stack: [] };
      setBoard(newBoard);
      setHand(prev => [...prev, boardCard]);
    }

    return 'ok';
  };

  // Descartar una carta de la mano (máx 1 por ronda, coste 0) — pila compartida
  const discardCard = (isPlayer: boolean, handCardIndex: number) => {
    if (isPlayer) {
      if (playerHasDiscarded) return;
      const card = hand[handCardIndex];
      if (!card) return;
      setHand(prev => prev.filter((_, i) => i !== handCardIndex));
      setDiscardPile(prev => [...prev, card]);
      setPlayerHasDiscarded(true);
    } else {
      if (opponentHasDiscarded) return;
      const card = opponentHand[handCardIndex];
      if (!card) return;
      setOpponentHand(prev => prev.filter((_, i) => i !== handCardIndex));
      setDiscardPile(prev => [...prev, card]);
      setOpponentHasDiscarded(true);
    }
  };

  // Comprobar si un mago específico ya atacó a un objetivo en el turno actual
  const hasMagoAttackedTarget = (isPlayer: boolean, magoIndex: number, targetIndex: number): boolean => {
    const magoAttacksMap = isPlayer ? playerMagoAttacks : opponentMagoAttacks;
    const previousTargets = magoAttacksMap[magoIndex] || [];
    return previousTargets.includes(targetIndex);
  };

  // Lógica de ataque a una carta en tablero
  const attackCard = (isPlayer: boolean, attackerSlotIndex: number, targetSlotIndex: number) => {
    // Verificar si el atacante ya atacó en este turno
    const attackedIndices = isPlayer ? playerAttackedIndices : opponentAttackedIndices;
    if (attackedIndices.includes(attackerSlotIndex)) return;

    const attackerBoard = isPlayer ? board : opponentBoard;
    const defenderBoard = isPlayer ? opponentBoard : board;

    const attackerSlot = attackerBoard[attackerSlotIndex];
    const targetSlot = defenderBoard[targetSlotIndex];
    if (!attackerSlot.card || !targetSlot.card) return;

    const attackerSynergy = detectBoardSynergy(attackerBoard);
    const defenderSynergy = detectBoardSynergy(defenderBoard);

    const attackerCard = attackerSlot.card;
    const isAsDeOros = attackerCard.rank === 1 && attackerCard.suit === 'oros';
    const isAsDeCopas = attackerCard.rank === 1 && attackerCard.suit === 'copas';
    const isAsDeEspadas = attackerCard.rank === 1 && attackerCard.suit === 'espadas';
    const isAsDeBastos = attackerCard.rank === 1 && attackerCard.suit === 'bastos';
    const isAreaAttack = isAsDeOros || isAsDeCopas || isAsDeBastos;

    // Si es un mago, verificar que no ataque al mismo objetivo dos veces en el mismo turno
    const isMago = attackerCard.role.toUpperCase() === 'MAGO';
    if (isMago && hasMagoAttackedTarget(isPlayer, attackerSlotIndex, targetSlotIndex)) return;

    // Determinar si ya realizó su primer ataque en este turno (para Magos)
    const magoAttacksMap = isPlayer ? playerMagoAttacks : opponentMagoAttacks;
    const previousTargets = magoAttacksMap[attackerSlotIndex] || [];
    const hasAlreadyAttackedOnce = isMago && previousTargets.length > 0;

    // Si no es una de las cartas que pueden elegir a qué carta pegar, solo puede pegar a su propia columna
    if (!TARGETING_ROLES.includes(attackerCard.role.toUpperCase()) && !isAreaAttack && !isAsDeEspadas) {
      if (attackerSlotIndex !== targetSlotIndex) return;
    }

    // Restricciones de combate según attackType
    if (attackerCard.attackType === 'SOPORTE') return; // Soporte no ataca
    if (attackerCard.attackType === 'DIRECTO' || attackerCard.role.toUpperCase() === 'REY') {
      // El Rey solo ataca al rival, redirigimos el ataque si intentan apuntar a una carta
      attackDirectly(isPlayer, attackerSlotIndex);
      return;
    }
    if (attackerCard.attackType === 'COLUMNA' && attackerSlotIndex !== targetSlotIndex) return; // Restricción de columna

    // Verificar voluntad suficiente para ejercer el ataque (solo si es su primer ataque)
    const currentVoluntad = isPlayer ? voluntad : opponentVoluntad;
    if (!hasAlreadyAttackedOnce && currentVoluntad < attackerCard.cost) return;

    const isHalf = attackerCard.effect === 'half' || attackerCard.attack === '1/2';
    const targetHealth = targetSlot.card.health;
    let damageNum = 0;

    if (isHalf) {
      // HP=1 siempre muere; resto: daño = floor(HP/2), vida restante = ceil(HP/2)
      damageNum = targetHealth <= 1 ? targetHealth : Math.floor(targetHealth / 2);
    } else if (typeof attackerCard.attack === 'number') {
      damageNum = attackerCard.attack;
    } else if (typeof attackerCard.attack === 'string') {
      damageNum = parseInt(attackerCard.attack, 10) || 0;
    }

    // Bonus de espadas: +1 de daño en todos los ataques
    if (attackerSynergy === 'espadas' && !isHalf) damageNum += 1;
    // Bonus de escalera: +N de daño por cartas apiladas bajo la carta atacante
    damageNum += attackerCard.ladderBonus || 0;

    // Modificadores de estado sobre el objetivo (escudo y sangrado)
    const targetCard = targetSlot.card;
    let effectiveDamage = damageNum;
    if (targetCard.shield) effectiveDamage = Math.max(0, effectiveDamage - 1);
    // Bonus de bastos defensor: -1 de daño recibido a todas las cartas
    if (defenderSynergy === 'bastos') effectiveDamage = Math.max(0, effectiveDamage - 1);
    if ((targetCard.bleedTurns ?? 0) > 0) effectiveDamage += 1;

    const remainingHealth = targetHealth - effectiveDamage;

    // Actualizar tablero defensor con efectos de estado
    const setDefenderBoard = isPlayer ? setOpponentBoard : setBoard;
    const newDefenderBoard = [...defenderBoard];

    if (isAreaAttack) {
      // El as de oros y as de copas atacan a TODAS las cartas del rival en mesa
      for (let i = 0; i < 3; i++) {
        if (newDefenderBoard[i].card) {
          const tCard = newDefenderBoard[i].card!;
          let eDamage = damageNum;
          if (tCard.shield) eDamage = Math.max(0, eDamage - 1);
          if (defenderSynergy === 'bastos') eDamage = Math.max(0, eDamage - 1);
          if ((tCard.bleedTurns ?? 0) > 0) eDamage += 1;
          const rHealth = tCard.health - eDamage;

          if (rHealth <= 0) {
            // Capturar el stack ANTES de limpiar el slot para evitar stale closure
            const killedStack = newDefenderBoard[i].stack;
            setDiscardPile(prev => [...prev, ...killedStack]);
            newDefenderBoard[i] = { card: null, stack: [] };
          } else {
            let uTarget: CardData = { ...tCard, health: rHealth };
            if (tCard.shield) uTarget = { ...uTarget, shield: false };
            if ((tCard.bleedTurns ?? 0) > 0) uTarget = { ...uTarget, bleedTurns: 0 };
            if (attackerCard.effect === 'poison' || isAsDeCopas) uTarget = { ...uTarget, poisonTurns: 3 };
            newDefenderBoard[i] = { ...newDefenderBoard[i], card: uTarget };
          }
        }
      }
    } else {
      if (remainingHealth <= 0) {
        // Capturar el stack ANTES de limpiar el slot para evitar stale closure
        const killedStack = newDefenderBoard[targetSlotIndex].stack;
        setDiscardPile(prev => [...prev, ...killedStack]);
        newDefenderBoard[targetSlotIndex] = { card: null, stack: [] };
      } else {
        let updatedTarget: CardData = { ...targetCard, health: remainingHealth };
        if (targetCard.shield) updatedTarget = { ...updatedTarget, shield: false };
        if ((targetCard.bleedTurns ?? 0) > 0) updatedTarget = { ...updatedTarget, bleedTurns: 0 };
        if (attackerCard.effect === 'poison') updatedTarget = { ...updatedTarget, poisonTurns: 3 };
        if (attackerCard.effect === 'bleed')  updatedTarget = { ...updatedTarget, bleedTurns: 2 };
        newDefenderBoard[targetSlotIndex] = { ...targetSlot, card: updatedTarget };
      }

      // As de Espadas: Daño en cruz (a las cartas de los lados)
      if (isAsDeEspadas) {
        const sideIndices = [targetSlotIndex - 1, targetSlotIndex + 1];
        for (const idx of sideIndices) {
          if (idx >= 0 && idx < 3 && newDefenderBoard[idx].card) {
            const sideCard = newDefenderBoard[idx].card!;
            let eDamage = damageNum;
            if (sideCard.shield) eDamage = Math.max(0, eDamage - 1);
            if (defenderSynergy === 'bastos') eDamage = Math.max(0, eDamage - 1);
            if ((sideCard.bleedTurns ?? 0) > 0) eDamage += 1;
            const rHealth = sideCard.health - eDamage;

            if (rHealth <= 0) {
              const killedStack = newDefenderBoard[idx].stack;
              setDiscardPile(prev => [...prev, ...killedStack]);
              newDefenderBoard[idx] = { card: null, stack: [] };
            } else {
              let uTarget: CardData = { ...sideCard, health: rHealth };
              if (sideCard.shield) uTarget = { ...uTarget, shield: false };
              if ((sideCard.bleedTurns ?? 0) > 0) uTarget = { ...uTarget, bleedTurns: 0 };
              newDefenderBoard[idx] = { ...newDefenderBoard[idx], card: uTarget };
            }
          }
        }
      }
    }
    setDefenderBoard(newDefenderBoard);

    // Efecto perforante -> Daño al jugador rival (daño total - 1)
    const isPierce = attackerCard.effect === 'pierce' || attackerCard.attackType === 'PERFORAR' || isAsDeEspadas;
    if (isPierce) {
      const setDefenderHp = isPlayer ? setOpponentHp : setHp;
      setDefenderHp(prev => Math.max(0, prev - Math.max(0, damageNum - 1)));
    }

    // Descontar coste de voluntad del atacante (solo si es su primer ataque)
    if (!hasAlreadyAttackedOnce) {
      const setAttackerVoluntad = isPlayer ? setVoluntad : setOpponentVoluntad;
      setAttackerVoluntad(v => v - attackerCard.cost);

      // Habilidad de Asesino de Oros (Rank 2) -> +1 de voluntad
      if (attackerCard.rank === 2 && attackerCard.suit === 'oros') {
        setAttackerVoluntad(v => Math.min(10, v + 1));
      }
    }

    // Habilidad de Tirador de Oros (Rank 7) al eliminar -> +2 de voluntad
    if (attackerCard.rank === 7 && attackerCard.suit === 'oros' && remainingHealth <= 0) {
      const setAttackerVoluntad = isPlayer ? setVoluntad : setOpponentVoluntad;
      setAttackerVoluntad(v => Math.min(10, v + 2));
    }

    // steal_shield (o As de Bastos): la carta atacante gana escudo al asestar un golpe
    if (attackerCard.effect === 'steal_shield' || isAsDeBastos) {
      const setAttackerBoardFn = isPlayer ? setBoard : setOpponentBoard;
      setAttackerBoardFn(prev => {
        const updated = [...prev];
        const slot = updated[attackerSlotIndex];
        if (slot.card) updated[attackerSlotIndex] = { ...slot, card: { ...slot.card, shield: true } };
        return updated;
      });
    }

    // steal_will (o Pícaro de Oros): rival -1 voluntad, atacante +1 voluntad
    if (attackerCard.effect === 'steal_will' || (attackerCard.rank === 8 && attackerCard.suit === 'oros')) {
      const setAttVol = isPlayer ? setVoluntad : setOpponentVoluntad;
      const setDefVol = isPlayer ? setOpponentVoluntad : setVoluntad;
      setAttVol(v => Math.min(10, v + 1));
      setDefVol(v => Math.max(0, v - 1));
    }

    // As de Oros: roba 2 de voluntad al rival
    if (isAsDeOros) {
      const setAttVol = isPlayer ? setVoluntad : setOpponentVoluntad;
      const setDefVol = isPlayer ? setOpponentVoluntad : setVoluntad;
      setAttVol(v => Math.min(10, v + 2));
      setDefVol(v => Math.max(0, v - 2));
    }

    // Registrar la acción de ataque
    if (isMago) {
      const setMagoAttacksMap = isPlayer ? setPlayerMagoAttacks : setOpponentMagoAttacks;
      const newTargetsCount = previousTargets.length + 1;

      setMagoAttacksMap(prev => ({
        ...prev,
        [attackerSlotIndex]: [...(prev[attackerSlotIndex] || []), targetSlotIndex]
      }));

      // Si ya atacó a 2 objetivos distintos, marcar como que ya actuó
      if (newTargetsCount >= 2) {
        const setAttackerAttackedIndices = isPlayer ? setPlayerAttackedIndices : setOpponentAttackedIndices;
        setAttackerAttackedIndices(old => [...old, attackerSlotIndex]);
      }
    } else {
      // Cartas normales gastan su acción inmediatamente
      const setAttackerAttackedIndices = isPlayer ? setPlayerAttackedIndices : setOpponentAttackedIndices;
      setAttackerAttackedIndices(prev => [...prev, attackerSlotIndex]);
    }
  };

  // Lógica de ataque directo al rival
  const attackDirectly = (isPlayer: boolean, attackerSlotIndex: number) => {
    // Verificar si el atacante ya atacó en este turno
    const attackedIndices = isPlayer ? playerAttackedIndices : opponentAttackedIndices;
    if (attackedIndices.includes(attackerSlotIndex)) return;

    const attackerBoard = isPlayer ? board : opponentBoard;
    const attackerSlot = attackerBoard[attackerSlotIndex];
    if (!attackerSlot.card) return;

    const attackerSynergy = detectBoardSynergy(attackerBoard);

    const attackerCard = attackerSlot.card;

    // Si es un mago, verificar que no ataque al mismo objetivo (la cara) dos veces en el mismo turno
    const isMago = attackerCard.role.toUpperCase() === 'MAGO';
    if (isMago && hasMagoAttackedTarget(isPlayer, attackerSlotIndex, -1)) return;

    // Determinar si ya realizó su primer ataque en este turno (para Magos)
    const magoAttacksMap = isPlayer ? playerMagoAttacks : opponentMagoAttacks;
    const previousTargets = magoAttacksMap[attackerSlotIndex] || [];
    const hasAlreadyAttackedOnce = isMago && previousTargets.length > 0;

    // Restricciones de ataque directo
    if (attackerCard.attackType === 'SOPORTE') return;

    const defenderBoard = isPlayer ? opponentBoard : board;
    const hasDefenderCards = defenderBoard.some(s => s.card);

    // COLUMNA: solo puede atacar directo si su columna específica está vacía
    if (attackerCard.attackType === 'COLUMNA') {
      if (defenderBoard[attackerSlotIndex].card) return;
    } else if (isMago) {
      // Mago puede atacar al jugador solo si el rival tiene menos de 2 cartas en mesa
      const defenderCardCount = defenderBoard.filter(s => s.card).length;
      if (defenderCardCount >= 2) return;
    } else if (TARGETING_ROLES.includes(attackerCard.role.toUpperCase())) {
      if (hasDefenderCards) return;
    } else if (attackerCard.attackType !== 'DIRECTO' && hasDefenderCards) {
      return;
    }

    // Verificar voluntad suficiente para ejercer el ataque (solo si es su primer ataque)
    const currentVoluntad = isPlayer ? voluntad : opponentVoluntad;
    if (!hasAlreadyAttackedOnce && currentVoluntad < attackerCard.cost) return;

    const isHalf = attackerCard.effect === 'half' || attackerCard.attack === '1/2';
    let damageNum = 0;

    if (isHalf) {
      damageNum = 5; // Daño fijo al atacar al jugador directamente
    } else if (typeof attackerCard.attack === 'number') {
      damageNum = attackerCard.attack;
    } else if (typeof attackerCard.attack === 'string') {
      damageNum = parseInt(attackerCard.attack, 10) || 0;
    }

    // Bonus de espadas: +1 de daño al atacar directo
    if (attackerSynergy === 'espadas' && !isHalf) damageNum += 1;
    // Bonus de escalera: +N de daño por cartas apiladas bajo la carta atacante
    damageNum += attackerCard.ladderBonus || 0;

    const setDefenderHp = isPlayer ? setOpponentHp : setHp;
    setDefenderHp(prev => Math.max(0, prev - damageNum));

    // Descontar coste de voluntad del atacante (solo si es su primer ataque)
    if (!hasAlreadyAttackedOnce) {
      const setAttackerVoluntad = isPlayer ? setVoluntad : setOpponentVoluntad;
      setAttackerVoluntad(v => v - attackerCard.cost);

      // Habilidad de Asesino de Oros (Rank 2) al atacar -> +1 de voluntad
      if (attackerCard.rank === 2 && attackerCard.suit === 'oros') {
        setAttackerVoluntad(v => Math.min(10, v + 1));
      }
    }

    // steal_shield (o As de Bastos): gana escudo al golpear al jugador rival
    if (attackerCard.effect === 'steal_shield' || (attackerCard.rank === 1 && attackerCard.suit === 'bastos')) {
      const setAttackerBoardFn = isPlayer ? setBoard : setOpponentBoard;
      setAttackerBoardFn(prev => {
        const updated = [...prev];
        const slot = updated[attackerSlotIndex];
        if (slot.card) updated[attackerSlotIndex] = { ...slot, card: { ...slot.card, shield: true } };
        return updated;
      });
    }

    // steal_will (o Pícaro de Oros): rival -1 voluntad, atacante +1 voluntad al golpear directo
    if (attackerCard.effect === 'steal_will' || (attackerCard.rank === 8 && attackerCard.suit === 'oros')) {
      const setAttVol = isPlayer ? setVoluntad : setOpponentVoluntad;
      const setDefVol = isPlayer ? setOpponentVoluntad : setVoluntad;
      setAttVol(v => Math.min(10, v + 1));
      setDefVol(v => Math.max(0, v - 1));
    }

    // As de Oros al atacar directo: roba 2 de voluntad
    if (attackerCard.rank === 1 && attackerCard.suit === 'oros') {
      const setAttVol = isPlayer ? setVoluntad : setOpponentVoluntad;
      const setDefVol = isPlayer ? setOpponentVoluntad : setVoluntad;
      setAttVol(v => Math.min(10, v + 2));
      setDefVol(v => Math.max(0, v - 2));
    }

    // Registrar la acción de ataque
    if (isMago) {
      const setMagoAttacksMap = isPlayer ? setPlayerMagoAttacks : setOpponentMagoAttacks;
      const newTargetsCount = previousTargets.length + 1;

      setMagoAttacksMap(prev => ({
        ...prev,
        [attackerSlotIndex]: [...(prev[attackerSlotIndex] || []), -1]
      }));

      // Si ya atacó a 2 objetivos distintos, marcar como que ya actuó
      if (newTargetsCount >= 2) {
        const setAttackerAttackedIndices = isPlayer ? setPlayerAttackedIndices : setOpponentAttackedIndices;
        setAttackerAttackedIndices(old => [...old, attackerSlotIndex]);
      }
    } else {
      // Cartas normales gastan su acción inmediatamente
      const setAttackerAttackedIndices = isPlayer ? setPlayerAttackedIndices : setOpponentAttackedIndices;
      setAttackerAttackedIndices(prev => [...prev, attackerSlotIndex]);
    }
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

    // Verificar voluntad suficiente para ejercer la curación
    const currentVoluntad = isPlayer ? voluntad : opponentVoluntad;
    if (currentVoluntad < healerCard.cost) return;

    const healAmount = 5;
    const maxHp = targetSlot.card.maxHealth ?? getMaxHealthByRank(targetSlot.card.rank);
    const currentHp = targetSlot.card.health;
    const targetNewHp = Math.min(maxHp, currentHp + healAmount);

    const setAttackerBoard = isPlayer ? setBoard : setOpponentBoard;
    const newBoard = [...attackerBoard];
    newBoard[targetSlotIndex] = {
      ...targetSlot,
      card: { ...targetSlot.card, health: targetNewHp }
    };
    setAttackerBoard(newBoard);

    // Descontar coste de voluntad del curandero
    const setAttackerVoluntad = isPlayer ? setVoluntad : setOpponentVoluntad;
    setAttackerVoluntad(v => v - healerCard.cost);

    // Curandero de Oros: +1 de voluntad si cura por completo
    if (healerCard.suit === 'oros' && targetNewHp === maxHp && currentHp < maxHp) {
      setAttackerVoluntad(v => Math.min(10, v + 1));
    }

    const setAttackerAttackedIndices = isPlayer ? setPlayerAttackedIndices : setOpponentAttackedIndices;
    setAttackerAttackedIndices(prev => [...prev, healerSlotIndex]);
  };

  // Curación del As de Copas: +3 HP, elimina veneno y sangrado (no quita escudo)
  const healCardCopa = (targetSlotIndex: number) => {
    const targetSlot = board[targetSlotIndex];
    if (!targetSlot.card) return;
    const card = targetSlot.card;
    const maxHp = card.maxHealth ?? getMaxHealthByRank(card.rank);
    const newBoard = [...board];
    newBoard[targetSlotIndex] = {
      ...targetSlot,
      card: {
        ...card,
        health: Math.min(maxHp, card.health + 3),
        poisonTurns: 0,
        bleedTurns: 0,
      },
    };
    setBoard(newBoard);
  };

  const clerigoPassiveBonus = (slots: BoardSlot[]): number =>
    slots.reduce((sum, slot) => {
      if (slot.card && slot.card.rank === 5 && typeof slot.card.attack === 'number') {
        return sum + slot.card.attack;
      }
      return sum;
    }, 0);

  // Mover Caballo a columna contigua (gratuito, una vez por turno)
  // Si el destino tiene carta, intercambia posiciones
  const moveCaballo = (fromSlot: number, toSlot: number) => {
    const slot = board[fromSlot];
    const target = board[toSlot];
    if (!slot.card) return;
    if (Math.abs(fromSlot - toSlot) !== 1) return;

    const movedCard = slot.card;
    const movedStack = slot.stack;

    // Trasladar el registro de ataque al nuevo slot
    setPlayerAttackedIndices(prev =>
      prev.includes(fromSlot) ? [...prev.filter(i => i !== fromSlot), toSlot] : prev
    );

    const newBoard = [...board];
    // Si hay carta en el destino, intercambiar; si no, mover y dejar vacío
    newBoard[fromSlot] = target.card ? { card: target.card, stack: target.stack } : { card: null, stack: [] };
    newBoard[toSlot] = { card: movedCard, stack: movedStack };
    setBoard(newBoard);
  };

  // Finalizar turno (jugador o bot)
  const endTurn = (isPlayer: boolean) => {
    // Aplica veneno y sangrado; recoge muertes para el discard; si hasCopasBonus, purga y cura
    const applyTurnEndEffects = (
      prev: BoardSlot[],
      hasCopasBonus: boolean = false
    ): { newBoard: BoardSlot[]; deaths: CardData[] } => {
      const deaths: CardData[] = [];
      const newBoard = prev.map(slot => {
        if (!slot.card) return slot;
        let card = { ...slot.card };
        if (hasCopasBonus) {
          card = { ...card, poisonTurns: 0, bleedTurns: 0 };
        }
        if (card.poisonTurns && card.poisonTurns > 0) {
          card = { ...card, health: card.health - 1, poisonTurns: card.poisonTurns - 1 };
        }
        if (card.bleedTurns && card.bleedTurns > 0) card = { ...card, bleedTurns: card.bleedTurns - 1 };
        if (card.health <= 0) {
          deaths.push(...slot.stack);
          return { card: null, stack: [] };
        }
        if (hasCopasBonus) {
          const maxHp = card.maxHealth ?? getMaxHealthByRank(card.rank);
          card = { ...card, health: Math.min(maxHp, card.health + 1) };
        }
        return { ...slot, card };
      });
      return { newBoard, deaths };
    };

    if (isPlayer) {
      const playerSynergy = detectBoardSynergy(board);
      const opponentSynergy = detectBoardSynergy(opponentBoard);
      const bonus = clerigoPassiveBonus(board);
      const oroBonus = playerSynergy === 'oros' ? 1 : 0;
      setVoluntad(v => Math.min(v + 2 + bonus + oroBonus, 10));
      setPlayerAttackedIndices([]);
      setPlayerMagoAttacks({});
      setPlayerHasDiscarded(false);
      setIsPlayerTurn(false);
      const { newBoard: newOppBoard, deaths: oppDeaths } = applyTurnEndEffects(opponentBoard, opponentSynergy === 'copas');
      setOpponentBoard(newOppBoard);
      if (oppDeaths.length > 0) setDiscardPile(prev => [...prev, ...oppDeaths]);
    } else {
      const opponentSynergy = detectBoardSynergy(opponentBoard);
      const playerSynergy = detectBoardSynergy(board);
      const bonus = clerigoPassiveBonus(opponentBoard);
      const oroBonus = opponentSynergy === 'oros' ? 1 : 0;
      setOpponentVoluntad(v => Math.min(v + 2 + bonus + oroBonus, 10));
      setOpponentAttackedIndices([]);
      setOpponentMagoAttacks({});
      setOpponentHasDiscarded(false);
      setIsPlayerTurn(true);
      const { newBoard: newPlayerBoard, deaths: playerDeaths } = applyTurnEndEffects(board, playerSynergy === 'copas');
      setBoard(newPlayerBoard);
      if (playerDeaths.length > 0) setDiscardPile(prev => [...prev, ...playerDeaths]);
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
    opponentAttackedIndices,
    playerMagoAttacks,
    opponentMagoAttacks,
    hasMagoAttackedTarget,
    playerHasDiscarded,
    opponentHasDiscarded,
    discardCard,
    discardPile,
    reshuffleCount,
    joker1Swap,
    joker3Resurrect,
    joker2Swap,
    moveCaballo,
    healCardCopa,
  };
};
