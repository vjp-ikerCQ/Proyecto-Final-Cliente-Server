import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

/**
 * Componente de selección de idioma con dropdown temático.
 * Se integra con i18next para cambiar el idioma de toda la aplicación.
 */
const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);



  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    setIsOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="p-3 border border-accent-gray bg-panel/50 text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all duration-300 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        title={t('controls.language')}
      >
        <Globe size={20} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-modal border border-accent-gray shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
          {/* Esquinas decorativas */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-primary-gold/30 pointer-events-none" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary-gold/30 pointer-events-none" />

          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest
                transition-all duration-200
                ${lang.code === i18n.language
                  ? 'text-primary-gold bg-primary-gold/10 border-l-2 border-primary-gold'
                  : 'text-secondary-theme hover:text-primary-gold hover:bg-primary-gold/5 border-l-2 border-transparent'
                }
              `}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
