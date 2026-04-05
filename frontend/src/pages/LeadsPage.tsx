import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Plus, Search, Filter, MoreVertical, 
  Mail, Phone, FileText, CheckCircle, Clock, X,
  ArrowRight, Check, Trash2, UserPlus, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'proposal' | 'lost' | 'converted';
  source: string;
  notes?: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  new: { label: 'Novo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  contacted: { label: 'Contactado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Phone },
  proposal: { label: 'Proposta', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: FileText },
  converted: { label: 'Convertido', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  lost: { label: 'Perdido', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: X },
};

const LeadsPage: React.FC = () => {
  const { token } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'direct',
    notes: ''
  });

  const [convertData, setConvertData] = useState({
    documentId: '',
    address: ''
  });

  const fetchLeads = async () => {
    try {
      const { data } = await axios.get('/api/leads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(data);
    } catch (err) {
      console.error('Erro ao procurar leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [token]);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/leads', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', source: 'direct', notes: '' });
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao criar lead');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`/api/leads/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLeads();
    } catch (err) {
      console.error('Erro ao atualizar status');
    }
  };

  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConvertModal) return;
    try {
      await axios.post(`/api/leads/${showConvertModal._id}/convert`, convertData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowConvertModal(null);
      setConvertData({ documentId: '', address: '' });
      fetchLeads();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao converter lead');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderColumn = (status: string) => {
    const columnLeads = filteredLeads.filter(l => l.status === status);
    const config = statusConfig[status];

    return (
      <div className="flex flex-col gap-4 min-w-[300px] flex-1">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.color.split(' ')[1].replace('text-', 'bg-')}`}></div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{config.label}</h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
              {columnLeads.length}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 min-h-[500px]">
          {columnLeads.map((lead) => (
            <div key={lead._id} className="glass-card p-4 border-white/5 hover:border-primary-500/30 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 text-xs font-bold">
                  {lead.name[0]}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {status !== 'converted' && status !== 'lost' && (
                    <button 
                      onClick={() => {
                        const statuses: Lead['status'][] = ['new', 'contacted', 'proposal', 'converted', 'lost'];
                        const nextIdx = statuses.indexOf(lead.status) + 1;
                        if (statuses[nextIdx] === 'converted') {
                          setShowConvertModal(lead);
                        } else {
                          handleUpdateStatus(lead._id, statuses[nextIdx]);
                        }
                      }}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Mover para Próximo"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{lead.name}</h4>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-3">
                <Mail className="w-3 h-3" /> {lead.email}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                  {new Date(lead.createdAt).toLocaleDateString('pt-PT')}
                </span>
                <span className="text-[10px] text-slate-600 font-medium italic">
                  {lead.source}
                </span>
              </div>
            </div>
          ))}
          {columnLeads.length === 0 && (
            <div className="flex-1 border-2 border-dashed border-slate-800/50 rounded-2xl flex items-center justify-center">
              <span className="text-xs text-slate-600 font-medium italic">Sem leads nesta fase</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Funil de Leads (CRM)</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Gerencie potenciais clientes desde o primeiro contato até a conversão final.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Capturar Novo Lead
        </button>
      </div>

      {/* Board Header / Filters */}
      <div className="glass-card border border-white/5 p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Pesquisar leads por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
           <div className="px-3 py-1.5 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700/50">
             Total: {leads.length}
           </div>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {renderColumn('new')}
        {renderColumn('contacted')}
        {renderColumn('proposal')}
        {renderColumn('converted')}
        {renderColumn('lost')}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white font-outfit">Capturar Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  placeholder="Ex: Ana Maria"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    placeholder="ana@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
                  <input 
                    type="text" required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    placeholder="+258..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Notas / Observações</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none h-20 resize-none"
                  placeholder="O que este cliente procura?"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-600/20">Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Client Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-primary-500/20 bg-primary-500/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white font-outfit">Converter em Cliente</h2>
                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Finalizando processo de venda</p>
                </div>
              </div>
              <button onClick={() => setShowConvertModal(null)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleConvertLead} className="p-6 space-y-4">
              <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl">
                 <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-tighter">Resumo do Lead</p>
                 <div className="text-white font-bold">{showConvertModal.name}</div>
                 <div className="text-xs text-slate-500">{showConvertModal.email}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Documento (BI/NUIT)</label>
                  <input 
                    type="text" required
                    value={convertData.documentId}
                    onChange={(e) => setConvertData({...convertData, documentId: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    placeholder="Obrigatório"
                  />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Cliente</label>
                   <div className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-300 font-medium">
                      Ativo Automaticamente
                   </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço / Morada</label>
                <textarea 
                  value={convertData.address}
                  onChange={(e) => setConvertData({...convertData, address: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none h-20 resize-none"
                  placeholder="Local de residência..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowConvertModal(null)} className="px-4 py-2 text-sm font-bold text-slate-400">Voltar</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/20">Finalizar Conversão</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
