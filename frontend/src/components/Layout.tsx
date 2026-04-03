import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, TrendingUp, DollarSign, Briefcase, 
  Search, LogOut, LayoutDashboard, Menu, X, Bell
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', path: '/clients', icon: Users },
    { name: 'Vendas', path: '/sales', icon: Briefcase },
    { name: 'Comissões', path: '/commissions', icon: DollarSign },
  ];

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full bg-slate-900/40 backdrop-blur-xl border-r border-slate-800 ${mobile ? 'p-6' : 'p-6'}`}>
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/40">
          <TrendingUp className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-outfit">PlanoSaude</span>
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
            <span className="text-lg font-bold font-outfit text-white">PlanoSaude</span>
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
            <button className="p-2.5 relative text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <Bell className="w-5.5 h-5.5" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-slate-900 ring-2 ring-primary-500/20"></span>
            </button>
            
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
          {(title || subtitle) && (
            <div className="mb-10">
              {title && <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">{title}</h1>}
              {subtitle && <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
