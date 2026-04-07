import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Building2, Plus, Search, Filter, MoreVertical, 
  Mail, Phone, Shield, User, BarChart3, 
  TrendingUp, Clock, X, DollarSign, Users, Briefcase, FileSpreadsheet, FileText, Eye, Download
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface Institution {
  _id: string;
  name: string;
  nuit?: string;
  email: string;
  phone: string;
  responsible: string;
  status: 'active' | 'inactive';
  employeeCount: number;
  createdAt: string;
}

const InstitutionsPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewEmployeesInst, setViewEmployeesInst] = useState<Institution | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    nuit: '',
    email: '',
    phone: '',
    responsible: '',
    address: ''
  });

  const fetchInstitutions = async () => {
    try {
      const { data } = await api.get('/institutions');
      setInstitutions(data);
    } catch (err) {
      console.error('Erro ao procurar instituições:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [token]);

  const handleAddInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/institutions', formData);
      setShowAddModal(false);
      setFormData({ name: '', nuit: '', email: '', phone: '', responsible: '', address: '' });
      fetchInstitutions();
    } catch (err) {
      alert('Erro ao registar instituição');
      console.error('Erro ao registar:', err);
    }
  };

  const handleCollectivePayment = async (id: string, name: string) => {
    if (!window.confirm(`Deseja liquidar todas as faturas pendentes da instituição ${name}?`)) return;
    
    try {
      const { data } = await api.post(`/institutions/${id}/pay-collective`);
      alert(data.message + `: ${data.updatedCount} faturas liquidadas.`);
      fetchInstitutions();
    } catch (err) {
      alert('Erro ao processar pagamento coletivo');
      console.error('Erro no pagamento coletivo:', err);
    }
  };

  const filteredInstitutions = institutions.filter(inst => 
    inst.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inst.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.responsible.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const fetchEmployees = async (inst: Institution) => {
    setViewEmployeesInst(inst);
    setEmployeesLoading(true);
    try {
      const { data } = await api.get(`/payments/summary-b2b?institutionId=${inst._id}`);
      setEmployees(data);
    } catch (err) {
      console.error('Erro ao procurar funcionários:', err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleExportEmployeesExcel = () => {
    if (!viewEmployeesInst) return;
    const exportData = employees.map(e => ({
      Nome: e.name,
      Email: e.email,
      Telefone: e.phone,
      'Documento/BI': e.documentId,
      'Estado Cliente': e.status.toUpperCase(),
      'Estado Pagamento': e.latestInvoice ? e.latestInvoice.status.toUpperCase() : 'PENDENTE',
      'Vencimento': e.latestInvoice ? new Date(e.latestInvoice.dueDate).toLocaleDateString('pt-PT') : 'N/A'
    }));
    exportToExcel(exportData, `Funcionarios_${viewEmployeesInst.name}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportEmployeesPDF = () => {
    if (!viewEmployeesInst) return;
    const headers = [['Nome', 'Email', 'Telefone', 'Documento', 'Estado Cliente', 'Estado Pagamento', 'Vencimento']];
    const data = employees.map(e => [
      e.name,
      e.email,
      e.phone,
      e.documentId,
      e.status.toUpperCase(),
      e.latestInvoice ? e.latestInvoice.status.toUpperCase() : 'PENDENTE',
      e.latestInvoice ? new Date(e.latestInvoice.dueDate).toLocaleDateString('pt-PT') : 'N/A'
    ]);
    exportToPDF(`Funcionários - ${viewEmployeesInst.name}`, headers, data, `Funcionarios_${viewEmployeesInst.name}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Gestão de Instituições</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Administre as suas contas B2B e acompanhe o desempenho por empresa.</p>
        </div>
        
        {['admin', 'manager'].includes(user?.role || '') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Instituição
          </button>
        )}
      </div>

      {/* Stats Quick View (Mock for now, to be dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 border border-white/5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
             <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Instituições Ativas</p>
            <p className="text-2xl font-bold text-white">{institutions.length}</p>
          </div>
        </div>
        <div className="glass-card p-6 border border-white/5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
             <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Colaboradores B2B</p>
            <p className="text-2xl font-bold text-white">
              {institutions.reduce((acc, curr) => acc + (curr.employeeCount || 0), 0)}
            </p>
          </div>
        </div>
        <div className="glass-card p-6 border border-white/5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
             <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Receita Corporativa</p>
            <p className="text-2xl font-bold text-white tracking-tight">Sob Consulta</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, email ou responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all text-white placeholder:text-slate-500"
          />
        </div>
        <button className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 transition-all text-sm">
          <Filter className="w-4 h-4" />
          Status
        </button>
      </div>

      {/* Institutions Table */}
      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Instituição</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Responsável</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Colaboradores</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                       <Clock className="w-5 h-5 animate-spin" />
                       Procurando instituições...
                    </div>
                  </td>
                </tr>
              ) : filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma instituição encontrada.
                  </td>
                </tr>
              ) : filteredInstitutions.map((inst) => (
                <tr key={inst._id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                        {inst.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white">{inst.name}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-tighter">{inst.nuit || 'Sem NUIT'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-sm text-slate-300 font-medium">{inst.responsible}</span>
                       <span className="text-[10px] text-slate-500">{inst.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Users className="w-4 h-4 text-primary-400" />
                      {inst.employeeCount || 0} funcionários
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      inst.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {inst.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => fetchEmployees(inst)}
                         className="p-2 text-slate-500 hover:text-indigo-400 transition-colors" 
                         title="Visualizar Funcionários"
                       >
                         <Users className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleCollectivePayment(inst._id, inst.name)}
                         className="p-2 text-slate-500 hover:text-emerald-400 transition-colors" 
                         title="Liquidante Faturas B2B"
                       >
                         <DollarSign className="w-4 h-4" />
                       </button>
                       <button className="p-2 text-slate-500 hover:text-primary-400 transition-colors" title="Ver Dashboard da Empresa">
                         <BarChart3 className="w-4 h-4" />
                       </button>
                       <button className="p-2 text-slate-500 hover:text-white transition-colors">
                         <MoreVertical className="w-4 h-4" />
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
          <div className="glass-card border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white font-outfit">Cadastrar Instituição (Conta B2B)</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddInstitution} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    placeholder="Ex: Empresa de Seguros, LDA"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">NUIT / Registro Regional</label>
                  <input 
                    type="text"
                    value={formData.nuit}
                    onChange={(e) => setFormData({...formData, nuit: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    placeholder="Ex: 400123456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                  <input 
                    type="email" required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone da Empresa</label>
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Responsável da Instituição</label>
                <input 
                  type="text" required
                  value={formData.responsible}
                  onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                  placeholder="Nome do gestor ou RH"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Sede / Endereço</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400">Cancelar</button>
                <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-600/20">Criar Conta B2B</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employees List Modal */}
      {viewEmployeesInst && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                   <Users className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white font-outfit">Funcionários do Cliente</h2>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{viewEmployeesInst.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                   onClick={handleExportEmployeesExcel}
                   className="p-2.5 text-emerald-400 hover:bg-emerald-500/10 bg-slate-900 border border-emerald-500/20 rounded-xl transition-all" 
                   title="Exportar Excel"
                 >
                   <FileSpreadsheet className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={handleExportEmployeesPDF}
                   className="p-2.5 text-rose-400 hover:bg-rose-500/10 bg-slate-900 border border-rose-500/20 rounded-xl transition-all" 
                   title="Exportar PDF"
                 >
                   <Download className="w-5 h-5" />
                 </button>
                 <button onClick={() => setViewEmployeesInst(null)} className="p-2 text-slate-500 hover:text-white">
                   <X className="w-5 h-5" />
                 </button>
              </div>
            </div>
            
            <div className="p-0 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/30 border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Colaborador</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contacto</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Doc/BI</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Cliente</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Pagamento</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {employeesLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-500 animate-pulse">
                            Carregando listagem de funcionários...
                          </td>
                        </tr>
                      ) : employees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                            Nenhum colaborador registado para esta instituição.
                          </td>
                        </tr>
                      ) : employees.map((emp) => (
                        <tr key={emp._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white text-sm">{emp.name}</div>
                            <div className="text-[10px] text-slate-500">{emp.email}</div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">{emp.phone}</td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-300 uppercase">{emp.documentId}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                               emp.status === 'active' ? 'bg-primary-500/10 text-primary-400' : 
                               emp.status === 'inactive' ? 'bg-red-500/10 text-red-400' :
                               'bg-amber-500/10 text-amber-400'
                            }`}>
                               {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                               emp.latestInvoice?.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 
                               emp.latestInvoice?.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                               'bg-red-500/10 text-red-400'
                            }`}>
                               {emp.latestInvoice?.status || 'pendente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-300">
                             {emp.latestInvoice?.dueDate ? new Date(emp.latestInvoice.dueDate).toLocaleDateString('pt-PT') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionsPage;
