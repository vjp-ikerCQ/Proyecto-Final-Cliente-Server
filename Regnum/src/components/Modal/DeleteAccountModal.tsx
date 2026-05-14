import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Lock, Trash2 } from 'lucide-react';
import { deleteAccount } from '../../services/userService';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, username }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Debes introducir tu contraseña para confirmar');
      return;
    }

    setLoading(true);
    try {
      const result = await deleteAccount(username, password);
      if (result.success) {
        // Redireccionar al inicio / logout
        window.location.href = '/';
      } else {
        setError(result.message || 'Error al eliminar la cuenta');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#121214] border border-red-900/50 p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6 text-red-500">
              <AlertTriangle size={32} />
              <h2 className="text-2xl font-cinzel tracking-widest uppercase">Zona de Peligro</h2>
            </div>

            <p className="text-gray-400 font-spectral mb-6 text-lg">
              Estás a punto de eliminar la cuenta de <span className="text-white font-bold">{username}</span>. 
              Esta acción es permanente y perderás todo tu progreso en el reino.
            </p>

            <form onSubmit={handleDelete} className="space-y-6">
              {error && (
                <div className="bg-red-900/40 border border-red-500/50 p-3 text-red-200 text-[10px] uppercase tracking-widest text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                  Confirmar con contraseña
                </label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña secreta..."
                    className="w-full bg-black/50 border border-red-900/30 py-3 pl-10 pr-4 text-xs focus:border-red-500 focus:outline-none transition-all text-white"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-accent-gray text-gray-500 py-3 font-cinzel text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 font-cinzel text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Eliminando...' : (
                    <>
                      <Trash2 size={14} />
                      Eliminar Cuenta
                    </>
                  )}
                </button>
              </div>
            </form>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountModal;
