import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allCards, type CardData } from '../../utils/cardData';

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
 * Componente de la Galería de Cartas.
 * Permite visualizar y filtrar las 48 cartas de la baraja española.
 */
const CardGallery: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'TODAS' | 'ESPADAS' | 'COPAS' | 'OROS' | 'BASTOS' | 'JOKERS'>('TODAS');
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  const filteredCards = activeTab === 'TODAS' 
    ? allCards 
    : allCards.filter(card => card.suit === activeTab.toLowerCase());

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-cinzel relative overflow-y-auto">
      {/* Decoración de fondo fija para mantener la atmósfera */}
      <div className="fixed top-0 left-0 w-full h-full bg-menu-pattern opacity-10 pointer-events-none" />
      
      {/* Cabecera de la Galería */}
      <header className="relative z-10 flex flex-col items-center mb-10 md:mb-16 px-4">
        <button 
          onClick={() => navigate('/menu')}
          className="self-start md:absolute md:left-0 md:top-0 flex items-center gap-2 text-gray-500 hover:text-primary-gold transition-colors group mb-6 md:mb-0"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] md:text-sm uppercase tracking-widest font-cinzel">Volver</span>
        </button>

        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-[0.1em] md:tracking-[0.2em] uppercase text-gold-gradient mb-4 drop-shadow-[0_0_30px_rgba(166,138,100,0.3)] text-center">
          Galería de Cartas
        </h1>
        <div className="flex items-center gap-3 md:gap-4">
            <div className="h-px w-8 md:w-12 bg-primary-gold/30" />
            <p className="text-gray-500 tracking-[0.2em] md:tracking-[0.4em] uppercase text-[8px] md:text-xs text-center">
              La colección completa de Regnum
            </p>
            <div className="h-px w-8 md:w-12 bg-primary-gold/30" />
        </div>
      </header>

      {/* Navegación por pestañas (Filtros por palo) */}
      <nav className="relative z-10 flex justify-center gap-2 mb-16 flex-wrap">
        {['TODAS', 'ESPADAS', 'COPAS', 'OROS', 'BASTOS', 'JOKERS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`
              relative px-10 py-3 text-xs tracking-widest uppercase transition-all duration-500
              ${activeTab === tab 
                ? 'text-primary-gold' 
                : 'text-gray-500 hover:text-gray-300'}
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

      {/* Cuadrícula de Cartas */}
      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6 px-2 md:px-0 pb-20">
        <AnimatePresence mode='popLayout'>
          {filteredCards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative aspect-[2/3] cursor-pointer"
              onClick={() => setSelectedCard(card)}
            >
              {/* Contenedor principal de la carta */}
              <div 
                className="w-full h-full relative rounded-md md:rounded-lg overflow-hidden border bg-[#080808] transition-all duration-500 group-hover:-translate-y-2"
                style={{ 
                  borderColor: `${suitColors[card.suit]}33`,
                  boxShadow: `0 0 15px ${suitColors[card.suit]}05`
                }}
              >
                <div className="absolute inset-0 w-full h-full bg-[#111] overflow-hidden">
                  {card.image && (
                    <img 
                      src={card.image} 
                      alt={card.name} 
                      className="w-full h-full object-cover transition-all duration-700"
                    />
                  )}
                </div>

                {/* Capa de información (Visible en hover en escritorio) */}
                <div className="absolute inset-0 bg-black/85 backdrop-blur-[3px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col p-3 md:p-5 overflow-y-auto scrollbar-hide">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-6 md:w-10 h-px bg-white/20 mb-2" />
                        <span className="text-[8px] md:text-[12px] uppercase tracking-[0.2em] md:tracking-[0.4em] text-white/50 font-cinzel">
                            {card.role}
                        </span>
                        <div className="w-6 md:w-10 h-px bg-white/20 mt-2" />
                    </div>

                    <div className="mt-auto">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] md:text-[11px] text-white/70 uppercase">
                                ATK: {card.attack}
                            </span>
                            <span className="text-[8px] md:text-[11px] text-white/70 uppercase">
                                HP: {card.health}
                            </span>
                        </div>
                        <div className="border-t border-white/10 pt-2">
                            <p className="text-[7px] md:text-[10px] text-gray-400 italic leading-tight">
                                {card.effect}
                            </p>
                        </div>
                    </div>
                </div>
              </div>

              {/* Burbuja de Coste */}
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 z-30">
                <div 
                  className="w-6 h-6 md:w-9 md:h-9 rounded-full bg-black/95 backdrop-blur-md flex items-center justify-center border md:border-2 shadow-2xl"
                  style={{ borderColor: suitColors[card.suit] }}
                >
                  <span className="text-[10px] md:text-base font-bold" style={{ color: suitColors[card.suit] }}>
                    {card.cost}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* VISTA DETALLADA (MODAL) */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="max-w-5xl w-full flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start" 
              onClick={e => e.stopPropagation()}
            >
              {/* Carta en Grande - Ajuste fino de escala (-10px adicionales) */}
              <div className="w-full max-w-[235px] sm:max-w-[335px] md:max-w-[405px] lg:max-w-[465px] aspect-[2/3] relative shrink-0">
                <div 
                  className="w-full h-full rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative border-2"
                  style={{ borderColor: `${suitColors[selectedCard.suit]}44` }}
                >
                  <img src={selectedCard.image} className="w-full h-full object-cover bg-black" alt={selectedCard.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                </div>
              </div>

              {/* Información Detallada */}
              <div className="flex-1 space-y-6 md:space-y-10 text-center md:text-left py-4 md:py-10">
                <div className="relative">
                  <span className="text-[8px] md:text-[10px] uppercase tracking-[0.5em] text-primary-gold mb-1 block font-spectral font-black">
                    {selectedCard.suit} / {selectedCard.role}
                  </span>
                  <h2 className="text-2xl sm:text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                    {selectedCard.name}
                  </h2>
                  <div className="h-1 w-20 md:w-40 bg-primary-gold mx-auto md:mx-0" />
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-md mx-auto md:mx-0">
                  <div className="bg-white/[0.03] border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col items-center md:items-start group hover:border-red-500/50 transition-colors">
                      <span className="text-4xl md:text-6xl font-black text-white group-hover:text-red-500 transition-colors">{selectedCard.attack}</span>
                      <span className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mt-2">Puntos de Ataque</span>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col items-center md:items-start group hover:border-blue-500/50 transition-colors">
                      <span className="text-4xl md:text-6xl font-black text-white group-hover:text-blue-500 transition-colors">{selectedCard.health}</span>
                      <span className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mt-2">Puntos de Vida</span>
                  </div>
                </div>

                <div className="relative">
                   <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary-gold/20 hidden md:block" />
                   <p className="text-lg md:text-3xl text-gray-300 font-light italic leading-relaxed md:pl-4">
                      "{selectedCard.effect}"
                   </p>
                </div>

                <button 
                  onClick={() => setSelectedCard(null)}
                  className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors mx-auto md:mx-0 uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold pt-10"
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
