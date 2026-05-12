import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { allCards } from '../../utils/cardData';

/**
 * Colores representativos para cada palo de la baraja
 */
const suitColors = {
  espadas: '#ff4d4d',
  copas: '#00ccff',
  oros: '#ffcc00',
  bastos: '#00ff66',
};

/**
 * Componente de la Galería de Cartas.
 * Permite visualizar y filtrar las 48 cartas de la baraja española.
 */
const CardGallery: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'TODAS' | 'ESPADAS' | 'COPAS' | 'OROS' | 'BASTOS'>('TODAS');

  const filteredCards = activeTab === 'TODAS' 
    ? allCards 
    : allCards.filter(card => card.suit === activeTab.toLowerCase());

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-cinzel relative overflow-y-auto">
      {/* Decoración de fondo fija para mantener la atmósfera */}
      <div className="fixed top-0 left-0 w-full h-full bg-menu-pattern opacity-10 pointer-events-none" />
      
      {/* Cabecera de la Galería */}
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

      {/* Navegación por pestañas (Filtros por palo) */}
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

      {/* Cuadrícula de Cartas */}
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
              {/* Contenedor principal de la carta */}
              <div 
                className="w-full h-full relative rounded-lg overflow-hidden border bg-[#080808] transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(0,0,0,0.9)] group-hover:-translate-y-2"
                style={{ 
                  borderColor: `${suitColors[card.suit]}33`,
                  boxShadow: `0 0 20px ${suitColors[card.suit]}11`
                }}
              >
                {/* Resplandor interno sutil */}
                <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none z-10"
                    style={{ 
                        background: `radial-gradient(circle at 50% 50%, ${suitColors[card.suit]}05 0%, transparent 70%)`,
                        boxShadow: `inset 0 0 20px ${suitColors[card.suit]}11`
                    }}
                />
                {/* Marcador de posición para la imagen completa de la carta */}
                <div className="absolute inset-0 w-full h-full bg-[#111] overflow-hidden">
                  {card.image ? (
                    <img 
                      src={card.image} 
                      alt={card.name} 
                      className="w-full h-full object-cover transition-all duration-700"
                      onLoad={(e) => (e.target as HTMLImageElement).classList.add('opacity-100')}
                      onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  
                </div>


                {/* Capa de información al pasar el ratón (Detalles de la carta) */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col p-6">
                    {/* Nombre/Rol central */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-16 h-px bg-primary-gold/30 mb-4" />
                        <span className="text-[12px] uppercase tracking-[0.4em] text-white/50 font-cinzel">
                            {card.role}
                        </span>
                        <div className="w-16 h-px bg-primary-gold/30 mt-4" />
                    </div>

                    {/* Detalles inferiores mejorados */}
                    <div className="mb-3">
                        <p className="text-[14px] text-primary-gold uppercase tracking-widest font-bold mb-1 drop-shadow-md">
                            {card.name}
                        </p>
                        <p className="text-[11px] text-white/90 uppercase tracking-tighter font-medium">
                            {card.attackType} • ATK: {card.attack} • HP: {card.health}
                        </p>
                    </div>
                    <p className="text-[11px] text-gray-200 italic leading-relaxed border-t border-white/20 pt-3">
                        {card.effect}
                    </p>
                </div>
              </div>

              {/* Arriba Derecha: Burbuja de Coste de Voluntad (Sobresaliendo) */}
              <div className="absolute -top-2 -right-2 z-30 transition-all duration-500 group-hover:-translate-y-2">
                <div 
                  className="w-9 h-9 rounded-full bg-black/95 backdrop-blur-md flex items-center justify-center border-2 shadow-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ 
                    borderColor: suitColors[card.suit],
                    boxShadow: `0 0 15px ${suitColors[card.suit]}44`
                  }}
                >
                  <span className="text-base font-bold font-spectral" style={{ color: suitColors[card.suit] }}>
                    {card.cost}
                  </span>
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
