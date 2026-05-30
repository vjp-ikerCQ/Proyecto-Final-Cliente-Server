import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Ticket, Shield, Edit, Trash, Check, LogOut, BookOpen, Settings, X, Search, TrendingUp } from 'lucide-react';
import SettingsModal from '../../components/Modal/SettingsModal';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tickets' | 'cards'>('dashboard');
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
  const [tickets, setTickets] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  // Buscador de usuarios, cartas y Audit Logs
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  const addAuditLog = (message: string) => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAuditLogs(prev => [`[${time}] ${message}`, ...prev]);
  };

  // Unified loader to fetch all metrics and data on mount
  useEffect(() => {
    // Cargar usuarios
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

    // Cargar tickets
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

    // Cargar cartas
    fetch('http://localhost:5000/api/cards')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCards(data.cards);
        }
      })
      .catch(err => console.error("Error al cargar cartas:", err));
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
            addAuditLog(`El usuario "${name}" fue desterrado del reino.`);
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
            addAuditLog(`El usuario (ID: ${id}) cambió su decreto a "${editingName}".`);
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
            addAuditLog(`El estado de (ID: ${id}) fue proclamado como "${newStatus}".`);
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

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingAttack, setEditingAttack] = useState(0);
  const [editingHealth, setEditingHealth] = useState(0);
  const [editingCost, setEditingCost] = useState(0);
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
              "habilidad.voluntad": editingCost,
              "descripcion": editingDescription
            })
          });
          const data = await response.json();

          if (data.success) {
            const cardName = cards.find(c => String(c.id) === String(id))?.name || "Carta Desconocida";
            setCards(cards.map(c => String(c.id) === String(id) ? {
              ...c,
              attack: editingAttack,
              health: editingHealth,
              cost: editingCost,
              descripcion: editingDescription
            } : c));
            setEditingCardId(null);
            addAuditLog(`Modificada la carta '${cardName}' (ATK: ${editingAttack}, HP: ${editingHealth}, Coste: ${editingCost}).`);
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

  const filteredCards = cards.filter(c => 
    c.name?.toLowerCase().includes(cardSearchQuery.toLowerCase())
  );

  const sortedCards = sortField ? [...filteredCards].sort((a, b) => {
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
  }) : filteredCards;

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
        addAuditLog(`Ticket de soporte #${id} fue resuelto y cerrado.`);
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
            addAuditLog(`Ticket de soporte #${id} fue eliminado permanentemente.`);
          } else {
            showAlert("Error", "Error al eliminar el ticket.");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    );
  };

  const handleAcceptAppeal = async (ticketId: string, username: string) => {
    const foundUser = users.find(u => u.name.toLowerCase() === username.toLowerCase());
    
    if (!foundUser) {
      showAlert("Error", `No se encontró al usuario "${username}" en la base de datos.`);
      return;
    }

    askConfirmation(
      "Aceptar Apelación",
      `¿Estás seguro de que quieres ACEPTAR la apelación de "${username}" y desbanear su cuenta?`,
      async () => {
        try {
          // 1. Cambiar el estado del usuario a 'Activo'
          const userRes = await fetch(`http://localhost:5000/api/users/${foundUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Activo' })
          });
          const userData = await userRes.json();

          if (!userData.success) {
            showAlert("Error", "No se pudo actualizar el estado del usuario.");
            return;
          }

          // 2. Cambiar el estado del ticket a 'Aceptado'
          const ticketRes = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Aceptado' })
          });
          const ticketData = await ticketRes.json();

          if (ticketData.success) {
            // Actualizar usuarios localmente
            setUsers(users.map(u => String(u.id) === String(foundUser.id) ? { ...u, status: 'Activo' } : u));
            // Actualizar tickets localmente
            setTickets(tickets.map(t => String(t.id) === String(ticketId) ? { ...t, status: 'Aceptado' } : t));
            addAuditLog(`Apelación aprobada para "${username}". El reo ha sido absuelto.`);
          } else {
            showAlert("Error", "Error al actualizar el estado del ticket.");
          }
        } catch (error) {
          console.error("Error al aceptar apelación:", error);
          showAlert("Error", "Ocurrió un error en el servidor.");
        }
      }
    );
  };

  const handleRejectAppeal = async (ticketId: string, username: string) => {
    askConfirmation(
      "Rechazar Apelación",
      `¿Estás seguro de que quieres RECHAZAR la apelación de "${username}"? Su cuenta permanecerá baneada.`,
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Rechazado' })
          });
          const data = await response.json();

          if (data.success) {
            setTickets(tickets.map(t => String(t.id) === String(ticketId) ? { ...t, status: 'Rechazado' } : t));
            addAuditLog(`Apelación denegada para "${username}". Permanecerá encadenado.`);
          } else {
            showAlert("Error", "Error al rechazar la apelación.");
          }
        } catch (error) {
          console.error("Error al rechazar apelación:", error);
          showAlert("Error", "Ocurrió un error en el servidor.");
        }
      }
    );
  };

  const getSuitCount = (suit: string) => cards.filter(c => c.suit?.toLowerCase() === suit.toLowerCase()).length;
  const lastUser = users.length > 0 ? users[users.length - 1].name : "Ninguno";
  const bannedCount = users.filter(u => u.status === 'Baneado').length;
  const openTicketsCount = tickets.filter(t => t.status === 'Abierto').length;
  const totalTickets = tickets.length;
  const openTicketsRatio = totalTickets > 0 ? Math.round((openTicketsCount / totalTickets) * 100) : 0;

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

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
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-center group-hover:justify-start gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-primary-gold/10 text-primary-gold border border-primary-gold/30' : 'text-muted hover:text-text-main hover:bg-surface-hover'}`}
          >
            <TrendingUp size={18} className="flex-shrink-0" /> <span className="hidden group-hover:inline">Métricas</span>
          </button>
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
              {activeTab === 'dashboard' && 'Métricas y Estadísticas del Reino'}
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
        <main className="p-8 flex-1 flex flex-col justify-between min-h-0">
          <div>
            {activeTab === 'dashboard' && (
              <>
                {/* Dashboard de Métricas y Estadísticas Generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Tarjeta 1: Usuarios */}
                  <div className="bg-modal border border-accent-gray/20 rounded-lg p-5 relative overflow-hidden group shadow-lg">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-primary-gold group-hover:scale-110 transition-transform">
                      <Users size={48} />
                    </div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-cinzel">Habitantes del Reino</p>
                    <p className="text-2xl font-cinzel text-primary-gold font-black mt-1">{users.length}</p>
                    <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-400 font-bold">{bannedCount}</span> Baneados / Desterrados
                    </p>
                  </div>

                  {/* Tarjeta 2: Tickets */}
                  <div className="bg-modal border border-accent-gray/20 rounded-lg p-5 relative overflow-hidden group shadow-lg">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-primary-gold group-hover:scale-110 transition-transform">
                      <Ticket size={48} />
                    </div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-cinzel">Peticiones de Soporte</p>
                    <p className="text-2xl font-cinzel text-primary-gold font-black mt-1">{totalTickets}</p>
                    <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-400 font-bold">{openTicketsCount}</span> Abiertos ({openTicketsRatio}% de carga)
                    </p>
                  </div>

                  {/* Tarjeta 3: Último usuario */}
                  <div className="bg-modal border border-accent-gray/20 rounded-lg p-5 relative overflow-hidden group shadow-lg">
                    <div className="absolute top-0 right-0 p-3 opacity-10 text-primary-gold group-hover:scale-110 transition-transform">
                      <Shield size={48} />
                    </div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-cinzel">Último Aliado Registrado</p>
                    <p className="text-sm font-cinzel text-gold-gradient font-black mt-2 truncate">"{lastUser}"</p>
                    <p className="text-[10px] text-text-muted mt-2">Bienvenido a Regnum Hollow</p>
                  </div>

                  {/* Tarjeta 4: Distribución de Cartas */}
                  <div className="bg-modal border border-accent-gray/20 rounded-lg p-5 relative overflow-hidden group shadow-lg flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-cinzel font-bold">Distribución de Cartas</p>
                      <div className="flex h-2 rounded-full overflow-hidden w-full bg-white/5 mt-2">
                        <div style={{ width: `${cards.length > 0 ? (getSuitCount('espadas') / cards.length) * 100 : 20}%` }} className="bg-red-500/80" title={`Espadas: ${getSuitCount('espadas')}`} />
                        <div style={{ width: `${cards.length > 0 ? (getSuitCount('copas') / cards.length) * 100 : 20}%` }} className="bg-cyan-500/80" title={`Copas: ${getSuitCount('copas')}`} />
                        <div style={{ width: `${cards.length > 0 ? (getSuitCount('oros') / cards.length) * 100 : 20}%` }} className="bg-yellow-500/80" title={`Oros: ${getSuitCount('oros')}`} />
                        <div style={{ width: `${cards.length > 0 ? (getSuitCount('bastos') / cards.length) * 100 : 20}%` }} className="bg-emerald-500/80" title={`Bastos: ${getSuitCount('bastos')}`} />
                        <div style={{ width: `${cards.length > 0 ? (getSuitCount('jokers') / cards.length) * 100 : 20}%` }} className="bg-purple-500/80" title={`Jokers: ${getSuitCount('jokers')}`} />
                      </div>
                    </div>
                    <div className="flex justify-between text-[8px] text-text-muted mt-2 font-mono whitespace-nowrap">
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />🗡️{getSuitCount('espadas')}</span>
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />🏆{getSuitCount('copas')}</span>
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />🪙{getSuitCount('oros')}</span>
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />🌿{getSuitCount('bastos')}</span>
                      <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />🃏{getSuitCount('jokers')}</span>
                    </div>
                  </div>
                </div>

                {/* Terminal de Auditoría Rápida */}
                <div className="bg-[#18120a] border border-[#a68a64]/30 rounded-lg p-5 shadow-2xl relative overflow-hidden mb-8">
                  <div className="absolute inset-0 bg-menu-pattern opacity-[0.03] pointer-events-none" />
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary-gold/40" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary-gold/40" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary-gold/40" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary-gold/40" />
                  
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-cinzel text-[10px] text-primary-gold uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Terminal de Auditoría Real
                    </h3>
                    <button 
                      onClick={() => setAuditLogs([])} 
                      className="text-[10px] text-text-muted hover:text-red-400 transition-colors uppercase tracking-wider font-cinzel cursor-pointer"
                    >
                      Limpiar Pergamino
                    </button>
                  </div>
                  
                  <div className="bg-black/40 border border-accent-gray/10 rounded p-3 h-48 overflow-y-auto font-mono text-xs text-[#a68a64] space-y-1.5 custom-scrollbar">
                    {auditLogs.length === 0 ? (
                      <p className="text-text-muted italic text-[11px]">Esperando decretos reales en esta sesión...</p>
                    ) : (
                      auditLogs.map((log, index) => (
                        <p key={index} className="leading-relaxed whitespace-pre-wrap font-spectral">
                          <span className="text-primary-gold/60 font-mono text-[10px] mr-1.5">{log.substring(0, 10)}</span>
                          <span className="text-text-main/85">{log.substring(10)}</span>
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <div className="bg-modal border border-accent-gray/30 rounded-lg p-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h3 className="font-cinzel text-lg text-gold-gradient">Usuarios Registrados</h3>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <input 
                        type="text" 
                        placeholder="Buscar por nombre..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full bg-panel-secondary border border-accent-gray/30 text-text-main p-2 pl-8 pr-4 rounded focus:outline-none focus:border-primary-gold font-spectral text-xs transition-colors"
                      />
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    </div>
                    <span className="text-xs text-text-muted uppercase font-cinzel whitespace-nowrap">{filteredUsers.length} de {users.length} Usuarios</span>
                  </div>
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
                      {filteredUsers.map(u => (
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
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          t.status === 'Abierto' ? 'bg-green-500/20 text-green-400' :
                          t.status === 'Aceptado' ? 'bg-blue-500/20 text-blue-400' :
                          t.status === 'Rechazado' ? 'bg-red-500/20 text-red-400' :
                          'bg-accent-gray/20 text-text-muted'
                        }`}>{t.status}</span>
                      </div>
                      <p className="text-text-main text-sm mb-1">{t.message}</p>
                      <p className="text-text-muted text-xs">Enviado por: <span className="text-secondary-theme">{t.user}</span></p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {t.type === 'Apelación' && t.status === 'Abierto' ? (
                        <>
                          <button 
                            onClick={() => handleAcceptAppeal(t.id, t.user)}
                            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded text-green-400 cursor-pointer text-xs font-cinzel font-bold flex items-center gap-1 transition-all" 
                            title="Aceptar Apelación y Desbanear"
                          >
                            <Check size={14} /> Aceptar
                          </button>
                          <button 
                            onClick={() => handleRejectAppeal(t.id, t.user)}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-red-400 cursor-pointer text-xs font-cinzel font-bold flex items-center gap-1 transition-all" 
                            title="Rechazar Apelación"
                          >
                            <X size={14} /> Rechazar
                          </button>
                        </>
                      ) : (
                        t.status === 'Abierto' && (
                          <button 
                            onClick={() => handleCloseTicket(t.id)}
                            className="p-2 hover:bg-surface-card rounded-full text-green-400 cursor-pointer" 
                            title="Cerrar Ticket"
                          >
                            <Check size={16} />
                          </button>
                        )
                      )}
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <input 
                      type="text" 
                      placeholder="Buscar carta por nombre..."
                      value={cardSearchQuery}
                      onChange={(e) => setCardSearchQuery(e.target.value)}
                      className="w-full bg-panel-secondary border border-accent-gray/30 text-text-main p-2 pl-8 pr-4 rounded focus:outline-none focus:border-primary-gold font-spectral text-xs transition-colors"
                    />
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  </div>
                  <span className="text-xs text-text-muted uppercase font-cinzel whitespace-nowrap">{filteredCards.length} de {cards.length} Cartas</span>
                </div>
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
                      <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('cost')}>
                        Coste {sortField === 'cost' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                        <td className="py-3 px-4 text-blue-400 font-bold">
                          {editingCardId === String(c.id) ? (
                            <input
                              type="number"
                              value={editingCost}
                              onChange={(e) => setEditingCost(parseInt(e.target.value) || 0)}
                              min={0}
                              max={10}
                              className="w-16 bg-panel-secondary border border-primary-gold/50 rounded px-2 py-1 text-text-main focus:outline-none focus:border-primary-gold font-spectral"
                            />
                          ) : (
                            c.cost
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
                                setEditingCost(c.cost || 0);
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


          </div>
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
