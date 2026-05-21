import { useState, useEffect } from 'react';
import { type CardData, allCards } from '../../../utils/cardData';
import { fetchShuffledDeck } from '../../../services/cardService';

const TARGETING_ROLES = ['ASESINO', 'TANQUE', 'TIRADOR', 'PICARO', 'MAGO', 'SOTA'];

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

  // Descarte (máximo 1 por ronda, coste 0)
  const [playerHasDiscarded, setPlayerHasDiscarded] = useState(false);
  const [discardPile, setDiscardPile] = useState<CardData[]>([]);

  // Inicializar mazo
  const initializeGame = async () => {
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

      if (!board[slotIndex].card) {
        const newBoard = [...board];
        newBoard[slotIndex] = { card, stack: [card] };
        setBoard(newBoard);
        setHand(prev => prev.filter((_, i) => i !== handCardIndex));
        applyStartDmg(card, slotIndex, true);
      }
    } else {
      const card = opponentHand[handCardIndex];
      if (card.suit === 'jokers') return;

      if (!opponentBoard[slotIndex].card) {
        const newBoard = [...opponentBoard];
        newBoard[slotIndex] = { card, stack: [card] };
        setOpponentBoard(newBoard);
        setOpponentHand(prev => prev.filter((_, i) => i !== handCardIndex));
        applyStartDmg(card, slotIndex, false);
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

  // Descartar una carta de la mano (solo jugador, máx 1 por ronda, coste 0)
  const discardCard = (isPlayer: boolean, handCardIndex: number) => {
    if (!isPlayer) return;
    if (playerHasDiscarded) return;
    const card = hand[handCardIndex];
    if (!card) return;
    setHand(prev => prev.filter((_, i) => i !== handCardIndex));
    setDiscardPile(prev => [...prev, card]);
    setPlayerHasDiscarded(true);
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

    // Modificadores de estado sobre el objetivo (escudo y sangrado)
    const targetCard = targetSlot.card;
    let effectiveDamage = damageNum;
    if (targetCard.shield) effectiveDamage = Math.max(0, effectiveDamage - 1);
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
          if ((tCard.bleedTurns ?? 0) > 0) eDamage += 1;
          const rHealth = tCard.health - eDamage;

          if (rHealth <= 0) {
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
            if ((sideCard.bleedTurns ?? 0) > 0) eDamage += 1;
            const rHealth = sideCard.health - eDamage;

            if (rHealth <= 0) {
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

  const clerigoPassiveBonus = (slots: BoardSlot[]): number =>
    slots.reduce((sum, slot) => {
      if (slot.card && slot.card.rank === 5 && typeof slot.card.attack === 'number') {
        return sum + slot.card.attack;
      }
      return sum;
    }, 0);

  // Finalizar turno (jugador o bot)
  const endTurn = (isPlayer: boolean) => {
    // Aplica veneno (1 dmg/turno) y elimina sangrado en el tablero indicado
    const applyTurnEndEffects = (prev: BoardSlot[]): BoardSlot[] =>
      prev.map(slot => {
        if (!slot.card) return slot;
        let card = { ...slot.card };
        if (card.poisonTurns && card.poisonTurns > 0) {
          card = { ...card, health: card.health - 1, poisonTurns: card.poisonTurns - 1 };
        }
        if (card.bleedTurns && card.bleedTurns > 0) card = { ...card, bleedTurns: card.bleedTurns - 1 };
        if (card.health <= 0) return { card: null, stack: [] };
        return { ...slot, card };
      });

    if (isPlayer) {
      const bonus = clerigoPassiveBonus(board);
      setVoluntad(v => Math.min(v + 2 + bonus, 10));
      setPlayerAttackedIndices([]);
      setPlayerMagoAttacks({});
      setPlayerHasDiscarded(false);
      setIsPlayerTurn(false);
      setOpponentBoard(applyTurnEndEffects);
    } else {
      const bonus = clerigoPassiveBonus(opponentBoard);
      setOpponentVoluntad(v => Math.min(v + 2 + bonus, 10));
      setOpponentAttackedIndices([]);
      setOpponentMagoAttacks({});
      setIsPlayerTurn(true);
      setBoard(applyTurnEndEffects);
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
    discardCard,
    discardPile
  };
};
