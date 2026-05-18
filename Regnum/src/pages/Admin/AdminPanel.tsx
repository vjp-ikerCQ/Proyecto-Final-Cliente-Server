import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Ticket, Shield, Edit, Trash, Check, LogOut, BookOpen, Settings, X } from 'lucide-react';
import SettingsModal from '../../components/Modal/SettingsModal';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'cards'>('users');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    fetch('http://localhost:5000/api/users')
      .then(res => res.json())
      .then(data => {
        const adaptedUsers = data.map((u: any, index: number) => ({
          id: u._id || index + 1,
          name: u.nombre || u.name,
          role: u.role || (u.nombre === 'admin' ? 'Admin' : 'Jugador'),
          status: 'Activo'
        }));
        setUsers(adaptedUsers);
      })
      .catch(err => console.error("Error al cargar usuarios:", err));
  }, []);

  const handleDeleteUser = async (id: string, name: string) => {
    if (name === 'admin') {
      alert("No puedes eliminar al administrador principal.");
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${name}?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
          setUsers(users.filter(u => String(u.id) !== String(id)));
        } else {
          alert("Error al eliminar el usuario.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const handleSaveName = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editingName })
      });
      const data = await response.json();

      if (data.success) {
        setUsers(users.map(u => String(u.id) === String(id) ? { ...u, name: editingName } : u));
        setEditingUserId(null);
      } else {
        alert("Error al actualizar el nombre.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'tickets') {
      fetch('http://localhost:5000/api/tickets')
        .then(res => res.json())
        .then(data => {
          const adaptedTickets = data.map((t: any, index: number) => ({
            id: t._id || `TK-${index}`,
            user: t.user,
            type: t.type,
            message: t.message,
            status: t.status || 'Abierto'
          }));
          setTickets(adaptedTickets);
        })
        .catch(err => console.error("Error al cargar tickets:", err));
    }
  }, [activeTab]);

  const handleCloseTicket = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cerrado' })
      });
      const data = await response.json();

      if (data.success) {
        setTickets(tickets.map(t => String(t.id) === String(id) ? { ...t, status: 'Cerrado' } : t));
      } else {
        alert("Error al cerrar el ticket.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este ticket?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/tickets/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
          setTickets(tickets.filter(t => String(t.id) !== String(id)));
        } else {
          alert("Error al eliminar el ticket.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-spectral flex relative">
      {/* Fondo decorativo */}
      <div className="fixed top-0 left-0 w-full h-full bg-menu-pattern opacity-5 pointer-events-none" />

      {/* Sidebar */}
      <div className="w-64 bg-panel border-r border-accent-gray/20 flex flex-col z-10">
        <div className="p-6 border-b border-accent-gray/20">
          <h1 className="font-cinzel text-xl font-black text-gold-gradient tracking-wider">REGNUM ADMIN</h1>
          <p className="text-xs text-text-muted font-cinzel uppercase tracking-widest mt-1">Panel de Control</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 font-cinzel text-sm">
          <p className="text-xs text-text-muted uppercase tracking-widest px-4 mb-2">Gestión</p>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'users' ? 'bg-primary-gold/10 text-primary-gold border border-primary-gold/30' : 'text-muted hover:text-text-main hover:bg-surface-hover'}`}
          >
            <Users size={18} /> Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'tickets' ? 'bg-primary-gold/10 text-primary-gold border border-primary-gold/30' : 'text-muted hover:text-text-main hover:bg-surface-hover'}`}
          >
            <Ticket size={18} /> Tickets
          </button>
          <button 
            onClick={() => setActiveTab('cards')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'cards' ? 'bg-primary-gold/10 text-primary-gold border border-primary-gold/30' : 'text-muted hover:text-text-main hover:bg-surface-hover'}`}
          >
            <Shield size={18} /> Cartas
          </button>

          <div className="border-t border-accent-gray/10 my-4" />
          <p className="text-xs text-text-muted uppercase tracking-widest px-4 mb-2">Navegación</p>
          
          <button 
            onClick={() => navigate('/gallery')}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen size={18} /> Galería
          </button>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
          >
            <Settings size={18} /> Ajustes
          </button>
        </nav>

        <div className="p-4 border-t border-accent-gray/20 font-cinzel text-sm">
          <button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center gap-3 px-4 py-3 text-muted hover:text-red-400 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col z-10 overflow-y-auto h-screen">
        {/* Header */}
        <header className="bg-panel border-b border-accent-gray/20 p-6 flex justify-between items-center">
          <div>
            <h2 className="font-cinzel text-2xl font-bold text-text-main">
              {activeTab === 'users' && 'Gestión de Usuarios'}
              {activeTab === 'tickets' && 'Tickets de Soporte'}
              {activeTab === 'cards' && 'Gestión de Cartas'}
            </h2>
            <p className="text-xs text-text-muted uppercase tracking-wider font-cinzel mt-1">
              Dashboard / {activeTab}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">Conectado como <span className="text-primary-gold font-bold">admin</span></span>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 flex-1">
          {activeTab === 'users' && (
            <div className="bg-modal border border-accent-gray/30 rounded-lg p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cinzel text-lg text-gold-gradient">Usuarios Registrados</h3>
                <span className="text-xs text-text-muted uppercase font-cinzel">{users.length} Usuarios</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-accent-gray/20 text-muted font-cinzel text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Nombre</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-accent-gray/10 hover:bg-surface-hover transition-colors">
                        <td className="py-3 px-4 text-muted">{u.id}</td>
                        <td className="py-3 px-4 text-text-main font-bold">
                          {editingUserId === String(u.id) ? (
                            <input 
                              type="text" 
                              value={editingName} 
                              onChange={(e) => setEditingName(e.target.value)}
                              className="bg-panel-secondary border border-primary-gold/50 rounded px-2 py-1 text-text-main focus:outline-none focus:border-primary-gold font-spectral"
                            />
                          ) : (
                            u.name
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'Admin' ? 'bg-primary-gold/20 text-primary-gold' : 'bg-surface-card text-text-muted'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${u.status === 'Activo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          {editingUserId === String(u.id) ? (
                            <>
                              <button 
                                onClick={() => handleSaveName(u.id)}
                                className="p-2 hover:bg-surface-card rounded-full text-green-400 cursor-pointer" 
                                title="Guardar"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => setEditingUserId(null)}
                                className="p-2 hover:bg-surface-card rounded-full text-red-400 cursor-pointer" 
                                title="Cancelar"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingUserId(String(u.id));
                                  setEditingName(u.name);
                                }}
                                className="p-2 hover:bg-surface-card rounded-full text-primary-gold cursor-pointer" 
                                title="Editar"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-2 hover:bg-surface-card rounded-full text-red-400 cursor-pointer" 
                                title="Eliminar"
                              >
                                <Trash size={14} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="bg-modal border border-accent-gray/30 rounded-lg p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cinzel text-lg text-gold-gradient">Tickets Recibidos</h3>
                <span className="text-xs text-text-muted uppercase font-cinzel">{tickets.length} Tickets</span>
              </div>
              <div className="space-y-4">
                {tickets.map(t => (
                  <div key={t.id} className="bg-panel-secondary border border-accent-gray/20 p-4 rounded-lg flex justify-between items-center hover:border-accent-gray/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-cinzel text-primary-gold text-sm font-bold">{t.id}</span>
                        <span className="text-xs bg-surface-card px-2 py-0.5 rounded text-text-muted">{t.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'Abierto' ? 'bg-green-500/20 text-green-400' : 'bg-accent-gray/20 text-text-muted'}`}>{t.status}</span>
                      </div>
                      <p className="text-text-main text-sm mb-1">{t.message}</p>
                      <p className="text-text-muted text-xs">Enviado por: <span className="text-secondary-theme">{t.user}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCloseTicket(t.id)}
                        className="p-2 hover:bg-surface-card rounded-full text-green-400 cursor-pointer" 
                        title="Cerrar Ticket"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTicket(t.id)}
                        className="p-2 hover:bg-surface-card rounded-full text-red-400 cursor-pointer" 
                        title="Eliminar Ticket"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="bg-modal border border-accent-gray/30 rounded-lg p-10 text-center text-muted shadow-2xl">
              <Shield size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-cinzel text-lg mb-2 text-gold-gradient">Gestión de Cartas</p>
              <p className="text-sm max-w-md mx-auto">Esta sección requerirá conectar con tu archivo `cardData.ts` o crear una colección de cartas en MongoDB para poder editarlas dinámicamente.</p>
            </div>
          )}


        </main>
      </div>

      {/* Modal de Ajustes */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
