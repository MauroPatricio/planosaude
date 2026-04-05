import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  Users, TrendingUp, DollarSign, Briefcase, 
  Search, LogOut, LayoutDashboard, Menu, X, Bell, Shield, Building2, ClipboardCheck, 
  Layout as LayoutIcon, Home, CreditCard, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../context/SocketContext';
import NotificationDropdown from './NotificationDropdown';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';

const Layout: React.FC = () => {
  const { user, logout, token } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { socket } = useSocket();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(data);
    } catch (err) {
      console.error('Erro ao carregar notificações');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    if (socket) {
      socket.on('notification:new', (notif: any) => {
        setNotifications(prev => [notif, ...prev]);
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-in fade-in slide-in-from-right-10' : 'animate-out fade-out slide-out-to-right-10'} max-w-sm w-full bg-slate-900/90 backdrop-blur-xl border border-primary-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4 cursor-pointer`} 
            onClick={() => {
              if (notif.link) navigate(notif.link);
              toast.dismiss(t.id);
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-white uppercase tracking-widest">{notif.title}</p>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{notif.message}</p>
            </div>
          </div>
        ), { duration: 5000, position: 'top-right' });
      });

      return () => { socket.off('notification:new'); };
    }
  }, [socket]);

  const handleMarkRead = async (id: string) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Erro ao marcar como lida');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Erro ao marcar todas como lidas');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['superAdmin', 'admin', 'manager', 'broker'] },
    { name: 'Portal RH (B2B)', path: '/b2b', icon: Building2, roles: ['hr_admin'] },
    { name: 'Portal do Cliente', path: '/portal', icon: Home, roles: ['client'] },
    { name: 'Aprovações', path: '/approvals', icon: ClipboardCheck, roles: ['superAdmin', 'admin', 'manager'] },
    { name: 'Instituições', path: '/institutions', icon: Building2, roles: ['superAdmin', 'admin', 'manager', 'broker'] },
    { name: 'Clientes', path: '/clients', icon: Users, roles: ['superAdmin', 'admin', 'manager', 'broker'] },
    { name: 'Planos', path: '/plans', icon: Shield, roles: ['superAdmin', 'admin', 'manager', 'broker'] },
    { name: 'Vendas', path: '/sales', icon: Briefcase, roles: ['superAdmin', 'admin', 'manager', 'broker'] },
    { name: 'Leads (CRM)', path: '/leads', icon: TrendingUp, roles: ['superAdmin', 'admin', 'manager', 'broker'] },
    { name: 'Pagamentos', path: '/payments', icon: CreditCard, roles: ['superAdmin', 'admin', 'manager', 'broker'] },
    { name: 'Comissões', path: '/commissions', icon: DollarSign, roles: ['superAdmin', 'admin', 'manager', 'broker'] },
    { name: 'Sinistros', path: '/claims', icon: AlertCircle, roles: ['superAdmin', 'admin', 'manager', 'broker', 'hr_admin'] },
    { name: 'Equipa', path: '/team', icon: Shield, roles: ['superAdmin', 'admin', 'manager'] },
  ].filter(item => item.roles.includes(user?.role || ''));

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full bg-slate-900/40 backdrop-blur-xl border-r border-slate-800 ${mobile ? 'p-6' : 'p-6'}`}>
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/40">
          <TrendingUp className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-outfit">PlanoSaude360</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
            onClick={() => mobile && setIsSidebarOpen(false)}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-800/50 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Terminar Sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-72 hidden lg:block flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Menu */}
      <aside className={`fixed inset-y-0 left-0 w-72 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <Sidebar mobile />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Top Navigation */}
        <header className="h-20 glass-header flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-400" />
            </button>
            <span className="text-lg font-bold font-outfit text-white">PlanoSaude360</span>
          </div>

          <div className="hidden sm:block relative max-w-md w-full ml-4 lg:ml-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Pesquisar..."
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all border-opacity-50"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-6 ml-auto">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 relative transition-all rounded-xl ${showNotifications ? 'bg-primary-500 text-slate-950 shadow-xl shadow-primary-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <Bell className="w-5.5 h-5.5" />
                {notifications.some(n => !n.isRead) && (
                  <span className={`absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full border-2 border-slate-900 ring-2 ${showNotifications ? 'ring-primary-500/50' : 'ring-primary-500/20'}`}></span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown 
                  notifications={notifications}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white tracking-tight">{user?.name || 'Gestor'}</p>
                <p className="text-xs text-slate-400 font-medium capitalize opacity-70 tracking-wide uppercase">{user?.role || 'Broker'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-900/30 ring-2 ring-primary-500/20">
                {user?.name?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10 scroll-smooth">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default Layout;
