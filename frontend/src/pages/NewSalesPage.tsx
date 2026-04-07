import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Shield, 
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../context/SocketContext';

interface PlanRequest {
  _id: string;
  client: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    institution?: { name: string };
  };
  plan: {
    _id: string;
    name: string;
    operator: string;
    priceMonthly: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestType: 'new_subscription' | 'cancellation';
  rejectionReason?: string;
  createdAt: string;
}

const NewSalesPage: React.FC = () => {
  const { token } = useAuthStore();
  const { socket } = useSocket();
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PlanRequest | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/plan-requests?status=pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(data);
    } catch (err) {
      console.error('Erro ao carregar solicitações de vendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    if (socket) {
      socket.on('planRequest:new', () => {
        fetchRequests();
      });
      
      return () => {
        socket.off('planRequest:new');
      };
    }
  }, [token, socket]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    
    let rejectionReason = '';
    if (status === 'rejected') {
      rejectionReason = window.prompt('Motivo da rejeição:') || '';
      if (!rejectionReason) return;
    } else {
      if (!window.confirm(`Aprovar adesão ao plano ${selectedRequest.plan.name} para ${selectedRequest.client.name}?`)) return;
    }

    try {
      await axios.put(`/api/plan-requests/${selectedRequest._id}/status`, { 
        status, 
        rejectionReason 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(status === 'approved' ? 'Venda aprovada com sucesso!' : 'Solicitação rejeitada.');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert('Erro ao processar solicitação.');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Novas Vendas</h1>
        <p className="text-slate-400 font-medium text-lg">Aprovação de novos pedidos de adesão a planos de saúde.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-center py-20 text-slate-500 font-black uppercase tracking-widest animate-pulse">
              Carregando solicitações...
            </div>
          ) : requests.length === 0 ? (
            <div className="glass-card p-10 text-center border-white/5">
              <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sem novas solicitações pendentes</p>
            </div>
          ) : (
            requests.map((req) => (
              <div 
                key={req._id}
                onClick={() => setSelectedRequest(req)}
                className={`glass-card p-5 border transition-all cursor-pointer group ${
                  selectedRequest?._id === req._id ? 'border-primary-500 bg-primary-500/5' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-lg">{req.client.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                          req.requestType === 'cancellation' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {req.requestType === 'cancellation' ? 'Cancelamento' : 'Novo Plano'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{req.plan.name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(req.createdAt).toLocaleDateString()} às {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${selectedRequest?._id === req._id ? 'text-primary-400 translate-x-1' : 'text-slate-700 group-hover:text-slate-500'}`} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Details Section */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="glass-card p-6 border-white/5 sticky top-24 bg-slate-900/50">
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-400" /> Detalhes da Solicitação
              </h2>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Data da Solicitação</h4>
                  <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary-400" />
                    <div>
                      <p className="text-white font-bold">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400">{new Date(selectedRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Cliente</h4>
                  <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-white font-bold">{selectedRequest.client.name}</p>
                    <p className="text-xs text-slate-400">{selectedRequest.client.email}</p>
                    <p className="text-xs text-slate-400">{selectedRequest.client.phone}</p>
                    {selectedRequest.client.institution && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                        {selectedRequest.client.institution.name}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Plano Pretendido</h4>
                  <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-white font-black">{selectedRequest.plan.name}</p>
                       <Shield className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">{selectedRequest.plan.operator}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">{selectedRequest.plan.priceMonthly.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 font-bold uppercase">MT / mês</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleAction('rejected')}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 py-3 rounded-xl font-bold text-xs uppercase transition-all border border-white/5"
                  >
                    <XCircle className="w-4 h-4" /> Rejeitar
                  </button>
                  <button 
                    onClick={() => handleAction('approved')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase transition-all shadow-lg ${
                      selectedRequest.requestType === 'cancellation'
                        ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                        : 'bg-primary-500 hover:bg-primary-400 text-slate-950 shadow-primary-500/20'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> 
                    {selectedRequest.requestType === 'cancellation' ? 'Autorizar Cancelamento' : 'Aprovar Adesão'}
                  </button>
                </div>
                
                {selectedRequest.requestType === 'cancellation' && (
                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                    <p className="text-[10px] text-rose-400 font-bold leading-relaxed">
                      ⚠️ ATENÇÃO: A aprovação deste pedido irá cancelar imediatamente a subscrição ativa deste cliente.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 text-center border-white/5 border-dashed bg-transparent">
              <Info className="w-8 h-8 text-slate-800 mx-auto mb-3" />
              <p className="text-slate-600 text-xs font-bold uppercase leading-relaxed">Selecione uma solicitação para visualizar os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSalesPage;
