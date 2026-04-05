import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
   Briefcase, Plus, Search, Filter, MoreVertical, 
   Shield, CheckCircle, Clock, X, DollarSign, Activity, Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Plan {
  _id: string;
  name: string;
  operator: string;
  type: 'individual' | 'corporate' | 'family';
  category: 'base' | 'plus' | 'premium';
  priceMonthly: number;
  benefits: string[];
  isActive: boolean;
  createdAt: string;
}

const PlansPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    operator: '',
    type: 'individual',
    category: 'base',
    priceMonthly: 0,
    benefits: ''
  });

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get('/api/plans/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(data);
    } catch (err) {
      console.error('Erro ao procurar planos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [token]);

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja remover este plano?')) return;
    try {
      await axios.delete(`/api/plans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPlans();
    } catch (err) {
      alert('Erro ao remover plano de saúde');
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b !== '')
      };
      await axios.post('/api/plans', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setFormData({ name: '', operator: '', type: 'individual', category: 'base', priceMonthly: 0, benefits: '' });
      fetchPlans();
    } catch (err) {
      alert('Erro ao registar plano');
    }
  };

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.operator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'premium': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'plus': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Planos de Saúde</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Faça a gestão do catálogo de seguros e coberturas disponíveis.</p>
        </div>
        
        {['admin', 'manager'].includes(user?.role || '') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Configurar Novo Plano
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="glass-card border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome do plano ou seguradora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all text-white placeholder:text-slate-500"
          />
        </div>
        <button className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 transition-all text-sm">
          <Filter className="w-4 h-4" />
          Categorias
        </button>
      </div>

      {/* Plans Table */}
      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Plano / Seguradora</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Preço Base</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                       <Clock className="w-5 h-5 animate-spin" />
                       Consultando catálogo...
                    </div>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum plano configurado.
                  </td>
                </tr>
              ) : filteredPlans.map((plan) => (
                <tr key={plan._id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{plan.name}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">{plan.operator}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-300 capitalize">{plan.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getCategoryColor(plan.category)}`}>
                      {plan.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-white font-bold">
                       {plan.priceMonthly.toLocaleString()} <span className="text-[10px] text-slate-500">MT/mês</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleDeletePlan(plan._id)}
                         className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-800/50 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" 
                         title="Remover Plano"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white font-outfit">Configurar Plano de Saúde</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddPlan} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Plano</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    placeholder="Ex: Plano Familiar Ouro"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Seguradora / Operadora</label>
                  <input 
                    type="text" 
                    required
                    value={formData.operator}
                    onChange={(e) => setFormData({...formData, operator: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    placeholder="Ex: Medis, Multicare"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="individual">Individual</option>
                    <option value="corporate">Corporativo</option>
                    <option value="family">Familiar</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="base">Base</option>
                    <option value="plus">Plus / Especial</option>
                    <option value="premium">Premium / Ouro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Preço Mensal (MT)</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    required
                    value={formData.priceMonthly}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, priceMonthly: val === '' ? 0 : parseInt(val)});
                    }}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    placeholder="Ex: 15000"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Benefícios (Separados por vírgula)</label>
                <textarea 
                  value={formData.benefits}
                  onChange={(e) => setFormData({...formData, benefits: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 h-20 resize-none"
                  placeholder="Ex: Internamento, Consultas, Estomatologia"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 transition-all"
                >
                  Criar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansPage;
