import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Swords, ArrowLeft, MessageSquare, ScrollText, Menu, Settings } from 'lucide-react';
import backCardImage from '../../assets/images/backCard.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { type CardData } from '../../utils/cardData';
import { useGameState, type BoardSlot } from './hooks/useGameState';
import { useBotAI } from './hooks/useBotAI';
import { useSuitSynergy } from './hooks/useSuitSynergy';
import AtmosphereParticles from '../../components/AtmosphereParticles';
import { updateMatchStats } from '../../services/userService';
import { GameOverOverlay } from './components/GameOverOverlay';
import { useChat } from './hooks/useChat';
import { ChatOverlay } from './components/ChatOverlay';
import { CombatLogOverlay } from './components/CombatLogOverlay';
import { AttackAnimationOverlay } from './components/AttackAnimationOverlay';
import { JokerAnimationOverlay } from './components/JokerAnimationOverlay';

import { useSettings, MUSIC_KEYS, SFX_KEYS } from '../../contexts/SettingsContext';
import { playCardSfx } from '../../utils/cardAudioMap';
import { playSfxWithFallback } from '../../utils/audioFallback';
import SettingsModal from '../../components/Modal/SettingsModal';

const MAX_HP = 30;

/**
 * Colores representativos para cada palo
 */
const suitColors = {
  espadas: '#ff4d4d',
  copas: '#00ccff',
  oros: '#ffcc00',
  bastos: '#00ff66',
  jokers: '#a855f7',
};

interface GameProps {
  user: { name: string; isGuest: boolean };
}

