import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertCircle, Search, Filter, CheckCircle, 
  XCircle, Clock, FileText, User, 
  ExternalLink, MessageSquare, Shield, Plus, X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Claim {
  _id: string;
  type: string;
  description: string;
  amountRequested?: number;
  status: 'pending' | 'approved' | 'rejected' | 'more_info_needed';
  client: { name: string; email: string; phone: string };
  subscription: any;
  adminNotes?: string;
  createdAt: string;
}

const ClaimsPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Create Claim States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSubscriptions, setClientSubscriptions] = useState<any[]>([]);
  const [newClaim, setNewClaim] = useState({
    type: 'consultation',
    description: '',
    amountRequested: '',
    subscriptionId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClaims = async () => {
    try {
      const { data } = await axios.get('/api/claims', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(data);
    } catch (err) {
      console.error('Erro ao procurar sinistros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [token]);

  const fetchClients = async () => {
    try {
      const { data } = await axios.get('/api/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(data);
    } catch (err) {
      console.error('Erro ao procurar clientes');
    }
  };

  const fetchClientSubscriptions = async (clientId: string) => {
    try {
      const { data } = await axios.get(`/api/subscriptions?beneficiaryId=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientSubscriptions(data);
    } catch (err) {
      console.error('Erro ao procurar subscrições');
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      fetchClientSubscriptions(selectedClientId);
    } else {
      setClientSubscriptions([]);
    }
  }, [selectedClientId]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newClaim.subscriptionId || !newClaim.description || !newClaim.amountRequested) {
      alert('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post('/api/claims', {
        clientId: selectedClientId,
        subscriptionId: newClaim.subscriptionId,
        type: newClaim.type,
        description: newClaim.description,
        amountRequested: parseFloat(newClaim.amountRequested)
      }, { headers: { Authorization: `Bearer ${token}` } });

      setIsCreateModalOpen(false);
      // Reset form
      setSelectedClientId('');
      setNewClaim({ type: 'consultation', description: '', amountRequested: '', subscriptionId: '' });
      fetchClaims();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registar sinistro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/claims/${id}/status`, {
        status,
        adminNotes
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSelectedClaim(null);
      setAdminNotes('');
      fetchClaims();
    } catch (err) {
      alert('Erro ao atualizar estado do sinistro');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'more_info_needed': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const filteredClaims = claims.filter(c => 
    c.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2 text-glow-blue">Gestão de Sinistros</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Central de análise e aprovação de pedidos de reembolso e assistência.</p>
        </div>
        <button 
          onClick={() => {
            fetchClients();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-5 h-5" />
          Registar Novo Sinistro
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Pesquisar por cliente ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all text-white"
          />
        </div>
      </div>

      {/* Claims Table */}
      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo/Evento</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Carregando sinistros...</td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Nenhum sinistro encontrado.</td>
                </tr>
              ) : filteredClaims.map((claim) => (
                <tr key={claim._id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{claim.client?.name}</div>
                    <div className="text-xs text-slate-500">{claim.client?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white text-sm capitalize">{claim.type}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">{claim.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-bold">{claim.amountRequested?.toLocaleString() || '0'} MT</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(claim.status)}`}>
                      {claim.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedClaim(claim)}
                      className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes / Aprovação */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-white/10 w-full max-w-lg p-6 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Detalhes do Sinistro</h2>
                <p className="text-sm text-slate-400">Analise os documentos e decida a aprovação.</p>
              </div>
              <button onClick={() => setSelectedClaim(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-8 text-sm">
               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                  <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest mb-1">Descrição do Evento</p>
                  <p className="text-white leading-relaxed">{selectedClaim.description}</p>
               </div>
               
               <div className="flex gap-4">
                 <div className="flex-1 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                    <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest mb-1">Valor do Pedido</p>
                    <p className="text-white font-bold text-lg">{selectedClaim.amountRequested?.toLocaleString()} MT</p>
                 </div>
                 <div className="flex-1 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                    <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest mb-1">Documentos</p>
                    <div className="flex gap-2 mt-1">
                       <FileText className="w-5 h-5 text-indigo-400" />
                       <span className="text-indigo-400 font-bold">Ver Anexo</span>
                    </div>
                 </div>
               </div>

               <div>
                 <p className="text-slate-400 uppercase text-[10px] font-bold tracking-widest mb-2">Notas Administrativas</p>
                 <textarea 
                   className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                   rows={3}
                   placeholder="Adicione observações para o cliente..."
                   value={adminNotes}
                   onChange={(e) => setAdminNotes(e.target.value)}
                 />
               </div>
            </div>

            <div className="flex gap-4">
               <button 
                 onClick={() => handleUpdateStatus(selectedClaim._id, 'rejected')}
                 className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-2xl border border-rose-500/20 transition-all"
               >
                 Rejeitar
               </button>
               <button 
                 onClick={() => handleUpdateStatus(selectedClaim._id, 'approved')}
                 className="flex-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-2xl border border-emerald-500/20 transition-all shadow-lg shadow-emerald-500/10"
               >
                 Aprovar Sinistro
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registar Novo Sinistro */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-white/10 w-full max-w-lg p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight">Novo Sinistro</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-6">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Cliente</label>
                <select 
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  required
                >
                  <option value="">Selecione o Cliente...</option>
                  {clients.filter(c => c.hasActiveSubscription).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedClientId && (
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Plano / Subscrição</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    value={newClaim.subscriptionId}
                    onChange={(e) => setNewClaim({...newClaim, subscriptionId: e.target.value})}
                    required
                  >
                    <option value="">Selecione o Plano...</option>
                    {clientSubscriptions.map(s => (
                      <option key={s._id} value={s._id}>{s.plan?.name || 'Plano'}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Tipo de Evento</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    value={newClaim.type}
                    onChange={(e) => setNewClaim({...newClaim, type: e.target.value})}
                  >
                    <option value="consultation">Consulta</option>
                    <option value="exam">Exame</option>
                    <option value="pharmacy">Farmácia</option>
                    <option value="surgery">Cirurgia</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Valor Estimado</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-bold"
                    value={newClaim.amountRequested}
                    onChange={(e) => setNewClaim({...newClaim, amountRequested: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Descrição dos Factos</label>
                <textarea 
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  rows={3}
                  value={newClaim.description}
                  onChange={(e) => setNewClaim({...newClaim, description: e.target.value})}
                  placeholder="Descreva o que aconteceu..."
                  required
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary-500/20"
                >
                  {isSubmitting ? 'Registando...' : 'Submeter Sinistro Administrativo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimsPage;
