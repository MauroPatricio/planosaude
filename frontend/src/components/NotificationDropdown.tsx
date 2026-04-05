import React from 'react';
import { 
  CheckCircle, AlertCircle, Info, XCircle, 
  Clock, Check, ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  notifications, onMarkRead, onMarkAllRead, onClose 
}) => {
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-rose-400" />;
      default: return <Info className="w-5 h-5 text-primary-400" />;
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) onMarkRead(notif._id);
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-[380px] bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Notificações</h3>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-primary-400 hover:text-primary-300 uppercase tracking-tighter flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3 h-3" /> Marcar todas
          </button>
        )}
      </div>

      <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 italic">Nenhuma notificação recente.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <div 
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 flex gap-4 hover:bg-white/[0.03] transition-all cursor-pointer relative group ${!notif.isRead ? 'bg-primary-500/[0.02]' : ''}`}
              >
                {!notif.isRead && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"></div>
                )}
                
                <div className="shrink-0 mt-1">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs font-bold leading-none ${!notif.isRead ? 'text-white' : 'text-slate-400'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[9px] text-slate-500 font-medium">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-2">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <div className="flex items-center gap-1 text-[9px] font-black text-primary-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver detalhes <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
        <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
          Ver Histórico Completo
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
