import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Briefcase, Plus, Search, Filter, MoreVertical, 
  CheckCircle, Clock, X, DollarSign, FileText, User, ShoppingBag, 
  FileSpreadsheet, Download, Trash2, Pencil, Eye
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface Sale {
  _id: string;
  client: { 
    name: string; 
    email: string; 
    phone: string; 
    address: string; 
    documentId: string; 
    gender?: string;
    birthDate?: string;
  };
  plan: { 
    _id: string;
    name: string; 
    operator: string 
  };
  broker: { name: string };
  value: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  paymentMethod: string;
  contractNumber?: string;
  policyNumber?: string;
  beneficiaries: {
    kind: 'Client' | 'Member';
    person: any; // Populated Client or Member
  }[];
  notes?: string;
  createdAt: string;
}

interface Client {
  _id: string;
  name: string;
  email?: string;
  hasActiveSubscription?: boolean;
}

interface Plan {
  _id: string;
  name: string;
  priceMonthly: number;
}

const SalesPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    client: '',
    plan: '',
    value: 0,
    paymentMethod: 'm-pesa',
    contractNumber: '',
    policyNumber: '',
    notes: ''
  });

  const [clientQuery, setClientQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientMembers, setClientMembers] = useState<any[]>([]);
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<{kind: 'Client' | 'Member', person: string, name: string}[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const handleExportExcel = () => {
    const rows: any[] = [];

    sales.forEach(s => {
      const beneficiaries = s.beneficiaries && s.beneficiaries.length > 0 
        ? s.beneficiaries 
        : [{ kind: 'Client', person: s.client }];

      beneficiaries.forEach(b => {
        const person = b.person;
        if (!person) return;

        const isPrincipal = b.kind === 'Client';
        
        // Calculate dependent type
        let depType = 'Membro principal';
        if (!isPrincipal) {
          const bday = person.birthDate || person.birthdate;
          if (bday) {
            const age = new Date().getFullYear() - new Date(bday).getFullYear();
            depType = age >= 18 ? 'Dependente adulto' : 'Dependente menor';
          } else {
            depType = 'Dependente';
          }
        }

        rows.push({
          'Nome completo': person.name || 'N/A',
          'Sexo': person.gender || 'N/A',
          'Data de Nascimento': person.birthDate || person.birthdate ? new Date(person.birthDate || person.birthdate).toLocaleDateString() : 'N/A',
          'Tipo de dependente': depType,
          'Relação parentesco': isPrincipal ? 'Titular' : (person.relationship || 'N/A'),
          'Plano ou Pacote': s.plan?.name || 'N/A',
          'Nr de B.I': person.documentNumber || person.documentId || 'N/A',
          'Contacto': isPrincipal ? (person.phone || 'N/A') : '',
          'Nuit': isPrincipal ? (person.nuit || person.documentId || 'N/A') : '',
          'E-mail': isPrincipal ? (person.email || 'N/A') : '',
          'Endereço/residência': isPrincipal ? (person.address || 'N/A') : ''
        });
      });
    });

    exportToExcel(rows, `Vendas_Detalhadas_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = [['Data', 'Cliente', 'Plano', 'Apólice', 'Valor', 'Status']];
    const data = sales.map(s => [
      new Date(s.createdAt).toLocaleDateString(),
      s.client?.name || 'N/A',
      s.plan?.name || 'N/A',
      s.policyNumber || 'N/A',
      `${s.value.toLocaleString()} MT`,
      s.status.toUpperCase()
    ]);
    exportToPDF('Relatório de Vendas', headers, data, `Vendas_${new Date().toISOString().split('T')[0]}`);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, clientsRes, plansRes] = await Promise.all([
        axios.get('/api/sales', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/clients', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/plans', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setSales(salesRes.data);
      setClients(clientsRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error('Erro ao procurar dados de vendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchClientMembers = async (clientId: string) => {
    setMembersLoading(true);
    try {
      const { data } = await axios.get(`/api/members?clientId=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientMembers(data);
    } catch (err) {
      console.error('Erro ao procurar membros:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        beneficiaries: selectedBeneficiaries.map(b => ({ kind: b.kind, person: b.person }))
      };
      
      await axios.post('/api/sales', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      resetForm();
      fetchData();
      alert('Venda registada com sucesso!');
    } catch (err) {
      alert('Erro ao registar venda');
    }
  };

  const resetForm = () => {
    setFormData({
      client: '', plan: '', value: 0, 
      paymentMethod: 'm-pesa', contractNumber: '', 
      policyNumber: '', notes: ''
    });
    setClientQuery('');
    setClientMembers([]);
    setSelectedBeneficiaries([]);
  };

  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    try {
      await axios.put(`/api/sales/${selectedSale._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowEditModal(false);
      setSelectedSale(null);
      setFormData({ client: '', plan: '', value: 0, paymentMethod: 'm-pesa', contractNumber: '', policyNumber: '', notes: '' });
      fetchData();
    } catch (err) {
      alert('Erro ao atualizar venda');
    }
  };

  const handleOpenEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setFormData({
      client: (sale.client as any)?._id || '',
      plan: (sale.plan as any)?._id || '',
      value: sale.value,
      paymentMethod: sale.paymentMethod,
      contractNumber: sale.contractNumber || '',
      policyNumber: sale.policyNumber || '',
      notes: sale.notes || ''
    });
    setShowEditModal(true);
  };

  const handleOpenView = (sale: Sale) => {
    setSelectedSale(sale);
    setShowViewModal(true);
  };

  const handleApproveSale = async (id: string) => {
    if (!window.confirm('Confirma a aprovação desta venda? Isso irá gerar as comissões correspondentes.')) return;
    try {
      await axios.put(`/api/sales/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert('Erro ao aprovar venda');
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja remover esta venda definitivamente?')) return;
    try {
      await axios.delete(`/api/sales/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert('Erro ao remover venda');
    }
  };

  const filteredSales = sales.filter(s => 
    s.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contractNumber?.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p._id === planId);
    if (selectedPlan) {
      setFormData({ ...formData, plan: planId, value: selectedPlan.priceMonthly });
    } else {
      setFormData({ ...formData, plan: planId });
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Gestão de Vendas</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Controle o fluxo de novas apólices e o status das submissões.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registar Nova Venda
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Procurar por cliente, plano ou contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all text-white placeholder:text-slate-500"
          />
        </div>
        <button className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 transition-all text-sm">
          <Filter className="w-4 h-4" />
          Filtrar Status
        </button>
      </div>

      {/* Sales Table */}
      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente & Plano</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nº Apólice</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                       <Clock className="w-5 h-5 animate-spin" />
                       Carregando vendas...
                    </div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma venda registada até ao momento.
                  </td>
                </tr>
              ) : filteredSales.map((sale) => (
                <tr key={sale._id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{sale.client?.name || 'Cliente Removido'}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter truncate max-w-[200px]">{sale.plan?.name || 'Plano Removido'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white font-bold">
                    <div className="text-white font-bold">{sale.value.toLocaleString()} MT</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{sale.paymentMethod.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-white/5">
                      {sale.policyNumber || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(sale.status)}`}>
                      {sale.status}
                    </span>
                  </td>
                   <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleOpenView(sale)}
                         className="p-1.5 text-slate-500 hover:text-primary-400 bg-slate-800/50 hover:bg-primary-500/10 rounded-lg transition-colors border border-transparent hover:border-primary-500/20" 
                         title="Visualizar Detalhes"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleOpenEdit(sale)}
                         className="p-1.5 text-slate-500 hover:text-amber-400 bg-slate-800/50 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20" 
                         title="Editar Venda"
                       >
                         <Pencil className="w-4 h-4" />
                       </button>

                       {['admin', 'manager'].includes(user?.role || '') && sale.status === 'pending' && (
                         <button 
                           onClick={() => handleApproveSale(sale._id)}
                           className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors px-2"
                         >
                           Aprovar
                         </button>
                       )}
                       {['admin', 'manager'].includes(user?.role || '') && (
                         <button 
                           onClick={() => handleDeleteSale(sale._id)}
                           className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-800/50 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" 
                           title="Remover Venda"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       )}
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
              <h2 className="text-xl font-bold text-white font-outfit">Registar Nova Venda</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSale} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Selecionar Cliente</label>
                  <div className="relative">
                    {!formData.client ? (
                      <>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                          <Search className="w-4 h-4" />
                        </div>
                        <input 
                          type="text"
                          required={!formData.client}
                          placeholder="Pesquisar por nome..."
                          value={clientQuery}
                          onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                          onChange={(e) => {
                            setClientQuery(e.target.value);
                            setShowClientDropdown(true);
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                        />
                        {showClientDropdown && (
                          <div className="absolute z-50 w-full mt-2 bg-slate-800/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md max-h-48 overflow-y-auto custom-scrollbar">
                            {clients
                              .filter(c => !c.hasActiveSubscription)
                              .filter(c => c.name.toLowerCase().includes(clientQuery.toLowerCase()))
                              .map(c => (
                                <div 
                                  key={c._id}
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent blur from firing before selection
                                    setFormData({...formData, client: c._id});
                                    setClientQuery(c.name);
                                    setShowClientDropdown(false);
                                    setSelectedBeneficiaries([{ kind: 'Client', person: c._id, name: c.name }]);
                                    fetchClientMembers(c._id);
                                  }}
                                  className="px-4 py-2.5 hover:bg-primary-500/10 cursor-pointer transition-colors border-b border-white/5 last:border-0 flex flex-col"
                                >
                                  <span className="text-sm font-bold text-white">{c.name}</span>
                                  {c.email && <span className="text-[10px] text-slate-500">{c.email}</span>}
                                </div>
                              ))
                            }
                            {clients.filter(c => !c.hasActiveSubscription && c.name.toLowerCase().includes(clientQuery.toLowerCase())).length === 0 && (
                              <div className="px-4 py-3 text-[10px] text-slate-500 italic text-center uppercase tracking-widest font-black bg-slate-900/50">Nenhum cliente elegível</div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between bg-primary-500/10 border border-primary-500/30 rounded-xl p-3 animate-in zoom-in duration-200">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                                <User className="w-4 h-4" />
                             </div>
                             <div>
                                <div className="text-[10px] font-black text-primary-500 uppercase tracking-widest leading-none mb-1">Titular do Seguro</div>
                                <div className="text-sm font-bold text-white">{clientQuery}</div>
                             </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setFormData({...formData, client: ''});
                              setClientQuery('');
                              setClientMembers([]);
                              setSelectedBeneficiaries([]);
                            }}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Beneficiaries Checklist */}
                        {(clientMembers.length > 0 || membersLoading) && (
                          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-3">
                             <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dependentes / Agregado</h4>
                                {membersLoading && <Clock className="w-3 h-3 text-primary-400 animate-spin" />}
                             </div>
                             
                             <div className="grid grid-cols-1 gap-2">
                                {clientMembers.map(member => {
                                  const isSelected = selectedBeneficiaries.some(b => b.person === member._id);
                                  return (
                                    <label 
                                      key={member._id}
                                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-primary-500/10 border-primary-500/30 text-white' 
                                          : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800/50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                          isSelected ? 'bg-primary-500 border-primary-500' : 'border-slate-600'
                                        }`}>
                                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                          <div className="text-xs font-bold">{member.name}</div>
                                          <div className="text-[9px] uppercase tracking-tighter opacity-60">{member.relationship}</div>
                                        </div>
                                      </div>
                                      <input 
                                        type="checkbox"
                                        className="hidden"
                                        checked={isSelected}
                                        onChange={() => {
                                          if (isSelected) {
                                            setSelectedBeneficiaries(selectedBeneficiaries.filter(b => b.person !== member._id));
                                          } else {
                                            setSelectedBeneficiaries([...selectedBeneficiaries, { kind: 'Member', person: member._id, name: member.name }]);
                                          }
                                        }}
                                      />
                                    </label>
                                  );
                                })}
                             </div>
                             
                             <div className="text-[9px] text-slate-500 italic text-center">
                                Total selecionados: <span className="text-primary-400 font-bold">{selectedBeneficiaries.length} pessoas</span>
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Selecionar Plano de Saúde</label>
                  <select 
                    required
                    value={formData.plan}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="">Selecione um plano...</option>
                    {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Valor Final (MT)</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    required
                    value={formData.value}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, value: val === '' ? 0 : parseInt(val)});
                    }}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    placeholder="Ex: 50000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Método de Pagamento</label>
                  <select 
                    required
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="m-pesa">M-Pesa</option>
                    <option value="emola">e-Mola</option>
                    <option value="bank_transfer">Transferência Bancária</option>
                    <option value="cash">Numerário</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Número do Contrato</label>
                  <input 
                    type="text" 
                    value={formData.contractNumber}
                    onChange={(e) => setFormData({...formData, contractNumber: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    placeholder="Ex: C-2024-0001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Número da Apólice</label>
                  <input 
                    type="text" 
                    value={formData.policyNumber}
                    onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    placeholder="Ex: AP-77221"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3 text-sm">
                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-slate-300">
                  Ao registar esta venda, uma comissão provisória de <span className="text-emerald-400 font-bold">{(formData.value * 0.1).toLocaleString()} MT</span> ser&aacute; calculada assim que a venda for aprovada.
                </p>
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
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white font-outfit">Editar Venda</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSale} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Selecionar Cliente</label>
                  <select 
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Selecionar Plano</label>
                  <select 
                    required
                    value={formData.plan}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="">Selecione um plano...</option>
                    {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Valor (MT)</label>
                  <input 
                    type="number" required
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: parseInt(e.target.value)})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Método</label>
                  <select 
                    required
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  >
                    <option value="m-pesa">M-Pesa</option>
                    <option value="emola">e-Mola</option>
                    <option value="bank_transfer">Transferência</option>
                    <option value="cash">Numerário</option>
                  </select>
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Número do Contrato</label>
                   <input 
                     type="text" 
                     value={formData.contractNumber}
                     onChange={(e) => setFormData({...formData, contractNumber: e.target.value})}
                     className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Número da Apólice</label>
                   <input 
                     type="text" 
                     value={formData.policyNumber}
                     onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                     className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                   />
                 </div>
               </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-xl font-bold text-white font-outfit">Detalhes da Venda</h2>
                <button onClick={() => setShowViewModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-8">
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cliente</p>
                      <p className="text-sm font-bold text-white">{(selectedSale.client as any)?.name}</p>
                      <p className="text-xs text-slate-500">{(selectedSale.client as any)?.email}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Plano Adquirido</p>
                      <p className="text-sm font-bold text-primary-400 uppercase tracking-tighter">{(selectedSale.plan as any)?.name}</p>
                      <p className="text-xs text-slate-500 font-medium">Operadora: {(selectedSale.plan as any)?.operator}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Valor da Transação</p>
                      <p className="text-lg font-bold text-white">{selectedSale.value.toLocaleString()} MT</p>
                      <p className="text-xs text-slate-500 uppercase font-black">{selectedSale.paymentMethod.replace('_', ' ')}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedSale.status)}`}>
                         {selectedSale.status}
                      </span>
                   </div>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 space-y-4">
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nº do Contrato</p>
                      <p className="text-sm font-bold text-white font-mono">{selectedSale.contractNumber || 'N/A'}</p>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nº da Apólice</p>
                      <p className="text-sm font-bold text-emerald-400 font-mono">{selectedSale.policyNumber || 'N/A'}</p>
                   </div>
                </div>

                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Notas do Corretor</p>
                   <p className="text-sm text-slate-400 italic bg-slate-900/50 p-4 rounded-xl border border-white/5">
                      {selectedSale.notes || 'Sem observações adicionais.'}
                   </p>
                </div>
             </div>
             <div className="p-4 bg-slate-900/80 border-t border-white/5 text-center">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Registada em: {new Date(selectedSale.createdAt).toLocaleString()}</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