const Game: React.FC<GameProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const difficulty = location.state?.difficulty || 'hard'; // Por defecto hard para compatibilidad
  const { playMusic, stopMusic, settings } = useSettings();

  // Custom Hooks para estado y bot
  const gameState = useGameState();
  const {
    combatLogs,
    addLog,
    voluntad,
    hp,
    hand,
    board,
    opponentHp,
    opponentVoluntad,
    opponentHand,
    opponentBoard,
    deck,
    isPlayerTurn,
    isLoading,
    initializeGame,
    drawCard,
    playCard,
    activateJoker,
    endTurn,
    playerMagoAttacks,
    hasMagoAttackedTarget,
    playerHasDiscarded,
    discardCard,
    discardPile,
    reshuffleCount,
    joker1Swap,
    joker3Resurrect,
    joker2Swap,
    moveCaballo,
    healCardCopa,
  } = gameState;


  const { playerSynergy, opponentSynergy, getBonusForSynergy } = useSuitSynergy({
    playerBoard: board,
    opponentBoard,
  });

  useEffect(() => {
    if (playerSynergy.isActive && playerSynergy.suit) {
      const bonus = getBonusForSynergy(playerSynergy);
      if (bonus) {
        addLog(`¡Sinergia de ${playerSynergy.suit}! ${bonus.description}`, 'synergy');
      }
    }
  }, [playerSynergy.isActive, playerSynergy.suit]);

  const prevLoadingRef = useRef(true);

  // Reproducir música y sonido de espadas cuando la carga termina
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      // Loading acaba de terminar → iniciar música y sonido de espadas
      playMusic(MUSIC_KEYS.BATTLE.local);
      playSfxWithFallback(
        SFX_KEYS.SWORD_CLASH.cloudinary,
        SFX_KEYS.SWORD_CLASH.local,
        settings.sfxVolume ?? 0.5
      ).catch(() => {});
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, playMusic, settings.sfxVolume]);

  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, [stopMusic]);

  useEffect(() => {
    if (opponentSynergy.isActive && opponentSynergy.suit) {
      const bonus = getBonusForSynergy(opponentSynergy);
      if (bonus) {
        addLog(`El rival ha activado la Sinergia de ${opponentSynergy.suit}!`, 'synergy');
      }
    }
  }, [opponentSynergy.isActive, opponentSynergy.suit]);



  // Gestión de selección local de la UI
  const [selectedHandCardIndex, setSelectedHandCardIndex] = useState<number | null>(null);
  const [selectedAttackerIndex, setSelectedAttackerIndex] = useState<number | null>(null);
  const [viewingCard, setViewingCard] = useState<CardData | null>(null);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const toggleLog = () => setIsLogVisible(v => !v);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [warningText, setWarningText] = useState<string | null>(null);
  const [draggingHandIndex, setDraggingHandIndex] = useState<number | null>(null);
  const [isDragOverDiscard, setIsDragOverDiscard] = useState(false);
  const [gameOver, setGameOver] = useState<'victory' | 'defeat' | null>(null);
  const [isDishonorable, setIsDishonorable] = useState(false);
  const statsUpdated = useRef(false);

  // Estado del popup del As de Copas
  const [copaPopupSlot, setCopaPopupSlot] = useState<number | null>(null);
  const [copaHealSourceSlot, setCopaHealSourceSlot] = useState<number | null>(null);
  const [copaActedIds, setCopaActedIds] = useState<string[]>([]);

  // Estado del popup y movimiento del Caballo
  const [caballoPopupSlot, setCaballoPopupSlot] = useState<number | null>(null);
  const [caballoMoveSourceSlot, setCaballoMoveSourceSlot] = useState<number | null>(null);
  // IDs de Caballos que ya se movieron este turno (se resetea en handleEndTurn)
  const [caballoMovedIds, setCaballoMovedIds] = useState<string[]>([]);

  // Estado de animación y flujo de Jokers 2 y 3
  const [jokerAnim, setJokerAnim] = useState<{ card: CardData; rank: number } | null>(null);
  // joker2Phase: 'board' = esperando que el jugador elija slot del tablero;
  //              'hand'  = esperando que elija carta de la mano para intercambiar
  const [joker2Phase, setJoker2Phase] = useState<'board' | 'hand' | null>(null);
  const [joker2BoardSlot, setJoker2BoardSlot] = useState<number | null>(null);

  // joker1Phase: 'player' = eligiendo 2 cartas propias; 'opponent' = eligiendo 2 del rival
  const [joker1Phase, setJoker1Phase] = useState<'player' | 'opponent' | null>(null);
  const [joker1PlayerSelections, setJoker1PlayerSelections] = useState<number[]>([]);
  const [joker1OpponentSelections, setJoker1OpponentSelections] = useState<number[]>([]);

  // --- Sistema de Animaciones de Combate (PhaserJS) ---
  interface AttackAnimState {
    attackerCard: CardData;
    targetCard?: CardData | null;
    isDirect: boolean;
    isHeal: boolean;
    isPlayerAttacker: boolean;
    attackerSlotIndex: number;
    targetSlotIndex?: number;
    onComplete: () => void;
  }

  const [activeAttackAnim, setActiveAttackAnim] = useState<AttackAnimState | null>(null);

  const playAttackAnimation = (
    isPlayer: boolean,
    attackerSlotIndex: number,
    targetSlotIndex: number | undefined,
    isDirect: boolean,
    isHeal: boolean,
    executeAction: () => void
  ) => {
    const attackerBoard = isPlayer ? board : opponentBoard;
    const defenderBoard = isPlayer ? opponentBoard : board;
    const attackerCard = attackerBoard[attackerSlotIndex]?.card;

    if (!attackerCard) {
      executeAction();
      return;
    }

    let targetCard: CardData | null = null;
    if (!isDirect && targetSlotIndex !== undefined) {
      targetCard = (isHeal ? attackerBoard : defenderBoard)[targetSlotIndex]?.card || null;
    }

    setActiveAttackAnim({
      attackerCard,
      targetCard,
      isDirect,
      isHeal,
      isPlayerAttacker: isPlayer,
      attackerSlotIndex,
      targetSlotIndex,
      onComplete: () => {
        setActiveAttackAnim(null);
        executeAction();
      }
    });
  };

  const wrappedAttackCard = (isPlayer: boolean, attackerSlotIndex: number, targetSlotIndex: number) => {
    playAttackAnimation(isPlayer, attackerSlotIndex, targetSlotIndex, false, false, () => {
      gameState.attackCard(isPlayer, attackerSlotIndex, targetSlotIndex);
    });
  };

  const wrappedAttackDirectly = (isPlayer: boolean, attackerSlotIndex: number) => {
    playAttackAnimation(isPlayer, attackerSlotIndex, undefined, true, false, () => {
      gameState.attackDirectly(isPlayer, attackerSlotIndex);
    });
  };

  const wrappedHealCard = (isPlayer: boolean, healerSlotIndex: number, targetSlotIndex: number) => {
    playAttackAnimation(isPlayer, healerSlotIndex, targetSlotIndex, false, true, () => {
      gameState.healCard(isPlayer, healerSlotIndex, targetSlotIndex);
    });
  };

  useBotAI({
    difficulty,
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
    attackCard: wrappedAttackCard,
    attackDirectly: wrappedAttackDirectly,
    healCard: wrappedHealCard,
    activateJoker: gameState.activateJoker,
    playCard: gameState.playCard,
    drawCard: gameState.drawCard,
    discardCard: gameState.discardCard,
    opponentHasDiscarded: gameState.opponentHasDiscarded,
    opponentAttackedIndices: gameState.opponentAttackedIndices,
    opponentMagoAttacks: gameState.opponentMagoAttacks
  });
  const { messages, visible, input, setInput, sendMessage, toggleChat } = useChat();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const active = document.activeElement as HTMLElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          return;
        }
        toggleChat();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggleChat]);

  useEffect(() => {
    if (voluntad < 5) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 400);
      return () => clearTimeout(timer);
    }
  }, [voluntad]);

  useEffect(() => {
    if (!warningText) return;
    const timer = setTimeout(() => setWarningText(null), 2000);
    return () => clearTimeout(timer);
  }, [warningText]);

  useEffect(() => {
    if (reshuffleCount === 0) return;
    setWarningText('¡Mazo agotado! Los descartes se han rebarajado — ambos jugadores reciben 5 de daño');
  }, [reshuffleCount]);

  useEffect(() => {
    if (isLoading || statsUpdated.current) return;
    if (hp <= 0) {
      statsUpdated.current = true;
      setGameOver('defeat');
      if (!user.isGuest) updateMatchStats(user.name, 'lose');
    } else if (opponentHp <= 0) {
      statsUpdated.current = true;
      setGameOver('victory');
      if (!user.isGuest) updateMatchStats(user.name, 'win');
    }
  }, [hp, opponentHp, isLoading]);

  // Manejadores específicos de la UI del jugador
  const handleDrawCard = () => {
    if (voluntad < 1) {
      setWarningText('Voluntad insuficiente para robar carta');
      return;
    }
    if (hand.length >= 5) {
      setWarningText('La mano está llena');
      return;
    }
    drawCard(true);
  };

  const handlePlayCard = (slotIndex: number) => {
    if (selectedHandCardIndex === null) return;
    const card = hand[selectedHandCardIndex];
    // Reproducir el sonido específico de la carta según su palo y rango
    if (card && card.suit !== 'jokers') {
      playCardSfx(card, 0.3);
    }
    playCard(true, slotIndex, selectedHandCardIndex);
    setSelectedHandCardIndex(null);
  };

  const handlePlayerSlotClick = (slotIndex: number) => {
    const slot = board[slotIndex];

    // ── Fase de curación del As de Copas ──
    if (copaHealSourceSlot !== null) {
      if (slot.card) {
        healCardCopa(slotIndex);
      }
      setCopaHealSourceSlot(null);
      return;
    }

    // ── Fase de movimiento del Caballo ──
    if (caballoMoveSourceSlot !== null) {
      if (Math.abs(slotIndex - caballoMoveSourceSlot) === 1) {
        const movingCard = board[caballoMoveSourceSlot]?.card;
        if (movingCard) setCaballoMovedIds(prev => [...prev, movingCard.id]);
        moveCaballo(caballoMoveSourceSlot, slotIndex);
      }
      setCaballoMoveSourceSlot(null);
      return;
    }

    // ── Joker 2: fase de selección de slot del tablero ──
    if (joker2Phase === 'board') {
      if (!slot.card) {
        setWarningText('No hay carta en ese slot');
        return;
      }
      if (slot.stack.length > 1) {
        setWarningText('No se puede intercambiar una carta en escalera');
        return;
      }
      setJoker2BoardSlot(slotIndex);
      setJoker2Phase('hand');
      return;
    }

    // ── Joker 2: fase de selección de carta de la mano (clic en tablero → deseleccionar slot) ──
    if (joker2Phase === 'hand') {
      if (slotIndex === joker2BoardSlot) {
        // Click en el mismo slot = volver a la fase de selección
        setJoker2Phase('board');
        setJoker2BoardSlot(null);
      }
      return;
    }

    // Escalera: carta seleccionada puede apilarse sobre la carta del slot
    if (selectedHandCardIndex !== null && !selectedIsJoker && slot.card) {
      const selectedCard = hand[selectedHandCardIndex];
      if (selectedCard && selectedCard.rank === slot.card.rank + 1 && slot.card.rank < 12) {
        handlePlayCard(slotIndex);
        return;
      }
    }

    if (!slot.card) {
      if (selectedHandCardIndex !== null) {
        handlePlayCard(slotIndex);
      }
    } else {
      // Si hay un atacante/curandero seleccionado, y hacemos clic en otro de nuestros slots...
      if (selectedAttackerIndex !== null && slot.card) {
        if (attackerCard?.role === 'CURANDERO' && selectedAttackerIndex !== slotIndex) {
          // Es un curandero y hacemos clic en una carta aliada -> ¡CURAR!
          if (voluntad < attackerCard.cost) {
            setWarningText('Voluntad insuficiente');
            return;
          }
          wrappedHealCard(true, selectedAttackerIndex, slotIndex);
          setSelectedAttackerIndex(null);
          return;
        }
      }

      if (!isPlayerTurn) return;

      // As de Copas: mostrar popup atacar/curar
      if (slot.card && slot.card.rank === 1 && slot.card.suit === 'copas') {
        setCopaPopupSlot(prev => prev === slotIndex ? null : slotIndex);
        setSelectedAttackerIndex(null);
        setSelectedHandCardIndex(null);
        return;
      }

      // Caballo: mostrar popup de acción en vez de seleccionar directamente
      if (slot.card && slot.card.role.toUpperCase() === 'CABALLO') {
        setCaballoPopupSlot(prev => prev === slotIndex ? null : slotIndex);
        setSelectedAttackerIndex(null);
        setSelectedHandCardIndex(null);
        return;
      }

      if (gameState.playerAttackedIndices.includes(slotIndex)) return; // ya atacó
      setSelectedAttackerIndex(prev => prev === slotIndex ? null : slotIndex);
      setSelectedHandCardIndex(null);
    }
  };

  const handleOpponentSlotClick = (slotIndex: number) => {
    const slot = opponentBoard[slotIndex];
    if (selectedAttackerIndex !== null && slot.card) {
      if (isOpponentSlotActiveToAttack(slotIndex)) {
        const isMago = attackerCard?.role.toUpperCase() === 'MAGO';
        const magoAttacksCount = (playerMagoAttacks[selectedAttackerIndex] || []).length;

        wrappedAttackCard(true, selectedAttackerIndex, slotIndex);

        // Deseleccionar al atacante si no es un Mago, o si ya ha realizado su segundo ataque
        if (!isMago || magoAttacksCount >= 1) {
          setSelectedAttackerIndex(null);
        }
      } else if (attackerCard && voluntad < attackerCard.cost) {
        const isMago = attackerCard.role.toUpperCase() === 'MAGO';
        const hasAlreadyAttackedOnce = isMago && (playerMagoAttacks[selectedAttackerIndex] || []).length > 0;
        if (!hasAlreadyAttackedOnce) {
          setWarningText('Voluntad insuficiente');
        }
      }
    } else {
      if (slot.card) {
        setViewingCard(slot.card);
      }
    }
  };

  const handleRestart = () => {
    setSelectedHandCardIndex(null);
    setSelectedAttackerIndex(null);
    setViewingCard(null);
    setGameOver(null);
    setIsDishonorable(false);
    statsUpdated.current = false;
    setJokerAnim(null);
    // Reiniciar música de batalla
    playMusic(MUSIC_KEYS.BATTLE.local);
    setJoker2Phase(null);
    setJoker2BoardSlot(null);
    setJoker1Phase(null);
    setJoker1PlayerSelections([]);
    setJoker1OpponentSelections([]);
    setCaballoPopupSlot(null);
    setCaballoMoveSourceSlot(null);
    setCaballoMovedIds([]);
    setCopaPopupSlot(null);
    setCopaHealSourceSlot(null);
    setCopaActedIds([]);
    initializeGame();
  };

  const handleAttackDirectly = () => {
    if (selectedAttackerIndex === null) return;

    const isMago = attackerCard?.role.toUpperCase() === 'MAGO';
    const magoAttacksCount = (playerMagoAttacks[selectedAttackerIndex] || []).length;
    const hasAlreadyAttackedOnce = isMago && magoAttacksCount > 0;

    // El segundo ataque del Mago es gratuito (no requiere voluntad)
    if (!hasAlreadyAttackedOnce && attackerCard && voluntad < attackerCard.cost) {
      setWarningText('Voluntad insuficiente');
      return;
    }

    // Si el Mago ya atacó al jugador esta ronda, ignorar el clic sin deseleccionar
    if (isMago && hasMagoAttackedTarget(true, selectedAttackerIndex, -1)) return;

    // Si el Mago ya atacó una carta y el rival tiene 2+ cartas, debe atacar cartas (no al jugador)
    if (isMago && hasAlreadyAttackedOnce && opponentBoard.filter(s => s.card).length >= 2) {
      setWarningText('El Mago debe atacar a 2 cartas');
      return;
    }

    wrappedAttackDirectly(true, selectedAttackerIndex);

    // Deseleccionar al atacante si no es un Mago, o si ya ha realizado su segundo ataque
    if (!isMago || magoAttacksCount >= 1) {
      setSelectedAttackerIndex(null);
    }
  };

  const handleUseJoker = () => {
    if (selectedHandCardIndex === null) return;
    const card = hand[selectedHandCardIndex];
    if (!card || card.suit !== 'jokers') return;

    if (card.rank === 1) {
      if (hand.length - 1 < 2) {
        setWarningText('Necesitas al menos 2 cartas en la mano para intercambiar');
        return;
      }
      if (opponentHand.length < 2) {
        setWarningText('El rival necesita al menos 2 cartas para intercambiar');
        return;
      }
    }

    if (card.rank === 1 || card.rank === 2 || card.rank === 3) {
      setJokerAnim({ card, rank: card.rank });
      activateJoker(true, selectedHandCardIndex);
      setSelectedHandCardIndex(null);
    } else {
      activateJoker(true, selectedHandCardIndex);
      setSelectedHandCardIndex(null);
    }
  };

  // Llamado cuando termina la animación de Phaser del joker
  const handleJokerAnimComplete = () => {
    const rank = jokerAnim?.rank ?? null;
    setJokerAnim(null);
    if (rank === 3) {
      const success = joker3Resurrect();
      if (!success) setWarningText('Pila de descartes vacía — Joker usado en vano');
    } else if (rank === 2) {
      setJoker2Phase('board');
    } else if (rank === 1) {
      setJoker1Phase('player');
      setJoker1PlayerSelections([]);
      setJoker1OpponentSelections([]);
    }
  };

  // Cancela la selección del Joker 2 (sin intercambio o devolviendo la carta ya seleccionada)
  const handleJoker2Cancel = () => {
    if (joker2Phase === 'hand' && joker2BoardSlot !== null) {
      // Ya habíamos seleccionado un slot → devolver esa carta a la mano sin intercambio
      joker2Swap(joker2BoardSlot);
    }
    setJoker2Phase(null);
    setJoker2BoardSlot(null);
  };

  const handleDiscard = () => {
    if (selectedHandCardIndex === null || playerHasDiscarded) return;
    discardCard(true, selectedHandCardIndex);
    setSelectedHandCardIndex(null);
  };

  const handleDiscardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDiscard(false);
    if (draggingHandIndex === null || playerHasDiscarded) return;
    discardCard(true, draggingHandIndex);
    setDraggingHandIndex(null);
    setSelectedHandCardIndex(null);
  };

  const handleEndTurn = () => {
    endTurn(true);
    setSelectedHandCardIndex(null);
    setSelectedAttackerIndex(null);
    setJoker2Phase(null);
    setJoker2BoardSlot(null);
    setJoker1Phase(null);
    setJoker1PlayerSelections([]);
    setJoker1OpponentSelections([]);
    setCaballoPopupSlot(null);
    setCaballoMoveSourceSlot(null);
    setCaballoMovedIds([]);
    setCopaPopupSlot(null);
    setCopaHealSourceSlot(null);
    setCopaActedIds([]);
  };

  const handleOpponentHandCardClick = (i: number) => {
    if (joker1Phase !== 'opponent') return;
    if (joker1OpponentSelections.includes(i)) {
      setJoker1OpponentSelections(prev => prev.filter(idx => idx !== i));
      return;
    }
    if (joker1OpponentSelections.length >= 2) return;
    const newSel = [...joker1OpponentSelections, i];
    setJoker1OpponentSelections(newSel);
    if (newSel.length === 2) {
      joker1Swap(joker1PlayerSelections, newSel);
      setJoker1Phase(null);
      setJoker1PlayerSelections([]);
      setJoker1OpponentSelections([]);
    }
  };

  const handleJoker1Cancel = () => {
    setJoker1Phase(null);
    setJoker1PlayerSelections([]);
    setJoker1OpponentSelections([]);
  };

  // Clic en carta de la mano — distingue si estamos en modo Joker 2 (intercambio)
  const handleHandCardClick = (i: number) => {
    // Joker 1: selección de cartas propias
    if (joker1Phase === 'player') {
      if (joker1PlayerSelections.includes(i)) {
        setJoker1PlayerSelections(prev => prev.filter(idx => idx !== i));
      } else if (joker1PlayerSelections.length < 2) {
        const newSel = [...joker1PlayerSelections, i];
        setJoker1PlayerSelections(newSel);
        if (newSel.length === 2) setJoker1Phase('opponent');
      }
      return;
    }

    if (joker2Phase === 'hand' && joker2BoardSlot !== null) {
      const card = hand[i];
      if (card.suit === 'jokers') {
        setWarningText('No puedes intercambiar un Joker');
        return;
      }
      const result = joker2Swap(joker2BoardSlot, i);
      if (result === 'ladder') {
        setWarningText('No se puede intercambiar una carta en escalera');
        return;
      }
      setJoker2Phase(null);
      setJoker2BoardSlot(null);
      return;
    }
    setSelectedHandCardIndex(selectedHandCardIndex === i ? null : i);
  };

  const selectedHandCard = selectedHandCardIndex !== null ? hand[selectedHandCardIndex] : null;
  const selectedIsJoker = selectedHandCard !== null && selectedHandCard.suit === 'jokers';
  const canAffordSelected = selectedHandCard !== null;

  const isActiveToStackLadder = (slotIndex: number): boolean => {
    if (selectedHandCardIndex === null || selectedIsJoker) return false;
    const card = hand[selectedHandCardIndex];
    const slot = board[slotIndex];
    if (!slot.card || slot.card.rank >= 12) return false;
    return card.rank === slot.card.rank + 1;
  };

  const attackerCard = selectedAttackerIndex !== null ? board[selectedAttackerIndex]?.card : null;

  const isOpponentSlotActiveToAttack = (slotIndex: number) => {
    if (selectedAttackerIndex === null || !attackerCard) return false;

    const isMago = attackerCard.role.toUpperCase() === 'MAGO';
    const hasAlreadyAttackedOnce = isMago && (playerMagoAttacks[selectedAttackerIndex] || []).length > 0;

    // Solo verificar costo si no es el segundo ataque de un mago
    if (!hasAlreadyAttackedOnce && voluntad < attackerCard.cost) return false;

    // Si el atacante es un mago, verificar que no haya atacado a este mismo objetivo en este turno
    if (isMago) {
      if (hasMagoAttackedTarget(true, selectedAttackerIndex, slotIndex)) return false;
    }

    const isAs = attackerCard.rank === 1;
    const TARGETING_ROLES = ['ASESINO', 'TANQUE', 'TIRADOR', 'PICARO', 'MAGO', 'SOTA'];
    if (!TARGETING_ROLES.includes(attackerCard.role.toUpperCase()) && !isAs) {
      // Si no es un rol de target y no es un AS, solo puede pegar a su propia columna vertical
      if (selectedAttackerIndex !== slotIndex) return false;
    }

    // Restricciones:
    if (attackerCard.attackType === 'SOPORTE') return false; // Soporte no ataca cartas
    if (attackerCard.attackType === 'DIRECTO') return false; // Reyes no atacan cartas
    if (attackerCard.attackType === 'COLUMNA' && selectedAttackerIndex !== slotIndex) return false; // Restricción de columna vertical
    return true;
  };

  const canAttackDirectly = () => {
    if (selectedAttackerIndex === null || !attackerCard) return false;
    if (attackerCard.attackType === 'SOPORTE') return false;

    const isMago = attackerCard.role.toUpperCase() === 'MAGO';
    const hasAlreadyAttackedOnce = isMago && (playerMagoAttacks[selectedAttackerIndex] || []).length > 0;

    if (!hasAlreadyAttackedOnce && voluntad < attackerCard.cost) return false;

    if (isMago) {
      if (hasMagoAttackedTarget(true, selectedAttackerIndex, -1)) return false;
      // Mago solo puede atacar directo si el rival tiene menos de 2 cartas
      return opponentBoard.filter(s => s.card).length < 2;
    }

    const TARGETING_ROLES = ['ASESINO', 'TANQUE', 'TIRADOR', 'PICARO', 'SOTA'];
    const hasOpponentCards = opponentBoard.some(s => s.card);

    if (TARGETING_ROLES.includes(attackerCard.role.toUpperCase())) {
      if (hasOpponentCards) return false;
    }

    if (attackerCard.attackType === 'COLUMNA') {
      return !opponentBoard[selectedAttackerIndex].card;
    }

    if (attackerCard.attackType === 'DIRECTO') return true;

    return !hasOpponentCards;
  };

  const isAlliedSlotActiveToHeal = (slotIndex: number) => {
    if (selectedAttackerIndex === null || !attackerCard) return false;
    if (attackerCard.role !== 'CURANDERO') return false;
    if (voluntad < attackerCard.cost) return false; // Voluntad insuficiente para curar
    const slot = board[slotIndex];
    return selectedAttackerIndex !== slotIndex && slot.card !== null;
  };

  return (
    <motion.div
      animate={isShaking ? { x: [-2, 2, -2, 2, 0], y: [-1, 1, -1, 1, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="h-screen w-full bg-bg-main text-text-main overflow-hidden font-spectral flex flex-col relative"
    >
      {/* Fondo con atmósfera */}
      <AtmosphereParticles />
      <div className="absolute inset-0 bg-menu-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />

      {/* HEADER */}
      <header className="relative z-20 p-1 md:p-2 lg:p-3 flex flex-col sm:flex-row justify-between items-center gap-1 md:gap-3 border-b border-white/5 bg-black/40 backdrop-blur-md shrink-0">

        {/* Pantalla de Carga del Duelo */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-20 h-20 border-t-2 border-primary-gold rounded-full"
              />
              <h2 className="text-primary-gold font-cinzel tracking-[0.3em] uppercase text-xl animate-pulse">Preparando Mazo...</h2>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-between w-full sm:w-auto items-center px-2">
          <button
            onClick={() => setShowSurrenderModal(true)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
          >
            <ArrowLeft size={12} className="md:w-3.5 md:h-3.5" />
            <span className="uppercase tracking-widest text-[7px] md:text-[9px]">Rendirse</span>
          </button>
          <div className="text-lg font-black text-gold-gradient tracking-widest uppercase sm:hidden">REGNUM</div>


        </div>

        <div className="flex justify-around items-center w-full max-w-2xl gap-4 md:gap-12">
          <div
            id="opponent-face"
            onClick={selectedAttackerIndex !== null ? handleAttackDirectly : undefined}
            className={`flex flex-col items-center flex-1 transition-all duration-300 ${canAttackDirectly() ? 'cursor-crosshair scale-105 border border-red-500/40 p-1 bg-red-950/20 rounded shadow-[0_0_15px_rgba(220,38,38,0.2)] animate-pulse' : ''}`}
          >
            <span className="text-[7px] md:text-[9px] text-red-500/80 uppercase tracking-[0.2em] mb-0.5">La Sombra {!isPlayerTurn && '(Pensando...)'} {selectedAttackerIndex !== null && '🎯 ATACAR'}</span>
            <div className="flex items-center gap-1.5 w-full max-w-[120px] md:max-w-[220px]">
              <div className="flex-1 h-1.5 bg-red-950/30 rounded-full border border-red-900/20 relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-red-600 shadow-[0_0_8px_red]" animate={{ width: `${(opponentHp / MAX_HP) * 100}%` }} />
              </div>
              <span className="text-[7px] md:text-[9px] font-bold text-red-400 whitespace-nowrap">{opponentHp}/{MAX_HP} PV</span>
            </div>
            {/* Opcional: mostrar voluntad del oponente (útil para debug o gameplay) */}
            <span className="text-[6px] md:text-[8px] text-red-400 mt-1">Voluntad: {opponentVoluntad} / Mano: {opponentHand.length}</span>
          </div>
          <div className="text-xl font-black text-gold-gradient tracking-widest uppercase hidden md:block">REGNUM HOLLOW</div>
          <div id="player-face" className="flex flex-col items-center flex-1">
            <span className={`text-[7px] md:text-[9px] ${isPlayerTurn ? 'text-blue-400' : 'text-blue-400/50'} uppercase tracking-[0.2em] mb-0.5`}>
              {user.name || 'Jugador'} {isPlayerTurn && '(Tu Turno)'}
            </span>
            <div className="flex items-center gap-1.5 w-full max-w-[120px] md:max-w-[220px]">
              <div className="flex-1 h-1.5 bg-blue-950/30 rounded-full border border-blue-900/20 relative overflow-hidden">
                <motion.div className="absolute inset-0 bg-blue-500 shadow-[0_0_8px_blue]" animate={{ width: `${(hp / MAX_HP) * 100}%` }} />
              </div>
              <span className="text-[7px] md:text-[9px] font-bold text-blue-400 whitespace-nowrap">{hp}/{MAX_HP} PV</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 px-2">
          <div className="flex flex-col items-end">
            <span className="text-[6px] md:text-[8px] text-primary-gold uppercase tracking-widest leading-none">V</span>
            <span className="text-sm md:text-lg font-black text-white leading-none">{voluntad}</span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-0.5 md:w-1 h-2.5 md:h-4 rounded-full transition-all duration-500 ${i < voluntad ? 'bg-primary-gold shadow-[0_0_6px_rgba(166,138,100,0.6)]' : 'bg-white/5'
                  }`}
              />
            ))}
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 md:p-1.5 border border-accent-gray bg-panel/50 text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all duration-300 rounded-sm group shadow-[0_0_10px_rgba(0,0,0,0.4)]"
            title="Ajustes"
          >
            <Settings size={12} className="md:w-3.5 md:h-3.5 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
      </header>

      {/* TABLERO */}
      <main className="flex-1 relative z-10 flex flex-col justify-center items-center gap-2 md:gap-4 p-2 md:p-4 overflow-visible">

        {/* Mano del rival boca abajo — asoma desde la parte superior */}
        <div className="absolute top-0 left-0 right-0 flex justify-center gap-1 md:gap-2 pointer-events-none" style={{ zIndex: 5 }}>
          <AnimatePresence mode="popLayout">
            {opponentHand.map((_, i) => {
              const isOppSel = joker1Phase === 'opponent' && joker1OpponentSelections.includes(i);
              const isSelectable = joker1Phase === 'opponent';
              return (
                <motion.div
                  key={`opp-hand-peek-${i}`}
                  initial={{ y: '-75%' }}
                  animate={{ y: isOppSel ? '-10%' : isSelectable ? '-45%' : '-72%' }}
                  exit={{ y: '-85%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className={`relative w-10 sm:w-12 md:w-14 aspect-[2/3] shrink-0 rounded-md border-2 overflow-hidden transition-shadow ${isOppSel
                      ? 'border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.8)] pointer-events-auto cursor-pointer'
                      : isSelectable
                        ? 'border-purple-500/50 pointer-events-auto cursor-pointer hover:border-purple-400/80'
                        : 'border-white/10'
                    }`}
                  onClick={() => isSelectable && handleOpponentHandCardClick(i)}
                >
                  <img src={backCardImage} className="w-full h-full object-cover opacity-80" />
                  {isOppSel && <div className="absolute inset-0 bg-purple-500/20" />}
                  {isSelectable && !isOppSel && (
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                      <span className="text-[6px] text-purple-400 font-bold uppercase tracking-widest">?</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="relative flex justify-center gap-2 md:gap-4 w-full max-w-3xl overflow-visible">
          {opponentBoard.map((slot, i) => (
            <BoardSlotView
              key={`opp-${i}`}
              id={`opponent-board-slot-${i}`}
              slot={slot}
              isOpponent
              onSelect={setViewingCard}
              isActiveToAttack={isOpponentSlotActiveToAttack(i) && slot.card !== null}
              onClick={() => handleOpponentSlotClick(i)}
              synergyGlow={opponentSynergy.isActive ? opponentSynergy.suit : null}
            />
          ))}
          <AnimatePresence>
            {opponentSynergy.isActive && opponentSynergy.suit && (
              <SynergyBadge suit={opponentSynergy.suit} isOpponent />
            )}
          </AnimatePresence>
        </div>
        <div className="w-[60%] max-w-xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-2 md:px-3 py-0.5 border border-white/5 rounded-full flex items-center gap-1 md:gap-2 shadow-2xl">
            <div className="text-[6px] md:text-[9px] uppercase tracking-widest text-blue-400 font-bold whitespace-nowrap">
              DEF: {board.filter(s => s.card).length * 25}%
            </div>
            <Swords size={9} className="text-white/20 md:w-3.5 md:h-3.5" />
          </div>
        </div>
        <div className="relative flex justify-center gap-2 md:gap-4 w-full max-w-3xl overflow-visible">
          {board.map((slot, i) => (
            <BoardSlotView
              key={`player-${i}`}
              id={`player-board-slot-${i}`}
              slot={slot}
              onSelect={setViewingCard}
              isAttacking={selectedAttackerIndex === i || caballoPopupSlot === i || copaPopupSlot === i}
              hasAttacked={gameState.playerAttackedIndices.includes(i)}
              isActiveToPlay={selectedHandCardIndex !== null && !slot.card && !selectedIsJoker && canAffordSelected && joker2Phase === null && caballoMoveSourceSlot === null}
              isActiveToHeal={isAlliedSlotActiveToHeal(i)}
              isActiveToStack={isActiveToStackLadder(i) && joker2Phase === null}
              isJoker2Target={
                (joker2Phase === 'board' && slot.card !== null && slot.stack.length === 1) ||
                (joker2Phase === 'hand' && joker2BoardSlot === i)
              }
              isActiveForCaballoMove={
                caballoMoveSourceSlot !== null &&
                i !== caballoMoveSourceSlot &&
                Math.abs(i - caballoMoveSourceSlot) === 1
              }
              isActiveForCopaHeal={copaHealSourceSlot !== null && !!slot.card}
              onClick={() => handlePlayerSlotClick(i)}
              synergyGlow={playerSynergy.isActive ? playerSynergy.suit : null}
            />
          ))}
          <AnimatePresence>
            {playerSynergy.isActive && playerSynergy.suit && (
              <SynergyBadge suit={playerSynergy.suit} />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FOOTER: Mano y Controles */}
      <footer className={`relative z-20 p-2 md:p-3 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col md:flex-row justify-center items-center gap-2 md:gap-6 shrink-0 border-t border-white/5 overflow-visible transition-opacity duration-500 ${!isPlayerTurn ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-end gap-1 md:gap-3 w-full md:w-auto justify-center overflow-visible">

          {/* MAZO — fijo izquierda */}
          <div
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            onClick={handleDrawCard}
          >
            <div className="relative w-10 sm:w-16 md:w-20 lg:w-24 aspect-[2/3] rounded-md border-2 border-white/10 group-hover:border-primary-gold/50 transition-all shadow-2xl overflow-hidden bg-[#080808]">
              {deck.length > 0 ? (
                <img src={backCardImage} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10 text-xl">⊗</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[6px] md:text-[8px] uppercase tracking-widest text-gray-500 font-bold">Mazo</span>
              <span className="text-[7px] md:text-[9px] font-black text-primary-gold">{deck.length}</span>
            </div>
          </div>

          {/* DESCARTES — fijo entre mazo y mano */}
          <div
            className="flex flex-col items-center gap-1 shrink-0"
            onDragOver={(e) => { e.preventDefault(); if (!playerHasDiscarded) setIsDragOverDiscard(true); }}
            onDragLeave={() => setIsDragOverDiscard(false)}
            onDrop={handleDiscardDrop}
          >
            <div className={`relative w-10 sm:w-16 md:w-20 lg:w-24 aspect-[2/3] rounded-md border-2 overflow-hidden bg-[#080808] transition-all ${isDragOverDiscard && !playerHasDiscarded
                ? 'border-red-400 bg-red-950/30 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : playerHasDiscarded
                  ? 'border-white/5 opacity-60'
                  : 'border-white/10'
              }`}>
              {discardPile.length > 0 ? (
                <img src={backCardImage} className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10 text-xl">⊗</div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[6px] md:text-[8px] uppercase tracking-widest text-gray-500 font-bold">
                {playerHasDiscarded ? '✓ Desc.' : 'Descarte'}
              </span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={discardPile.length}
                  initial={{ scale: 1.8, color: '#a68a64' }}
                  animate={{ scale: 1, color: '#9ca3af' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="text-[7px] md:text-[9px] font-black"
                >
                  {discardPile.length}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* MANO — 5 slots fijos, las pilas no se desplazan */}
          <div className="flex gap-1 md:gap-2 items-end pt-5 md:pt-6 pb-1 pr-4 md:pr-5 overflow-visible">
            <AnimatePresence mode="popLayout">
              {hand.map((card, i) => (
                <GameCard
                  key={card.id}
                  card={card}
                  isSelected={selectedHandCardIndex === i}
                  isJoker1Sel={joker1Phase === 'player' && joker1PlayerSelections.includes(i)}
                  isJoker2Swap={
                    (joker2Phase === 'hand' && card.suit !== 'jokers') ||
                    (joker1Phase === 'player' && !joker1PlayerSelections.includes(i))
                  }
                  onClick={() => handleHandCardClick(i)}
                  onRightClick={(e) => {
                    e.preventDefault();
                    setViewingCard(card);
                  }}
                  draggable={!playerHasDiscarded && joker2Phase === null}
                  onDragStart={() => setDraggingHandIndex(i)}
                  onDragEnd={() => setDraggingHandIndex(null)}
                />
              ))}
            </AnimatePresence>
            {Array.from({ length: Math.max(0, 5 - hand.length) }).map((_, i) => (
              <div
                key={`hand-placeholder-${i}`}
                className="relative aspect-[2/3] w-12 sm:w-16 md:w-24 lg:w-28 shrink-0 rounded-md border border-white/5 bg-white/[0.015]"
              />
            ))}
          </div>
        </div>

        <div className="flex md:flex-col gap-2 md:gap-3 items-center w-full md:w-48 px-4 pb-2">
          <AnimatePresence mode="wait">
            {joker1Phase !== null ? (
              <motion.button
                key="joker1-cancel"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleJoker1Cancel}
                className="flex-1 md:w-full py-2.5 md:py-4 px-4 bg-purple-950/60 text-purple-300 font-black uppercase tracking-widest rounded border border-purple-700/60 shadow-xl hover:bg-purple-900/60 transition-all text-[9px] md:text-xs text-center"
              >
                Cancelar Joker
              </motion.button>
            ) : joker2Phase !== null ? (
              /* Modo Joker 2: solo se muestra el botón de cancelar */
              <motion.button
                key="joker2-cancel"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleJoker2Cancel}
                className="flex-1 md:w-full py-2.5 md:py-4 px-4 bg-purple-950/60 text-purple-300 font-black uppercase tracking-widest rounded border border-purple-700/60 shadow-xl hover:bg-purple-900/60 transition-all text-[9px] md:text-xs text-center"
              >
                Cancelar Joker
              </motion.button>
            ) : selectedIsJoker ? (
              <motion.button
                key="use-joker"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleUseJoker}
                className="flex-1 md:w-full py-2.5 md:py-4 px-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded border border-purple-400 shadow-xl hover:bg-purple-500 transition-all text-[9px] md:text-xs flex flex-col items-center justify-center"
              >
                <span>Usar Joker</span>
              </motion.button>
            ) : (
              <motion.button
                key="end-turn"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={handleEndTurn}
                className="flex-1 md:w-full py-2.5 md:py-4 px-4 bg-primary-gold text-black font-black uppercase tracking-widest rounded hover:bg-white transition-all shadow-xl text-[9px] md:text-xs text-center"
              >
                Pasar Turno
              </motion.button>
            )}
          </AnimatePresence>

          {/* Botón DESCARTAR (oculto durante Jokers) */}
          {joker2Phase === null && joker1Phase === null && (
            <motion.button
              onClick={handleDiscard}
              disabled={selectedHandCardIndex === null || playerHasDiscarded}
              className={`flex-1 md:w-full py-2.5 md:py-3 px-4 font-black uppercase tracking-widest rounded border text-[9px] md:text-xs text-center transition-all ${playerHasDiscarded
                  ? 'bg-transparent text-gray-700 border-white/5 cursor-not-allowed'
                  : selectedHandCardIndex !== null
                    ? 'bg-red-950/60 text-red-300 border-red-800/60 hover:bg-red-900/60 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                    : 'bg-transparent text-gray-600 border-white/10 cursor-not-allowed'
                }`}
            >
              {playerHasDiscarded ? '✓ Descartada' : 'Descartar'}
            </motion.button>
          )}
        </div>
      </footer>

      {/* CHAT OVERLAY */}

      {/* FAB para Chat y Log (Mobile) / Botones directos (Desktop) */}
      <div className="fixed bottom-4 left-4 z-[300] flex flex-col gap-2 items-start">
        {/* En móvil mostramos un botón de menú que despliega las opciones */}
        <div className="md:hidden relative">
          <AnimatePresence>
            {showFabMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className="absolute bottom-full mb-2 left-0 flex flex-col gap-2"
              >
                <button
                  onClick={() => { toggleChat(); setShowFabMenu(false); }}
                  className="bg-black/80 border border-white/20 p-3 rounded-full text-white shadow-lg backdrop-blur"
                >
                  <MessageSquare size={20} />
                </button>
                <button
                  onClick={() => { toggleLog(); setShowFabMenu(false); }}
                  className="bg-black/80 border border-primary-gold/50 p-3 rounded-full text-primary-gold shadow-lg backdrop-blur"
                >
                  <ScrollText size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setShowFabMenu(v => !v)}
            className="bg-primary-gold text-black p-3 rounded-full shadow-lg"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* En escritorio mostramos ambos botones permanentemente */}
        <div className="hidden md:flex flex-col gap-2">
          <button
            onClick={toggleChat}
            className="bg-black/80 border border-white/20 p-3 rounded-full text-white shadow-lg backdrop-blur hover:bg-white/10 transition"
            title="Abrir Chat"
          >
            <MessageSquare size={20} />
          </button>
          <button
            onClick={toggleLog}
            className="bg-black/80 border border-primary-gold/50 p-3 rounded-full text-primary-gold shadow-lg backdrop-blur hover:bg-primary-gold/10 transition"
            title="Abrir Registro de Combate"
          >
            <ScrollText size={20} />
          </button>
        </div>
      </div>

      <ChatOverlay
        messages={messages}
        visible={visible}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        toggleChat={toggleChat}
      />

      <CombatLogOverlay
        logs={combatLogs}
        visible={isLogVisible}
        toggleLog={toggleLog}
      />

      {/* POPUP AS DE COPAS */}
      <AnimatePresence>
        {copaPopupSlot !== null && (() => {
          const copaSlot = board[copaPopupSlot];
          const hasActed = copaSlot.card ? copaActedIds.includes(copaSlot.card.id) : true;
          const hasAttacked = gameState.playerAttackedIndices.includes(copaPopupSlot);
          const blocked = hasActed || hasAttacked;
          return (
            <motion.div
              key="copa-popup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] flex items-center justify-center"
              onClick={() => setCopaPopupSlot(null)}
            >
              <motion.div
                initial={{ scale: 0.85, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 10 }}
                className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3 min-w-[200px]"
                onClick={e => e.stopPropagation()}
              >
                <span className="text-[9px] uppercase tracking-[0.4em] text-[#00ccff] text-center font-cinzel">As de Copas</span>
                <button
                  disabled={blocked}
                  onClick={() => {
                    setCopaPopupSlot(null);
                    setSelectedAttackerIndex(copaPopupSlot);
                  }}
                  className={`py-2.5 px-4 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all ${blocked
                      ? 'opacity-30 cursor-not-allowed border-white/10 text-white/30'
                      : 'border-red-500/60 text-red-400 hover:bg-red-950/40 cursor-pointer'
                    }`}
                >
                  ⚔ Atacar
                </button>
                <button
                  disabled={blocked}
                  onClick={() => {
                    const card = board[copaPopupSlot!].card;
                    if (card) setCopaActedIds(prev => [...prev, card.id]);
                    setCopaHealSourceSlot(copaPopupSlot);
                    setCopaPopupSlot(null);
                  }}
                  className={`py-2.5 px-4 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all ${blocked
                      ? 'opacity-30 cursor-not-allowed border-white/10 text-white/30'
                      : 'border-emerald-400/60 text-emerald-300 hover:bg-emerald-950/40 cursor-pointer'
                    }`}
                >
                  ✦ Curar
                </button>
                <button
                  onClick={() => setCopaPopupSlot(null)}
                  className="text-[9px] text-gray-600 hover:text-gray-400 uppercase tracking-widest pt-1"
                >
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* POPUP CABALLO */}
      <AnimatePresence>
        {caballoPopupSlot !== null && (() => {
          const caballoSlot = board[caballoPopupSlot];
          const hasAttacked = gameState.playerAttackedIndices.includes(caballoPopupSlot);
          const hasMoved = caballoSlot.card ? caballoMovedIds.includes(caballoSlot.card.id) : true;
          const adjacentSlots = [caballoPopupSlot - 1, caballoPopupSlot + 1]
            .filter(i => i >= 0 && i < 3);
          const canMove = !hasMoved && adjacentSlots.length > 0;
          return (
            <motion.div
              key="caballo-popup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] flex items-center justify-center"
              onClick={() => setCaballoPopupSlot(null)}
            >
              <motion.div
                initial={{ scale: 0.85, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 10 }}
                className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-3 min-w-[200px]"
                onClick={e => e.stopPropagation()}
              >
                <span className="text-[9px] uppercase tracking-[0.4em] text-primary-gold text-center font-cinzel">Caballo</span>
                <button
                  disabled={hasAttacked}
                  onClick={() => {
                    setCaballoPopupSlot(null);
                    setSelectedAttackerIndex(caballoPopupSlot);
                  }}
                  className={`py-2.5 px-4 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all ${hasAttacked
                      ? 'opacity-30 cursor-not-allowed border-white/10 text-white/30'
                      : 'border-red-500/60 text-red-400 hover:bg-red-950/40 cursor-pointer'
                    }`}
                >
                  ⚔ Atacar
                </button>
                <button
                  disabled={!canMove}
                  onClick={() => {
                    const src = caballoPopupSlot;
                    setCaballoPopupSlot(null);
                    setCaballoMoveSourceSlot(src);
                  }}
                  className={`py-2.5 px-4 rounded-lg border text-[11px] font-black uppercase tracking-widest transition-all ${!canMove
                      ? 'opacity-30 cursor-not-allowed border-white/10 text-white/30'
                      : 'border-orange-400/60 text-orange-300 hover:bg-orange-950/40 cursor-pointer'
                    }`}
                >
                  ↔ Moverse
                </button>
                <button
                  onClick={() => setCaballoPopupSlot(null)}
                  className="text-[9px] text-gray-600 hover:text-gray-400 uppercase tracking-widest pt-1"
                >
                  Cancelar
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {viewingCard && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-modal-backdrop backdrop-blur-sm overflow-y-auto"
            onClick={() => setViewingCard(null)}
          >
            <div className="max-w-4xl w-full flex flex-col md:flex-row gap-6 md:gap-12 items-center" onClick={e => e.stopPropagation()}>
              <motion.div
                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px] shrink-0"
              >
                <div
                  className="w-full aspect-[2/3] rounded-xl border border-white/10 shadow-2xl overflow-hidden relative card-holographic"
                  style={{ borderColor: suitColors[viewingCard.suit] }}
                >
                  <img src={viewingCard.image} className="w-full h-full object-cover" />
                </div>
              </motion.div>
              <div className="flex-1 space-y-4 md:space-y-5 text-center md:text-left">
                <div>
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-2">{viewingCard.name}</h2>
                  <div className="flex justify-center md:justify-start items-center gap-4">
                    <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-primary-gold border border-primary-gold/30 px-2 py-0.5">{viewingCard.role}</span>
                  </div>
                </div>
                <div className="flex justify-center md:justify-start gap-4">
                  {viewingCard.suit !== 'jokers' && (() => {
                    const baseAtk = viewingCard.attack;
                    const bonus = viewingCard.ladderBonus || 0;
                    const currentAtk = typeof baseAtk === 'number' ? baseAtk + bonus : baseAtk;
                    const maxHp = viewingCard.maxHealth ?? viewingCard.health;
                    return (
                      <>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] uppercase tracking-widest text-accent-gray">Ataque</span>
                          <span className="text-xl font-bold text-red-400">
                            {bonus > 0 ? `${currentAtk}` : `${baseAtk}`}
                          </span>
                          {bonus > 0 && (
                            <span className="text-[9px] text-red-300/60">(base {baseAtk})</span>
                          )}
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] uppercase tracking-widest text-accent-gray">Vida</span>
                          <span className="text-xl font-bold text-green-400">{viewingCard.health}<span className="text-sm text-green-600">/{maxHp}</span></span>
                        </div>
                        <div className="w-px bg-white/10" />
                      </>
                    );
                  })()}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] uppercase tracking-widest text-accent-gray">Coste</span>
                    <span className="text-xl font-bold text-blue-400">{viewingCard.cost}</span>
                  </div>
                </div>
                <div className="p-4 bg-surface border border-accent-gray/20 rounded-xl text-secondary-theme">
                  <p className="text-[9px] uppercase tracking-widest text-accent-gray mb-2">Descripción</p>
                  <p>{viewingCard.descripcion || viewingCard.effect || '—'}</p>
                </div>
                <button onClick={() => setViewingCard(null)} className="md:hidden w-full py-3 bg-white/10 uppercase tracking-widest text-[10px] font-bold">Cerrar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AVISOS DE JUEGO */}
      <AnimatePresence>
        {warningText && (
          <motion.div
            key={warningText}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-150 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-black/90 border border-primary-gold/40 rounded-lg px-4 py-2.5 shadow-[0_0_20px_rgba(166,138,100,0.2)] backdrop-blur-md">
              <span className="text-primary-gold text-lg font-black">⚡</span>
              <span className="text-primary-gold font-bold uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap">
                {warningText}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INSTRUCCIÓN FLOTANTE JOKER 1 */}
      <AnimatePresence>
        {joker1Phase && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-80 pointer-events-none"
          >
            <div className="bg-purple-950/95 border border-purple-500/60 rounded-xl px-5 py-3 text-center shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md">
              <p className="text-purple-300 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                ✦ Joker de Intercambio ✦
              </p>
              <p className="text-white text-[9px] md:text-xs mt-1 font-medium">
                {joker1Phase === 'player'
                  ? `Selecciona 2 cartas de tu mano (${joker1PlayerSelections.length}/2)`
                  : `Elige 2 cartas del rival a ciegas (${joker1OpponentSelections.length}/2)`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INSTRUCCIÓN FLOTANTE JOKER 2 */}
      <AnimatePresence>
        {joker2Phase && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-80 pointer-events-none"
          >
            <div className="bg-purple-950/95 border border-purple-500/60 rounded-xl px-5 py-3 text-center shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md">
              <p className="text-purple-300 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                ✦ Joker de Retorno ✦
              </p>
              <p className="text-white text-[9px] md:text-xs mt-1 font-medium">
                {joker2Phase === 'board'
                  ? 'Selecciona una carta de tu tablero'
                  : 'Selecciona una carta de tu mano para intercambiar'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANIMACIÓN PHASER DE JOKER */}
      <AnimatePresence>
        {jokerAnim && (
          <JokerAnimationOverlay
            jokerCard={jokerAnim.card}
            onComplete={handleJokerAnimComplete}
          />
        )}
      </AnimatePresence>

      {/* ANIMACIÓN PHASER DE ATAQUE */}
      <AnimatePresence>
        {activeAttackAnim && (
          <AttackAnimationOverlay
            attackerCard={activeAttackAnim.attackerCard}
            targetCard={activeAttackAnim.targetCard}
            isDirect={activeAttackAnim.isDirect}
            isHeal={activeAttackAnim.isHeal}
            isPlayerAttacker={activeAttackAnim.isPlayerAttacker}
            attackerSlotIndex={activeAttackAnim.attackerSlotIndex}
            targetSlotIndex={activeAttackAnim.targetSlotIndex}
            onComplete={activeAttackAnim.onComplete}
          />
        )}
      </AnimatePresence>

      {/* MODAL FIN DE PARTIDA: VICTORIA / DERROTA */}
      <AnimatePresence>
        {gameOver && (
          <GameOverOverlay
            result={gameOver}
            userName={user.name || 'Héroe'}
            onRestart={handleRestart}
            onMainMenu={() => navigate('/menu')}
            dishonorable={isDishonorable}
          />
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN DE RENDICIÓN */}
      <AnimatePresence>
        {showSurrenderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-red-900/30 p-6 md:p-10 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.1)]"
            >
              <div className="w-16 h-16 bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Shield className="text-red-500" size={32} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-4">¿Abandonar el combate?</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Si te rindes ahora, la batalla se considerará una <span className="text-red-500 font-bold uppercase">derrota</span> deshonrosa.
                <br /><br />
                ¿Estás seguro de que deseas retirarte a las sombras?
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowSurrenderModal(false)}
                  className="flex-1 py-3 px-6 border border-white/10 rounded-lg text-white uppercase tracking-widest text-xs font-bold hover:bg-white/5 transition-all"
                >
                  Seguir Luchando
                </button>
                <button
                  onClick={() => {
                    if (!statsUpdated.current && !user.isGuest) {
                      statsUpdated.current = true;
                      updateMatchStats(user.name, 'lose');
                    }
                    setShowSurrenderModal(false);
                    setGameOver('defeat');
                    setIsDishonorable(true);
                  }}
                  className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg uppercase tracking-widest text-xs font-black hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
                >
                  Rendirse
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const GameCard: React.FC<{
  card: CardData;
  isSelected?: boolean;
  isJoker1Sel?: boolean;
  isJoker2Swap?: boolean;
  onClick?: () => void;
  onRightClick?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}> = ({ card, isSelected, isJoker1Sel, isJoker2Swap, onClick, onRightClick, draggable, onDragStart, onDragEnd }) => {
  const isHighlighted = isSelected || isJoker2Swap || isJoker1Sel;
  const borderColor = isJoker1Sel ? '#fbbf24' : isJoker2Swap ? '#a855f7' : isSelected ? suitColors[card.suit] : `${suitColors[card.suit]}66`;
  const glowStyle = isJoker1Sel
    ? '0 0 25px rgba(251,191,36,0.55)'
    : isJoker2Swap
      ? '0 0 20px rgba(168,85,247,0.4)'
      : `0 0 15px ${suitColors[card.suit]}11`;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
      animate={{ opacity: 1, rotateY: 0, scale: isHighlighted ? 1.1 : 1 }}
      exit={{ opacity: 0, rotateY: 90, scale: 0.6, transition: { duration: 0.25 } }}
      whileHover={{ scale: isHighlighted ? 1.15 : 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformPerspective: 800 }}
      className={`
        relative aspect-[2/3] w-12 sm:w-16 md:w-24 lg:w-28 cursor-pointer group shrink-0
        ${isHighlighted ? 'z-50 -translate-y-4' : 'hover:z-40 hover:-translate-y-2'}
      `}
      onClick={onClick}
      onContextMenu={onRightClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        className={`w-full h-full relative rounded-md md:rounded-lg border-2 bg-[#080808] transition-all duration-500
          ${isJoker1Sel ? 'shadow-[0_0_28px_rgba(251,191,36,0.6)] animate-pulse' : isJoker2Swap ? 'shadow-[0_0_30px_rgba(168,85,247,0.6)] animate-pulse' : isSelected ? 'shadow-[0_0_30px_rgba(166,138,100,0.5)] card-holographic' : 'shadow-lg'}`}
        style={{ borderColor, boxShadow: glowStyle }}
      >
        <div className="w-full h-full overflow-hidden relative rounded-[inherit]">
          <img src={card.image} className="w-full h-full object-cover transition-all duration-700" />

          {/* OVERLAY ESTILO GALERIA (COMPLETO) */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col p-2 md:p-4 overflow-y-auto scrollbar-hide">
            {/* Rol Central con rallas */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-4 md:w-10 h-px bg-white/20 mb-1 md:mb-2" />
              <span className="text-[6px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/50 font-cinzel leading-none">
                {card.role}
              </span>
              <div className="w-4 md:w-10 h-px bg-white/20 mt-1 md:mt-2" />
            </div>

            {/* Info inferior: Nombre, Stats y Descripción */}
            <div className="mt-auto text-center md:text-left">
              {card.suit !== 'jokers' && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[6px] md:text-[10px] text-white/70 uppercase">ATK: {card.attack}</span>
                  <span className="text-[6px] md:text-[10px] text-white/70 uppercase">HP: {card.health}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-1 md:pt-2">
                <p className="text-[5px] md:text-[9px] text-gray-400 italic leading-tight line-clamp-3 md:line-clamp-none">
                  {card.effect}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 z-[60]">
        <div
          className="w-5 h-5 md:w-9 md:h-9 rounded-full bg-black/95 backdrop-blur-md flex items-center justify-center border md:border-2 shadow-2xl"
          style={{ borderColor: suitColors[card.suit] }}
        >
          <span className="text-[8px] md:text-sm font-bold" style={{ color: suitColors[card.suit] }}>{card.cost}</span>
        </div>
      </div>
    </motion.div>
  );
};

const BoardSlotView: React.FC<{
  slot: BoardSlot;
  id?: string;
  isOpponent?: boolean;
  onSelect: (c: CardData) => void;
  isActiveToPlay?: boolean;
  isAttacking?: boolean;
  hasAttacked?: boolean;
  isActiveToAttack?: boolean;
  isActiveToHeal?: boolean;
  isActiveToStack?: boolean;
  isJoker2Target?: boolean;
  isActiveForCaballoMove?: boolean;
  isActiveForCopaHeal?: boolean;
  onClick?: () => void;
  synergyGlow?: string | null;
}> = ({ slot, id, isOpponent: _isOpponent, onSelect, isActiveToPlay, isAttacking, hasAttacked, isActiveToAttack, isActiveToHeal, isActiveToStack, isJoker2Target, isActiveForCaballoMove, isActiveForCopaHeal, onClick, synergyGlow }) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`
        flex-1 max-w-[70px] sm:max-w-[90px] md:max-w-[110px] lg:max-w-[120px] aspect-[2/3] rounded-lg border flex items-center justify-center relative transition-all duration-500
        ${slot.card
          ? isJoker2Target
            ? 'border-purple-500 bg-purple-500/10 animate-pulse cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.5)] z-30'
            : isAttacking
              ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-105 z-30'
              : hasAttacked
                ? 'border-white/5 opacity-60'
                : isActiveToAttack
                  ? 'border-red-500 bg-red-500/15 animate-pulse cursor-crosshair shadow-[0_0_20px_rgba(239,68,68,0.4)] z-30'
                  : isActiveToHeal
                    ? 'border-green-500 bg-green-500/15 animate-pulse cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.4)] z-30'
                    : isActiveToStack
                      ? 'border-amber-500 bg-amber-500/10 animate-pulse cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.5)] z-30'
                      : 'border-white/5 bg-white/[0.01]'
          : isActiveForCopaHeal
            ? 'border-emerald-400 bg-emerald-400/10 animate-pulse cursor-pointer shadow-[0_0_20px_rgba(52,211,153,0.4)] z-30'
            : isActiveForCaballoMove
              ? 'border-orange-400 bg-orange-400/10 animate-pulse cursor-pointer shadow-[0_0_20px_rgba(251,146,60,0.4)] z-30'
              : isActiveToPlay
                ? 'border-primary-gold bg-primary-gold/10 animate-pulse cursor-pointer shadow-lg'
                : 'border-white/5 bg-white/[0.01]'}
      `}
    >
      <AnimatePresence>
        {slot.card && (
          <motion.div
            key={slot.card.id}
            initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.3, opacity: 0, rotateY: 90, transition: { duration: 0.3, ease: 'easeIn' } }}
            style={{ transformPerspective: 800 }}
            className="w-full h-full relative group cursor-pointer overflow-visible"
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            onContextMenu={(e) => { e.preventDefault(); onSelect(slot.card!); }}
          >
            <div
              className={`w-full h-full relative rounded-md md:rounded-lg border-2 bg-[#080808] transition-all duration-500 group-hover:-translate-y-2 md:group-hover:-translate-y-4 group-hover:z-50`}
              style={(() => {
                const synergyColor = synergyGlow ? suitColors[synergyGlow as keyof typeof suitColors] : null;
                if (isJoker2Target) return { borderColor: '#a855f7', boxShadow: '0 0 18px rgba(168,85,247,0.5)' };
                if (isAttacking) return { borderColor: '#22c55e', boxShadow: '0 0 15px rgba(34,197,94,0.3)' };
                if (isActiveToAttack) return { borderColor: '#ef4444', boxShadow: '0 0 15px rgba(239,68,68,0.3)' };
                if (isActiveToHeal) return { borderColor: '#22c55e', boxShadow: '0 0 15px rgba(34,197,94,0.3)' };
                if (synergyColor) return {
                  borderColor: synergyColor,
                  boxShadow: `0 0 18px ${synergyColor}99, 0 0 40px ${synergyColor}44`,
                };
                return { borderColor: `${suitColors[slot.card.suit]}88`, boxShadow: `0 0 15px ${suitColors[slot.card.suit]}11` };
              })()}
            >
              <div className="w-full h-full overflow-hidden relative rounded-[inherit]">
                <img src={slot.card.image} className="w-full h-full object-cover" />

                {/* OVERLAY ESTILO GALERIA (COMPLETO) */}
                <div className="absolute inset-0 bg-black/85 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col p-2 md:p-4 overflow-y-auto scrollbar-hide">
                  {/* Rol Central con rallas */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-4 md:w-10 h-px bg-white/20 mb-1 md:mb-2" />
                    <span className="text-[6px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/50 font-cinzel leading-none">
                      {slot.card.role}
                    </span>
                    <div className="w-4 md:w-10 h-px bg-white/20 mt-1 md:mt-2" />
                  </div>

                  {/* Info inferior: Nombre, Stats y Descripción */}
                  <div className="mt-auto text-center md:text-left">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[6px] md:text-[10px] text-white/70 uppercase">
                        ATK: {slot.card.ladderBonus ? `${slot.card.attack}+${slot.card.ladderBonus}` : slot.card.attack}
                      </span>
                      <span className="text-[6px] md:text-[10px] text-white/70 uppercase">HP: {slot.card.health}</span>
                    </div>
                    <div className="border-t border-white/10 pt-1 md:pt-2">
                      <p className="text-[5px] md:text-[9px] text-gray-400 italic leading-tight line-clamp-3 md:line-clamp-none">
                        {slot.card.effect}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-1 md:p-2 bg-gradient-to-t from-black to-transparent flex justify-between items-center group-hover:opacity-0 transition-opacity">
                  <span className="text-red-500 font-bold text-[8px] md:text-xs">
                    {slot.card.ladderBonus ? `${slot.card.attack}+${slot.card.ladderBonus}` : slot.card.attack}
                  </span>
                  <span className="text-blue-400 font-bold text-[8px] md:text-xs">{slot.card.health}</span>
                </div>
              </div>
            </div>

            {/* Indicador de costo de voluntad en el tablero */}
            <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 z-[60]">
              <div
                className="w-4 h-4 md:w-7 md:h-7 rounded-full bg-black/95 backdrop-blur-md flex items-center justify-center border md:border-2 shadow-2xl"
                style={{ borderColor: suitColors[slot.card.suit] }}
              >
                <span className="text-[7px] md:text-xs font-bold" style={{ color: suitColors[slot.card.suit] }}>{slot.card.cost}</span>
              </div>
            </div>

            {slot.stack.length > 1 && (
              <div className="group/ladder absolute -bottom-2 -left-2 z-50">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-amber-500/90 text-black flex items-center justify-center font-black text-[8px] md:text-[10px] border border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)] cursor-default select-none">
                  {slot.stack.length}
                </div>
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover/ladder:block pointer-events-none">
                  <div className="bg-black/90 border border-amber-500/50 rounded px-2 py-1 text-[8px] md:text-[9px] text-amber-400 font-bold uppercase tracking-wide whitespace-nowrap">
                    Escalera de {slot.stack.length}: +{slot.stack.length - 1} ATK extra
                  </div>
                </div>
              </div>
            )}

            {/* Indicadores de estado: escudo, veneno, sangrado */}
            {(slot.card.shield || !!slot.card.poisonTurns || !!slot.card.bleedTurns) && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-40 flex flex-col gap-0.5 items-center pointer-events-none">
                {slot.card.shield && (
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-yellow-400 border border-yellow-200 flex items-center justify-center shadow-[0_0_6px_rgba(234,179,8,0.8)]" title="Escudo">
                    <span className="text-[6px] md:text-[8px] leading-none select-none">🛡</span>
                  </div>
                )}
                {!!slot.card.poisonTurns && (
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center shadow-[0_0_6px_rgba(147,51,234,0.8)]" title={`Veneno (${slot.card.poisonTurns} turnos)`}>
                    <span className="text-[6px] md:text-[8px] leading-none select-none font-bold text-white">{slot.card.poisonTurns}</span>
                  </div>
                )}
                {!!slot.card.bleedTurns && (
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-red-600 border border-red-400 flex items-center justify-center shadow-[0_0_6px_rgba(220,38,38,0.8)]" title="Sangrado">
                    <span className="text-[6px] md:text-[8px] leading-none select-none">🩸</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!slot.card && (
        <span className="text-white/5 uppercase tracking-[0.2em] text-[7px] md:text-[10px] font-black italic">
          {isActiveToPlay ? 'Play' : ''}
        </span>
      )}
    </div>
  );
};

export default Game;

const suitBonusText: Record<string, string> = {
  oros: 'Bonus de Oros: +1 de voluntad por turno',
  copas: 'Bonus de Copas: +1 HP por turno y purga efectos negativos',
  espadas: 'Bonus de Espadas: +1 de daño a todas las cartas',
  bastos: 'Bonus de Bastos: -1 de daño recibido a todas las cartas',
};

const SynergyBadge: React.FC<{ suit: string; isOpponent?: boolean }> = ({ suit, isOpponent }) => {
  const color = suitColors[suit as keyof typeof suitColors] ?? '#ffffff';
  return (
    <motion.div
      initial={{ opacity: 0, y: isOpponent ? -8 : 8, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isOpponent ? -8 : 8, scale: 0.85 }}
      transition={{ duration: 0.3 }}
      className={`absolute ${isOpponent ? '-top-7' : '-bottom-7'} right-0 z-40 pointer-events-none`}
    >
      <div
        className="flex items-center gap-1 px-2 py-1 rounded-full text-[8px] md:text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md whitespace-nowrap"
        style={{
          color,
          borderColor: `${color}55`,
          backgroundColor: `${color}18`,
          boxShadow: `0 0 10px ${color}40`,
        }}
      >
        <span style={{ color }}>✦</span>
        <span>{suitBonusText[suit] ?? suit}</span>
      </div>
    </motion.div>
  );
};
