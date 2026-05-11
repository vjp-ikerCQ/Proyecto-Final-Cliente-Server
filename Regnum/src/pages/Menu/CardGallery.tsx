import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allCards } from '../../utils/cardData';

const suitColors = {
  espadas: '#ff4d4d',
  copas: '#00ccff',
  oros: '#ffcc00',
  bastos: '#00ff66',
};

const CardGallery: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'TODAS' | 'ESPADAS' | 'COPAS' | 'OROS' | 'BASTOS'>('TODAS');

  const filteredCards = activeTab === 'TODAS' 
    ? allCards 
    : allCards.filter(card => card.suit === activeTab.toLowerCase());

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-cinzel relative overflow-y-auto">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full bg-menu-pattern opacity-10 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 flex flex-col items-center mb-16">
        <button 
          onClick={() => navigate('/menu')}
          className="absolute left-0 top-0 flex items-center gap-2 text-gray-500 hover:text-primary-gold transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm uppercase tracking-widest font-cinzel">Volver al Menú</span>
        </button>

        <h1 className="text-5xl md:text-7xl font-black tracking-[0.2em] uppercase text-gold-gradient mb-4 drop-shadow-[0_0_30px_rgba(166,138,100,0.3)]">
          Galería de Cartas
        </h1>
        <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary-gold/30" />
            <p className="text-gray-500 tracking-[0.4em] uppercase text-xs">
              48 cartas únicas de la baraja española
            </p>
            <div className="h-px w-12 bg-primary-gold/30" />
        </div>
      </header>

      {/* Tabs */}
      <nav className="relative z-10 flex justify-center gap-2 mb-16 flex-wrap">
        {['TODAS', 'ESPADAS', 'COPAS', 'OROS', 'BASTOS'].map((tab) => (
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

      {/* Grid */}
      <main className="relative z-10 max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        <AnimatePresence mode='popLayout'>
          {filteredCards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="group relative aspect-[2/3] cursor-pointer"
            >
              {/* Main Card Container */}
              <div 
                className="w-full h-full relative rounded-lg overflow-hidden border bg-[#080808] transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(0,0,0,0.9)] group-hover:-translate-y-2"
                style={{ 
                  borderColor: `${suitColors[card.suit]}33`,
                  boxShadow: `0 0 20px ${suitColors[card.suit]}11`
                }}
              >
                {/* Internal suit glow on hover */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"
                    style={{ 
                        background: `radial-gradient(circle at center, ${suitColors[card.suit]}05 0%, transparent 70%)`,
                        boxShadow: `inset 0 0 30px ${suitColors[card.suit]}22`
                    }}
                />
                {/* Full Card Image Placeholder */}
                <div className="absolute inset-0 w-full h-full bg-[#111] overflow-hidden">
                  {card.image ? (
                    <img 
                      src={card.image} 
                      alt={card.name} 
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      onLoad={(e) => (e.target as HTMLImageElement).classList.add('opacity-100')}
                      onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                  {/* Subtle placeholder content if no image */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
                    <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-cinzel">
                      {card.role}
                    </span>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4" />
                  </div>
                </div>

                {/* Top Left: Cost Bubble */}
                <div className="absolute top-2 left-2 z-20">
                  <div 
                    className="w-10 h-10 rounded-full bg-black/90 backdrop-blur-md flex items-center justify-center border-2 shadow-2xl transition-all duration-300 group-hover:scale-110"
                    style={{ borderColor: suitColors[card.suit] }}
                  >
                    <span className="text-lg font-bold font-spectral" style={{ color: suitColors[card.suit] }}>
                      {card.cost}
                    </span>
                  </div>
                </div>

                {/* Top Right: Rank Number */}
                <div className="absolute top-2 right-2 z-20">
                  <div 
                    className="px-2 py-1 rounded-sm bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors"
                  >
                    Nº {card.rank}
                  </div>
                </div>

                {/* Hover Info Overlay (Subtle) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-5">
                    <div className="mb-2">
                        <p className="text-[11px] text-primary-gold uppercase tracking-widest font-bold mb-1">
                            {card.name}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-tighter">
                            {card.attackType} • ATK: {card.attack} • HP: {card.health}
                        </p>
                    </div>
                    <p className="text-[9px] text-gray-300 italic leading-snug border-t border-white/10 pt-2">
                        {card.effect}
                    </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CardGallery;
