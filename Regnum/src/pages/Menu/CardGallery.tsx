import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type CardData } from '../../utils/cardData';
import { fetchCards } from '../../services/cardsService';
import { useSettings } from '../../contexts/SettingsContext';
import { playCardSfx } from '../../utils/cardAudioMap';

/**
 * Colores representativos para cada palo de la baraja
 */
const suitColors = {
  espadas: '#ff4d4d',
  copas: '#00ccff',
  oros: '#ffcc00',
  bastos: '#00ff66',
  jokers: '#a855f7',
};

/**
 * Sub-componente reutilizable para una carta individual en la galería.
 */
const CardTile: React.FC<{ card: CardData; onClick: () => void }> = ({ card, onClick }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="group relative aspect-[2/3] cursor-pointer"
    onClick={onClick}
  >
    <div
      className="w-full h-full relative rounded-md md:rounded-lg overflow-hidden border bg-panel-secondary transition-all duration-500 group-hover:-translate-y-2"
      style={{ borderColor: `${suitColors[card.suit]}33`, boxShadow: `0 0 15px ${suitColors[card.suit]}05` }}
    >
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {card.image && (
          <img src={card.image} alt={card.name} className="w-full h-full object-cover transition-all duration-700" />
        )}
      </div>

      {/* Capa hover */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col p-3 md:p-5">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-6 md:w-10 h-px bg-white/20 mb-2" />
          <span className="text-[8px] md:text-[12px] uppercase tracking-[0.4em] text-white/50 font-cinzel">{card.role}</span>
          <div className="w-6 md:w-10 h-px bg-white/20 mt-2" />
        </div>
        <div className="mt-auto">
          {card.suit !== 'jokers' && (
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] md:text-[11px] text-white/70 uppercase">ATK: {card.attack}</span>
              <span className="text-[8px] md:text-[11px] text-white/70 uppercase">HP: {card.health}</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-2">
            <p className="text-[7px] md:text-[10px] text-gray-400 italic leading-tight">{card.effect}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Burbuja de Coste */}
    <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 z-30">
      <div
        className="w-6 h-6 md:w-9 md:h-9 rounded-full bg-bg-main backdrop-blur-md flex items-center justify-center border md:border-2 shadow-2xl"
        style={{ borderColor: suitColors[card.suit] }}
      >
        <span className="text-[10px] md:text-base font-bold" style={{ color: suitColors[card.suit] }}>{card.cost}</span>
      </div>
    </div>
  </motion.div>
);

/**
 * Componente de la Galería de Cartas.
 * Permite visualizar y filtrar las 48 cartas de la baraja española.
 */
const CardGallery: React.FC = () => {
  const navigate = useNavigate();
  const { playSfx } = useSettings();
  const [activeTab, setActiveTab] = useState<'TODAS' | 'ESPADAS' | 'COPAS' | 'OROS' | 'BASTOS' | 'JOKERS'>('TODAS');
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);

  useEffect(() => {
    fetchCards().then(setCards).catch(console.error);
  }, []);

  const filteredCards = activeTab === 'TODAS'
    ? cards
    : cards.filter(card => card.suit === activeTab.toLowerCase());

  const handleCardClick = (card: CardData) => {
    playSfx();
    setSelectedCard(card);
  };

  const handlePrev = useCallback(() => {
    if (!selectedCard) return;
    const currentIndex = filteredCards.findIndex(c => c.id === selectedCard.id);
    const prevIndex = (currentIndex - 1 + filteredCards.length) % filteredCards.length;
    setSelectedCard(filteredCards[prevIndex]);
  }, [selectedCard, filteredCards]);

  const handleNext = useCallback(() => {
    if (!selectedCard) return;
    const currentIndex = filteredCards.findIndex(c => c.id === selectedCard.id);
    const nextIndex = (currentIndex + 1) % filteredCards.length;
    setSelectedCard(filteredCards[nextIndex]);
  }, [selectedCard, filteredCards]);

  // Soporte para teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCard) {
          setSelectedCard(null);
        } else {
          navigate('/menu');
        }
        return;
      }

      if (!selectedCard) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, handlePrev, handleNext, navigate]);

  return (
    <div className="min-h-screen bg-bg-main text-text-main p-8 font-cinzel relative overflow-y-auto">
      {/* Decoración de fondo fija para mantener la atmósfera */}
      <div className="fixed top-0 left-0 w-full h-full bg-menu-pattern opacity-10 pointer-events-none" />
      
      {/* Cabecera de la Galería */}
      <header className="relative z-10 flex flex-col items-center mb-10 md:mb-16 px-4">
        <button 
          onClick={() => navigate('/menu')}
          className="self-start md:absolute md:left-0 md:top-0 flex items-center gap-2 text-muted hover:text-primary-gold transition-colors group mb-6 md:mb-0"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] md:text-sm uppercase tracking-widest font-cinzel">Volver</span>
        </button>

        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-[0.1em] md:tracking-[0.2em] uppercase text-gold-gradient mb-4 drop-shadow-[0_0_30px_rgba(166,138,100,0.3)] text-center">
          Galería de Cartas
        </h1>
        <div className="flex items-center gap-3 md:gap-4">
            <div className="h-px w-8 md:w-12 bg-primary-gold/30" />
            <p className="text-muted tracking-[0.2em] md:tracking-[0.4em] uppercase text-[8px] md:text-xs text-center">
              La colección completa de Regnum
            </p>
            <div className="h-px w-8 md:w-12 bg-primary-gold/30" />
        </div>
      </header>

      {/* Navegación por pestañas (Filtros por palo) */}
      <nav className="relative z-10 flex justify-center gap-2 mb-6 flex-wrap">
        {['TODAS', 'ESPADAS', 'COPAS', 'OROS', 'BASTOS', 'JOKERS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'TODAS' | 'ESPADAS' | 'COPAS' | 'OROS' | 'BASTOS' | 'JOKERS')}
            className={`
              relative px-10 py-3 text-xs tracking-widest uppercase transition-all duration-500
              ${activeTab === tab 
                ? 'text-primary-gold' 
                : 'text-muted hover:text-text-main'}
            `}
          >
            {tab}
            {activeTab === tab && (
                <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 border border-primary-gold bg-primary-gold/5 shadow-[0_0_15px_rgba(166,138,100,0.2)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
            )}
          </button>
        ))}
      </nav>

      {/* Descripción del filtro activo */}
      <div className="relative z-10 max-w-7xl mx-auto px-2 md:px-0 mb-8">
        {activeTab !== 'TODAS' && activeTab !== 'JOKERS' && (
          <div className="flex items-center gap-4 px-4 py-3 border border-accent-gray/20 bg-surface/50 rounded-lg">
            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: suitColors[activeTab.toLowerCase() as keyof typeof suitColors] }} />
            {activeTab === 'ESPADAS' && (
              <p className="text-xs md:text-sm text-muted italic">
                Las <span className="text-[#ff4d4d] font-bold">Espadas</span> representan el poder y la guerra. 
                Sus cartas se centran en el daño directo y el control del campo de batalla. 
                <span className="text-white/40 ml-2">Sinergia: +1 de daño a todas tus cartas.</span>
              </p>
            )}
            {activeTab === 'COPAS' && (
              <p className="text-xs md:text-sm text-muted italic">
                Las <span className="text-[#00ccff] font-bold">Copas</span> simbolizan la sanación y la magia. 
                Sus cartas destacan por recuperar vida y purgar efectos negativos. 
                <span className="text-white/40 ml-2">Sinergia: +1 HP por turno y purga.</span>
              </p>
            )}
            {activeTab === 'OROS' && (
              <p className="text-xs md:text-sm text-muted italic">
                Los <span className="text-[#ffcc00] font-bold">Oros</span> encarnan la riqueza y la voluntad. 
                Sus cartas generan recursos adicionales y roban voluntad al rival. 
                <span className="text-white/40 ml-2">Sinergia: +1 de voluntad por turno.</span>
              </p>
            )}
            {activeTab === 'BASTOS' && (
              <p className="text-xs md:text-sm text-muted italic">
                Los <span className="text-[#00ff66] font-bold">Bastos</span> son la defensa y la resistencia. 
                Sus cartas protegen y reducen el daño recibido. 
                <span className="text-white/40 ml-2">Sinergia: -1 de daño recibido a tus cartas.</span>
              </p>
            )}
          </div>
        )}
        {activeTab === 'JOKERS' && (
          <div className="flex items-center gap-4 px-4 py-3 border border-purple-900/30 bg-purple-950/20 rounded-lg">
            <div className="w-1 h-8 rounded-full shrink-0 bg-[#a855f7]" />
            <p className="text-xs md:text-sm text-muted italic">
              Los <span className="text-[#a855f7] font-bold">Jokers</span> o comodines son cartas especiales 
              que permiten realizar acciones únicas como intercambiar cartas, recuperar descartes o devolver 
              cartas del tablero a la mano.
            </p>
          </div>
        )}
        {activeTab === 'TODAS' && filteredCards.length > 0 && (
          <p className="text-xs text-muted/60 text-center">
            Mostrando todas las {filteredCards.length} cartas de la baraja de Regnum Hollow.
          </p>
        )}
      </div>

      {/* Cuadrícula de Cartas */}
      <main className="relative z-10 max-w-7xl mx-auto px-2 md:px-0 pb-20 space-y-6">
        {(() => {
          const normalCards = filteredCards.filter(c => c.suit !== 'jokers');
          const jokerCards  = filteredCards.filter(c => c.suit === 'jokers');

          return (
            <>
              {normalCards.length > 0 && (
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                  <AnimatePresence mode='popLayout'>
                    {normalCards.map((card) => (
                      <CardTile key={card.id} card={card} onClick={() => handleCardClick(card)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {jokerCards.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 md:gap-6">
                  <AnimatePresence mode='popLayout'>
                    {jokerCards.map((card) => (
                      <div
                        key={card.id}
                        className="w-[calc((100%/2)-0.75rem)] xs:w-[calc((100%/2)-0.75rem)] sm:w-[calc((100%/3)-0.75rem)] md:w-[calc((100%/4)-1rem)] lg:w-[calc((100%/6)-1.25rem)]"
                      >
                        <CardTile card={card} onClick={() => handleCardClick(card)} />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          );
        })()}
      </main>

      {/* VISTA DETALLADA (MODAL) */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-modal-backdrop backdrop-blur-md"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="max-w-6xl w-full flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start relative group/modal" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute -left-12 lg:-left-20 top-1/2 -translate-y-1/2 p-4 text-muted hover:text-primary-gold transition-all hidden md:block group/btn"
              >
                <ChevronLeft size={48} className="group-hover/btn:-translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute -right-12 lg:-right-20 top-1/2 -translate-y-1/2 p-4 text-muted hover:text-primary-gold transition-all hidden md:block group/btn"
              >
                <ChevronRight size={48} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>

              {/* Carta en Grande */}
              <div className="w-full max-w-[235px] sm:max-w-[335px] md:max-w-[405px] lg:max-w-[465px] aspect-[2/3] relative shrink-0">
                <div 
                  className="w-full h-full rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative border-2 card-holographic"
                  style={{ borderColor: `${suitColors[selectedCard.suit]}44` }}
                >
                  <img src={selectedCard.image} key={selectedCard.id} className="w-full h-full object-cover bg-black animate-fade-in" alt={selectedCard.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                </div>
              </div>

              {/* Información Detallada */}
              <div className="flex-1 space-y-6 md:space-y-10 text-center md:text-left py-4 md:py-10">
                <div className="relative">
                  <span className="text-[8px] md:text-[10px] uppercase tracking-[0.5em] text-primary-gold mb-1 block font-spectral font-black">
                    {selectedCard.suit} / {selectedCard.role}
                  </span>
                  <h2 className="text-2xl sm:text-4xl md:text-6xl font-black text-text-main uppercase tracking-tighter leading-none mb-2">
                    {selectedCard.name}
                  </h2>
                  <div className="h-1 w-20 md:w-40 bg-primary-gold mx-auto md:mx-0" />
                </div>

                {selectedCard.suit !== 'jokers' && (
                  <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-md mx-auto md:mx-0">
                    <div className="bg-surface border border-accent-gray/20 p-6 md:p-8 rounded-2xl flex flex-col items-center md:items-start group hover:border-red-500/50 transition-colors">
                        <span className="text-4xl md:text-6xl font-black text-text-main group-hover:text-red-500 transition-colors">{selectedCard.attack}</span>
                        <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted mt-2">Puntos de Ataque</span>
                    </div>
                    <div className="bg-surface border border-accent-gray/20 p-6 md:p-8 rounded-2xl flex flex-col items-center md:items-start group hover:border-blue-500/50 transition-colors">
                        <span className="text-4xl md:text-6xl font-black text-text-main group-hover:text-blue-500 transition-colors">{selectedCard.health}</span>
                        <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted mt-2">Puntos de Vida</span>
                    </div>
                  </div>
                )}

                {/* Botón de sonido de la carta */}
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); playCardSfx(selectedCard, 0.3); }}
                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-accent-gray/30 rounded-lg text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all group"
                    title="Reproducir sonido de la carta"
                  >
                    <Volume2 size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] uppercase tracking-widest font-bold">Sonido</span>
                  </button>
                </div>

                <div className="relative">
                   <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary-gold/20 hidden md:block" />
                   <p className="text-lg md:text-3xl text-secondary-theme font-light italic leading-relaxed md:pl-4">
                      "{selectedCard.descripcion || selectedCard.effect}"
                   </p>
                </div>

                {/* Botones de Navegación (Móvil) */}
                <div className="flex md:hidden items-center justify-center gap-8 pt-4">
                  <button onClick={handlePrev} className="p-4 bg-surface border border-accent-gray/20 rounded-full text-primary-gold active:bg-primary-gold active:text-bg-main">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={handleNext} className="p-4 bg-surface border border-accent-gray/20 rounded-full text-primary-gold active:bg-primary-gold active:text-bg-main">
                    <ChevronRight size={24} />
                  </button>
                </div>

                <button 
                  onClick={() => setSelectedCard(null)}
                  className="flex items-center gap-3 text-muted hover:text-text-main transition-colors mx-auto md:mx-0 uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold pt-10 cursor-pointer"
                >
                  <X size={20} />
                  Cerrar Visualización
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardGallery;