import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Ticket, Shield, Edit, Trash, Check, LogOut, BookOpen, Settings, X } from 'lucide-react';
import SettingsModal from '../../components/Modal/SettingsModal';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'tickets' | 'cards'>('users');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'alert';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {}
  });

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  const showAlert = (title: string, message: string) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => {}
    });
  };

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
          status: u.status || 'Activo'
        }));
        setUsers(adaptedUsers);
      })
      .catch(err => console.error("Error al cargar usuarios:", err));
  }, []);

  const handleDeleteUser = (id: string, name: string) => {
    if (name === 'admin') {
      showAlert("Atención", "No puedes eliminar al administrador principal.");
      return;
    }

    askConfirmation(
      "Eliminar Usuario",
      `¿Estás seguro de que quieres eliminar al usuario ${name}?`,
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/users/${id}`, {
            method: 'DELETE'
          });
          const data = await response.json();

          if (data.success) {
            setUsers(users.filter(u => String(u.id) !== String(id)));
          } else {
            showAlert("Error", "Error al eliminar el usuario.");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    );
  };

  const handleSaveName = (id: string) => {
    askConfirmation(
      "Guardar Cambios",
      "¿Estás seguro de que quieres cambiar el nombre de este usuario?",
      async () => {
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
            showAlert("Error", "Error al actualizar el nombre.");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    );
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Activo' ? 'Baneado' : 'Activo';
    askConfirmation(
      "Cambiar Estado",
      `¿Estás seguro de que quieres cambiar el estado de este usuario a ${newStatus}?`,
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          const data = await response.json();

          if (data.success) {
            setUsers(users.map(u => String(u.id) === String(id) ? { ...u, status: newStatus } : u));
          } else {
            showAlert("Error", "Error al actualizar el estado.");
          }
        } catch (error) {
          console.error("Error:", error);
          showAlert("Error", "Error al actualizar el estado.");
        }
      }
    );
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

  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'cards') {
      fetch('http://localhost:5000/api/cards')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCards(data.cards);
          }
        })
        .catch(err => console.error("Error al cargar cartas:", err));
    }
  }, [activeTab]);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingAttack, setEditingAttack] = useState(0);
  const [editingHealth, setEditingHealth] = useState(0);
  const [editingEffect, setEditingEffect] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const handleSaveCard = (id: string) => {
    askConfirmation(
      "Guardar Cambios",
      "¿Estás seguro de que quieres guardar los cambios en esta carta?",
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/cards/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              "habilidad.cantidad": editingAttack,
              "vida": editingHealth,
              "habilidad.efecto": editingEffect,
              "descripcion": editingDescription
            })
          });
          const data = await response.json();

          if (data.success) {
            setCards(cards.map(c => String(c.id) === String(id) ? { 
              ...c, 
              attack: editingAttack, 
              health: editingHealth, 
              effect: editingEffect,
              descripcion: editingDescription
            } : c));
            setEditingCardId(null);
          } else {
            showAlert("Error", "Error al actualizar la carta.");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    );
  };

  const [sortField, setSortField] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedCards = sortField ? [...cards].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'attack' || sortField === 'health') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else {
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  }) : cards;

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
        showAlert("Error", "Error al cerrar el ticket.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteTicket = (id: string) => {
    askConfirmation(
      "Eliminar Ticket",
      "¿Estás seguro de que quieres eliminar este ticket?",
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/tickets/${id}`, {
            method: 'DELETE'
          });
          const data = await response.json();

          if (data.success) {
            setTickets(tickets.filter(t => String(t.id) !== String(id)));
          } else {
            showAlert("Error", "Error al eliminar el ticket.");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-spectral flex relative">
      {/* Fondo decorativo */}
      <div className="fixed top-0 left-0 w-full h-full bg-menu-pattern opacity-5 pointer-events-none" />

      {/* Sidebar */}
      <div className="w-16 hover:w-64 bg-panel border-r border-accent-gray/20 flex flex-col z-10 transition-all duration-300 group overflow-hidden">
        <div className="p-6 border-b border-accent-gray/20 whitespace-nowrap flex justify-center group-hover:justify-start">
          {/* Mostramos una versión reducida del logo cuando está encogido */}
          <h1 className="font-cinzel text-xl font-black text-gold-gradient tracking-wider group-hover:hidden">RH</h1>
          <h1 className="font-cinzel text-xl font-black text-gold-gradient tracking-wider hidden group-hover:block">REGNUM ADMIN</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 font-cinzel text-sm">
          <p className="text-[8px] group-hover:text-xs text-text-muted uppercase tracking-tight group-hover:tracking-widest text-center group-hover:text-left px-0 group-hover:px-4 mb-2 whitespace-nowrap transition-all duration-300">Gestión</p>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center justify-center group-hover:justify-start gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'users' ? 'bg-primary-gold/10 text-primary-gold border border-primary-gold/30' : 'text-muted hover:text-text-main hover:bg-surface-hover'}`}
          >
            <Users size={18} className="flex-shrink-0" /> <span className="hidden group-hover:inline">Usuarios</span>
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center justify-center group-hover:justify-start gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'tickets' ? 'bg-primary-gold/10 text-primary-gold border border-primary-gold/30' : 'text-muted hover:text-text-main hover:bg-surface-hover'}`}
          >
            <Ticket size={18} className="flex-shrink-0" /> <span className="hidden group-hover:inline">Tickets</span>
          </button>
          <button 
            onClick={() => setActiveTab('cards')}
            className={`w-full flex items-center justify-center group-hover:justify-start gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'cards' ? 'bg-primary-gold/10 text-primary-gold border border-primary-gold/30' : 'text-muted hover:text-text-main hover:bg-surface-hover'}`}
          >
            <Shield size={18} className="flex-shrink-0" /> <span className="hidden group-hover:inline">Cartas</span>
          </button>

          <div className="border-t border-accent-gray/10 my-4" />
          <p className="text-[10px] group-hover:text-xs text-text-muted uppercase tracking-tight group-hover:tracking-widest text-center group-hover:text-left px-0 group-hover:px-4 mb-2 whitespace-nowrap transition-all duration-300">Menú</p>
          
          <button 
            onClick={() => navigate('/gallery')}
            className="w-full flex items-center justify-center group-hover:justify-start gap-3 px-4 py-3 text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookOpen size={18} className="flex-shrink-0" /> <span className="hidden group-hover:inline">Galería</span>
          </button>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center group-hover:justify-start gap-3 px-4 py-3 text-muted hover:text-text-main hover:bg-surface-hover rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Settings size={18} className="flex-shrink-0" /> <span className="hidden group-hover:inline">Ajustes</span>
          </button>
        </nav>

        <div className="p-4 border-t border-accent-gray/20 font-cinzel text-sm">
          <button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center group-hover:justify-start gap-3 px-4 py-3 text-muted hover:text-red-400 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut size={18} className="flex-shrink-0" /> <span className="hidden group-hover:inline">Cerrar Sesión</span>
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
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`text-xs px-2 py-1 rounded-full cursor-pointer transition-colors ${u.status === 'Activo' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                            title={u.status === 'Activo' ? "Banear usuario" : "Activar usuario"}
                          >
                            {u.status}
                          </button>
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
            <div className="bg-modal border border-accent-gray/30 rounded-lg p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="font-cinzel text-lg text-gold-gradient">Cartas en el Juego</h3>
                  {sortField && (
                    <button 
                      onClick={() => setSortField('')}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer flex items-center gap-1"
                      title="Restablecer orden original"
                    >
                      <X size={12} /> Quitar Filtro
                    </button>
                  )}
                </div>
                <span className="text-xs text-text-muted uppercase font-cinzel">{cards.length} Cartas</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-accent-gray/20 text-muted font-cinzel text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                        Nombre {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('suit')}>
                        Palo {sortField === 'suit' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('attack')}>
                        Ataque {sortField === 'attack' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('health')}>
                        Vida {sortField === 'health' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('effect')}>
                        Efecto {sortField === 'effect' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('descripcion')}>
                        Descripción {sortField === 'descripcion' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="py-3 px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCards.map(c => (
                      <tr key={c._id || c.id} className="border-b border-accent-gray/10 hover:bg-surface-hover transition-colors">
                        <td className="py-3 px-4 text-text-main font-bold">{c.name}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full bg-surface-card text-text-muted`}>
                            {c.suit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-primary-gold font-bold">
                          {editingCardId === String(c.id) ? (
                            <input 
                              type="number" 
                              value={editingAttack} 
                              onChange={(e) => setEditingAttack(parseInt(e.target.value))}
                              className="w-16 bg-panel-secondary border border-primary-gold/50 rounded px-2 py-1 text-text-main focus:outline-none focus:border-primary-gold font-spectral"
                            />
                          ) : (
                            c.attack
                          )}
                        </td>
                        <td className="py-3 px-4 text-green-400 font-bold">
                          {editingCardId === String(c.id) ? (
                            <input 
                              type="number" 
                              value={editingHealth} 
                              onChange={(e) => setEditingHealth(parseInt(e.target.value))}
                              className="w-16 bg-panel-secondary border border-primary-gold/50 rounded px-2 py-1 text-text-main focus:outline-none focus:border-primary-gold font-spectral"
                            />
                          ) : (
                            c.health
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted text-sm max-w-xs">
                          {editingCardId === String(c.id) ? (
                            <textarea 
                              value={editingEffect} 
                              onChange={(e) => setEditingEffect(e.target.value)}
                              className="w-full bg-panel-secondary border border-primary-gold/50 rounded px-2 py-1 text-text-main focus:outline-none focus:border-primary-gold font-spectral h-12 resize-none"
                            />
                          ) : (
                            <span className="truncate block">{c.effect}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted text-sm max-w-xs">
                          {editingCardId === String(c.id) ? (
                            <textarea 
                              value={editingDescription} 
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="w-full bg-panel-secondary border border-primary-gold/50 rounded px-2 py-1 text-text-main focus:outline-none focus:border-primary-gold font-spectral h-12 resize-none"
                              placeholder="Sin descripción"
                            />
                          ) : (
                            <span className="truncate block">{c.descripcion || "Sin descripción"}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          {editingCardId === String(c.id) ? (
                            <>
                              <button 
                                onClick={() => handleSaveCard(c.id)}
                                className="p-2 hover:bg-surface-card rounded-full text-green-400 cursor-pointer" 
                                title="Guardar"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => setEditingCardId(null)}
                                className="p-2 hover:bg-surface-card rounded-full text-red-400 cursor-pointer" 
                                title="Cancelar"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingCardId(String(c.id));
                                setEditingAttack(c.attack);
                                setEditingHealth(c.health);
                                setEditingEffect(c.effect);
                                setEditingDescription(c.descripcion || "");
                              }}
                              className="p-2 hover:bg-surface-card rounded-full text-primary-gold cursor-pointer" 
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


        </main>
      </div>

      {/* Modal de Confirmación / Alerta */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-modal border border-accent-gray/30 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-cinzel text-lg text-gold-gradient mb-2">{confirmModal.title}</h3>
            <p className="text-text-muted text-sm mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              {confirmModal.type === 'confirm' && (
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="px-4 py-2 bg-surface-card hover:bg-surface-hover rounded-md text-text-muted transition-colors cursor-pointer font-spectral"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-2 bg-primary-gold/20 hover:bg-primary-gold/30 border border-primary-gold/50 rounded-md text-primary-gold transition-colors cursor-pointer font-spectral"
              >
                {confirmModal.type === 'alert' ? 'Entendido' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ajustes */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
