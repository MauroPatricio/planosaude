import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, Search, Filter, MoreVertical, 
  CheckCircle, Clock, X, User, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Commission {
  _id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  broker: { name: string; email: string };
  sale: { _id: string; value: number };
  createdAt: string;
}

const CommissionsPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCommissions = async () => {
    try {
      const { data } = await axios.get('/api/commissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommissions(data);
    } catch (err) {
      console.error('Erro ao procurar comissões');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await axios.patch(`/api/commissions/${id}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCommissions();
    } catch (err) {
      alert('Erro ao processar pagamento');
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [token]);

  const filteredCommissions = commissions.filter(c => 
    c.broker?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.sale?._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Comissões & Pagamentos</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Controle os valores ganhos pela equipa e o estado dos pagamentos.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6 border border-white/5 flex items-center gap-5 shadow-xl shadow-amber-500/5">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Pendente</p>
            <p className="text-2xl font-bold text-white font-outfit">{totalPending.toLocaleString()} MT</p>
          </div>
        </div>
        <div className="glass-card p-6 border border-white/5 flex items-center gap-5 shadow-xl shadow-emerald-500/5">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Liquidado</p>
            <p className="text-2xl font-bold text-white font-outfit">{totalPaid.toLocaleString()} MT</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Pesquisar por corretor ou ID de venda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Commissions Table */}
      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Corretor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Origem (Venda)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Montante Ganhos</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                       <Clock className="w-5 h-5 animate-spin" />
                       Carregando comissões...
                    </div>
                  </td>
                </tr>
              ) : filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma comissão registada.
                  </td>
                </tr>
              ) : filteredCommissions.map((comm) => (
                <tr key={comm._id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{comm.broker?.name || 'Sistema'}</div>
                        <div className="text-xs text-slate-500">{comm.broker?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono tracking-tighter">
                    ID: {comm.sale?._id?.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-emerald-400 font-bold tracking-tight">+{comm.amount.toLocaleString()} MT</div>
                    <div className="text-[10px] text-slate-500 uppercase">10% de {(comm.sale?.value || 0).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(comm.status)}`}>
                      {comm.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(comm.createdAt).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {comm.status === 'pending' && ['admin', 'superAdmin'].includes(user?.role || '') && (
                      <button 
                        onClick={() => handleMarkAsPaid(comm._id)}
                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold transition-all border border-indigo-500/20"
                      >
                        Pagar Agora
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionsPage;
