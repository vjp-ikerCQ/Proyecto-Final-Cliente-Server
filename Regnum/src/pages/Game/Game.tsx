import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Swords, Layers, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type CardData } from '../../utils/cardData';
import { useGameState, type BoardSlot } from './hooks/useGameState';
import { useBotAI } from './hooks/useBotAI';
import AtmosphereParticles from '../../components/AtmosphereParticles';

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

const Game: React.FC = () => {
  const navigate = useNavigate();

  // Custom Hooks para estado y bot
  const gameState = useGameState();
  const {
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
    drawCard,
    playCard,
    useJoker,
    endTurn,
    healCard,
    setOpponentHand,
    setDeck,
    setOpponentVoluntad,
    setOpponentBoard
  } = gameState;

  useBotAI({
    isPlayerTurn,
    isLoading,
    opponentVoluntad,
    opponentHand,
    opponentBoard,
    deck,
    setOpponentHand,
    setDeck,
    setOpponentVoluntad,
    setOpponentBoard,
    endTurn
  });

  // Gestión de selección local de la UI
  const [selectedHandCardIndex, setSelectedHandCardIndex] = useState<number | null>(null);
  const [selectedAttackerIndex, setSelectedAttackerIndex] = useState<number | null>(null);
  const [viewingCard, setViewingCard] = useState<CardData | null>(null);
  const [showSurrenderModal, setShowSurrenderModal] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showVoluntadWarning, setShowVoluntadWarning] = useState(false);

  useEffect(() => {
    if (voluntad < 5) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 400);
      return () => clearTimeout(timer);
    }
  }, [voluntad]);

  useEffect(() => {
    if (!showVoluntadWarning) return;
    const timer = setTimeout(() => setShowVoluntadWarning(false), 2000);
    return () => clearTimeout(timer);
  }, [showVoluntadWarning]);

  // Manejadores específicos de la UI del jugador
  const handleDrawCard = () => {
    drawCard(true);
  };

  const handlePlayCard = (slotIndex: number) => {
    if (selectedHandCardIndex === null) return;
    playCard(true, slotIndex, selectedHandCardIndex);
    setSelectedHandCardIndex(null);
  };

  const handlePlayerSlotClick = (slotIndex: number) => {
    const slot = board[slotIndex];
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
            setShowVoluntadWarning(true);
            return;
          }
          healCard(true, selectedAttackerIndex, slotIndex);
          setSelectedAttackerIndex(null);
          return;
        }
      }

      if (!isPlayerTurn) return;
      if (gameState.playerAttackedIndices.includes(slotIndex)) return; // ya atacó
      setSelectedAttackerIndex(prev => prev === slotIndex ? null : slotIndex);
      setSelectedHandCardIndex(null);
    }
  };

  const handleOpponentSlotClick = (slotIndex: number) => {
    const slot = opponentBoard[slotIndex];
    if (selectedAttackerIndex !== null && slot.card) {
      if (isOpponentSlotActiveToAttack(slotIndex)) {
        gameState.attackCard(true, selectedAttackerIndex, slotIndex);
        setSelectedAttackerIndex(null);
      } else if (attackerCard && voluntad < attackerCard.cost) {
        setShowVoluntadWarning(true);
      }
    } else {
      if (slot.card) {
        setViewingCard(slot.card);
      }
    }
  };

  const handleAttackDirectly = () => {
    if (selectedAttackerIndex === null) return;
    if (attackerCard && voluntad < attackerCard.cost) {
      setShowVoluntadWarning(true);
      return;
    }
    gameState.attackDirectly(true, selectedAttackerIndex);
    setSelectedAttackerIndex(null);
  };

  const handleUseJoker = () => {
    if (selectedHandCardIndex === null) return;
    useJoker(true, selectedHandCardIndex);
    setSelectedHandCardIndex(null);
  };

  const handleEndTurn = () => {
    endTurn(true);
    setSelectedHandCardIndex(null);
    setSelectedAttackerIndex(null);
  };

  const selectedHandCard = selectedHandCardIndex !== null ? hand[selectedHandCardIndex] : null;
  const selectedIsJoker = selectedHandCard !== null && selectedHandCard.suit === 'jokers';
  const canAffordSelected = selectedHandCard !== null;

  const attackerCard = selectedAttackerIndex !== null ? board[selectedAttackerIndex]?.card : null;

  const isOpponentSlotActiveToAttack = (slotIndex: number) => {
    if (selectedAttackerIndex === null || !attackerCard) return false;
    if (voluntad < attackerCard.cost) return false; // Voluntad insuficiente para atacar

    // Solo asesino, tanque, tirador, pícaro, mago y sota pueden elegir a qué carta pegar
    const TARGETING_ROLES = ['ASESINO', 'TANQUE', 'TIRADOR', 'PICARO', 'MAGO', 'SOTA'];
    if (!TARGETING_ROLES.includes(attackerCard.role.toUpperCase())) {
      // Si no es un rol de target, solo puede pegar a su propia columna vertical
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
    if (attackerCard.attackType === 'SOPORTE') return false; // Curanderos/Clérigos no atacan cara
    if (voluntad < attackerCard.cost) return false; // Voluntad insuficiente para atacar

    const TARGETING_ROLES = ['ASESINO', 'TANQUE', 'TIRADOR', 'PICARO', 'MAGO', 'SOTA'];
    const hasOpponentCards = opponentBoard.some(s => s.card);

    // Si es una carta de daño a un solo objetivo, no puede atacar cara si hay cartas enemigas
    if (TARGETING_ROLES.includes(attackerCard.role.toUpperCase())) {
      if (hasOpponentCards) return false;
    }

    // COLUMNA: puede atacar directo solo si su columna específica está vacía
    if (attackerCard.attackType === 'COLUMNA') {
      return !opponentBoard[selectedAttackerIndex].card;
    }

    // DIRECTO: puede atacar siempre
    if (attackerCard.attackType === 'DIRECTO') return true;

    // El resto: solo si no hay cartas enemigas
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
          <div className="w-6 sm:hidden" />
        </div>

        <div className="flex justify-around items-center w-full max-w-2xl gap-4 md:gap-12">
          <div
            onClick={selectedAttackerIndex !== null ? handleAttackDirectly : undefined}
            className={`flex flex-col items-center flex-1 transition-all duration-300 ${canAttackDirectly() ? 'cursor-crosshair scale-105 border border-red-500/40 p-1 bg-red-950/20 rounded shadow-[0_0_15px_rgba(220,38,38,0.2)] animate-pulse' : ''}`}
          >
            <span className="text-[7px] md:text-[9px] text-red-500/80 uppercase tracking-[0.2em] mb-0.5">Oponente {!isPlayerTurn && '(Pensando...)'} {selectedAttackerIndex !== null && '🎯 ATACAR'}</span>
            <div className="w-full max-w-[120px] md:max-w-[180px] h-1.5 bg-red-950/30 rounded-full border border-red-900/20 relative overflow-hidden">
              <motion.div className="absolute inset-0 bg-red-600 shadow-[0_0_8px_red]" animate={{ width: `${opponentHp}%` }} />
            </div>
            {/* Opcional: mostrar voluntad del oponente (útil para debug o gameplay) */}
            <span className="text-[6px] md:text-[8px] text-red-400 mt-1">Voluntad: {opponentVoluntad} / Mano: {opponentHand.length}</span>
          </div>
          <div className="text-xl font-black text-gold-gradient tracking-widest uppercase hidden md:block">REGNUM HOLLOW</div>
          <div className="flex flex-col items-center flex-1">
            <span className={`text-[7px] md:text-[9px] ${isPlayerTurn ? 'text-blue-400' : 'text-blue-400/50'} uppercase tracking-[0.2em] mb-0.5`}>
              Jugador {isPlayerTurn && '(Tu Turno)'}
            </span>
            <div className="w-full max-w-[120px] md:max-w-[180px] h-1.5 bg-blue-950/30 rounded-full border border-blue-900/20 relative overflow-hidden">
              <motion.div className="absolute inset-0 bg-blue-500 shadow-[0_0_8px_blue]" animate={{ width: `${hp}%` }} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 px-2">
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
        </div>
      </header>

      {/* TABLERO */}
      <main className="flex-1 relative z-10 flex flex-col justify-center items-center gap-2 md:gap-4 p-2 md:p-4 overflow-visible">
        <div className="flex justify-center gap-2 md:gap-4 w-full max-w-3xl overflow-visible">
          {opponentBoard.map((slot, i) => (
            <BoardSlotView
              key={`opp-${i}`}
              slot={slot}
              isOpponent
              onSelect={setViewingCard}
              isActiveToAttack={isOpponentSlotActiveToAttack(i) && slot.card !== null}
              onClick={() => handleOpponentSlotClick(i)}
            />
          ))}
        </div>
        <div className="w-[60%] max-w-xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-2 md:px-3 py-0.5 border border-white/5 rounded-full flex items-center gap-1 md:gap-2 shadow-2xl">
            <div className="text-[6px] md:text-[9px] uppercase tracking-widest text-blue-400 font-bold whitespace-nowrap">
              DEF: {board.filter(s => s.card).length * 25}%
            </div>
            <Swords size={9} className="text-white/20 md:w-3.5 md:h-3.5" />
          </div>
        </div>
        <div className="flex justify-center gap-2 md:gap-4 w-full max-w-3xl overflow-visible">
          {board.map((slot, i) => (
            <BoardSlotView
              key={`player-${i}`}
              slot={slot}
              onSelect={setViewingCard}
              isAttacking={selectedAttackerIndex === i}
              hasAttacked={gameState.playerAttackedIndices.includes(i)}
              isActiveToPlay={selectedHandCardIndex !== null && !slot.card && !selectedIsJoker && canAffordSelected}
              isActiveToHeal={isAlliedSlotActiveToHeal(i)}
              onClick={() => handlePlayerSlotClick(i)}
            />
          ))}
        </div>
      </main>

      {/* FOOTER: Mano y Controles */}
      <footer className={`relative z-20 p-2 md:p-3 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col md:flex-row justify-center items-center gap-2 md:gap-6 shrink-0 border-t border-white/5 overflow-visible transition-opacity duration-500 ${!isPlayerTurn ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto justify-center overflow-visible">
          <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={handleDrawCard}>
            <div className="w-10 h-15 sm:w-14 sm:h-21 md:w-18 md:h-28 border border-white/10 rounded-md bg-[#080808] flex items-center justify-center group-hover:border-primary-gold/50 transition-all shadow-2xl relative overflow-hidden shrink-0">
              <Layers className="text-white/10 group-hover:text-primary-gold/40 transition-colors" size={16} />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-[6px] md:text-[8px] uppercase tracking-widest text-gray-500 font-bold">Mazo | 1v</span>
          </div>

          <div className="flex gap-1 md:gap-3 items-end px-1 md:px-4 pt-4 md:pt-6 pb-1 overflow-x-auto overflow-y-visible max-w-[85vw] md:max-w-none scrollbar-hide">
            <AnimatePresence>
              {hand.map((card, i) => (
                <GameCard
                  key={`${card.id}-${i}`}
                  card={card}
                  isSelected={selectedHandCardIndex === i}
                  onClick={() => setSelectedHandCardIndex(selectedHandCardIndex === i ? null : i)}
                  onRightClick={(e) => {
                    e.preventDefault();
                    setViewingCard(card);
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex md:flex-col gap-2 md:gap-4 items-center w-full md:w-48 px-4 pb-2">
          <AnimatePresence mode="wait">
            {selectedIsJoker ? (
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
        </div>
      </footer>

      {/* OVERLAY DE DETALLES */}
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
                className="w-full max-w-[220px] sm:max-w-[280px] md:max-w-[350px] aspect-[2/3] rounded-xl border border-white/10 shadow-2xl overflow-hidden relative shrink-0 max-h-[65vh] card-holographic"
                style={{ borderColor: suitColors[viewingCard.suit] }}
              >
                <img src={viewingCard.image} className="w-full h-full object-cover" />
              </motion.div>
              <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
                <div>
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-2">{viewingCard.name}</h2>
                  <div className="flex justify-center md:justify-start items-center gap-4">
                    <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-primary-gold border border-primary-gold/30 px-2 py-0.5">{viewingCard.role}</span>
                  </div>
                </div>
                <div className="p-4 bg-surface border border-accent-gray/20 rounded-xl italic text-secondary-theme">"{viewingCard.effect}"</div>
                <button onClick={() => setViewingCard(null)} className="md:hidden w-full py-3 bg-white/10 uppercase tracking-widest text-[10px] font-bold">Cerrar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AVISO DE VOLUNTAD INSUFICIENTE */}
      <AnimatePresence>
        {showVoluntadWarning && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-150 pointer-events-none"
          >
            <div className="flex items-center gap-2 bg-black/90 border border-primary-gold/40 rounded-lg px-4 py-2.5 shadow-[0_0_20px_rgba(166,138,100,0.2)] backdrop-blur-md">
              <span className="text-primary-gold text-lg font-black">⚡</span>
              <span className="text-primary-gold font-bold uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap">
                Voluntad insuficiente
              </span>
            </div>
          </motion.div>
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
                  onClick={() => navigate('/menu')}
                  className="flex-1 py-3 px-6 bg-red-600 text-white rounded-lg uppercase tracking-widest text-xs font-black hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
                >
                  Rendirse
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const GameCard: React.FC<{
  card: CardData;
  isSelected?: boolean;
  onClick?: () => void;
  onRightClick?: (e: React.MouseEvent) => void;
}> = ({ card, isSelected, onClick, onRightClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isSelected ? 1.1 : 1
      }}
      whileHover={{ scale: isSelected ? 1.15 : 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative aspect-[2/3] w-12 sm:w-16 md:w-24 lg:w-28 cursor-pointer group shrink-0
        ${isSelected ? 'z-50 -translate-y-4' : 'hover:z-40 hover:-translate-y-2'}
      `}
      onClick={onClick}
      onContextMenu={onRightClick}
    >
      <div
        className={`w-full h-full relative rounded-md md:rounded-lg border-2 bg-[#080808] transition-all duration-500 
          ${isSelected ? 'shadow-[0_0_30px_rgba(166,138,100,0.5)] card-holographic' : 'shadow-lg'}`}
        style={{
          borderColor: isSelected ? suitColors[card.suit] : `${suitColors[card.suit]}66`,
          boxShadow: `0 0 15px ${suitColors[card.suit]}11`
        }}
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
              <div className="flex justify-between items-center mb-1">
                <span className="text-[6px] md:text-[10px] text-white/70 uppercase">ATK: {card.attack}</span>
                <span className="text-[6px] md:text-[10px] text-white/70 uppercase">HP: {card.health}</span>
              </div>
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
  isOpponent?: boolean;
  onSelect: (c: CardData) => void;
  isActiveToPlay?: boolean;
  isAttacking?: boolean;
  hasAttacked?: boolean;
  isActiveToAttack?: boolean;
  isActiveToHeal?: boolean;
  onClick?: () => void;
}> = ({ slot, isOpponent, onSelect, isActiveToPlay, isAttacking, hasAttacked, isActiveToAttack, isActiveToHeal, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex-1 max-w-[70px] sm:max-w-[90px] md:max-w-[110px] lg:max-w-[120px] aspect-[2/3] rounded-lg border flex items-center justify-center relative transition-all duration-500
        ${slot.card
          ? isAttacking
            ? 'border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-105 z-30'
            : hasAttacked
              ? 'border-white/5 opacity-60'
              : isActiveToAttack
                ? 'border-red-500 bg-red-500/15 animate-pulse cursor-crosshair shadow-[0_0_20px_rgba(239,68,68,0.4)] z-30'
                : isActiveToHeal
                  ? 'border-green-500 bg-green-500/15 animate-pulse cursor-pointer shadow-[0_0_20px_rgba(34,197,94,0.4)] z-30'
                  : 'border-white/5 bg-white/[0.01]'
          : isActiveToPlay
            ? 'border-primary-gold bg-primary-gold/10 animate-pulse cursor-pointer shadow-lg'
            : 'border-white/5 bg-white/[0.01]'}
      `}
    >
      {slot.card ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-full h-full relative group cursor-pointer overflow-visible"
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          onContextMenu={(e) => { e.preventDefault(); onSelect(slot.card!); }}
        >
          <div
            className={`w-full h-full relative rounded-md md:rounded-lg border-2 bg-[#080808] transition-all duration-500 group-hover:-translate-y-2 md:group-hover:-translate-y-4 group-hover:z-50`}
            style={{
              borderColor: isAttacking ? '#22c55e' : isActiveToAttack ? '#ef4444' : isActiveToHeal ? '#22c55e' : `${suitColors[slot.card.suit]}88`,
              boxShadow: isAttacking ? '0 0 15px rgba(34,197,94,0.3)' : isActiveToAttack ? '0 0 15px rgba(239,68,68,0.3)' : isActiveToHeal ? '0 0 15px rgba(34,197,94,0.3)' : `0 0 15px ${suitColors[slot.card.suit]}11`
            }}
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
                    <span className="text-[6px] md:text-[10px] text-white/70 uppercase">ATK: {slot.card.attack}</span>
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
                <span className="text-red-500 font-bold text-[8px] md:text-xs">{slot.card.attack}</span>
                <span className="text-blue-400 font-bold text-[8px] md:text-xs">{slot.card.health}</span>
              </div>
            </div>
          </div>
          {slot.stack.length > 1 && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-6 md:h-6 rounded bg-primary-gold text-black flex items-center justify-center font-black text-[8px] md:text-xs border border-black z-[60]">
              +{slot.stack.length - 1}
            </div>
          )}
        </motion.div>
      ) : (
        <span className="text-white/5 uppercase tracking-[0.2em] text-[7px] md:text-[10px] font-black italic">
          {isActiveToPlay ? 'Play' : ''}
        </span>
      )}
    </div>
  );
};

export default Game;
