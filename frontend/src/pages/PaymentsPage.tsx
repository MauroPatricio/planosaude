import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, CheckCircle, XCircle, Clock, 
  Search, Download, Filter, RefreshCw, FileText,
  AlertTriangle, DollarSign, TrendingUp, Users, Receipt, User
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import DocumentManager from '../components/DocumentManager';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { FileSpreadsheet } from 'lucide-react';

interface PaymentSummary {
  _id: string;
  name: string;
  email: string;
  phone: string;
  institutionName: string;
  planName: string;
  amount: number;
  dueDate: string;
  invoiceStatus: string;
  brokerName?: string;
  policyNumber?: string;
  latestInvoice: {
    _id: string;
    invoiceNumber: string;
    amount: number;
    status: 'open' | 'pending' | 'paid' | 'overdue' | 'cancelled';
    dueDate: string;
    notes?: string;
    paymentMethod?: string;
  } | null;
  invoiceCount: number;
}

const PaymentsPage: React.FC = () => {
  const { token } = useAuthStore();
  const [summaries, setSummaries] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [expandedInv, setExpandedInv] = useState<string | null>(null);

  const handleExportExcel = () => {
    const exportData = summaries.map(s => ({
      Cliente: s.name,
      Tipo: s.institutionName === 'Particular' ? 'Individual' : 'Empresa',
      Instituicao: s.institutionName,
      Plano: s.planName,
      'Fatura #': s.latestInvoice?.invoiceNumber || 'N/A',
      Valor: s.latestInvoice?.amount || 0,
      Status: s.latestInvoice?.status || 'N/A'
    }));
    exportToExcel(exportData, `Faturas_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = [['Cliente', 'Tipo', 'Plano', 'Fatura #', 'Valor', 'Status']];
    const data = summaries.map(s => [
      s.name,
      s.institutionName === 'Particular' ? 'Individual' : 'Empresa',
      s.planName,
      s.latestInvoice?.invoiceNumber || 'N/A',
      s.latestInvoice ? `${s.latestInvoice.amount.toLocaleString()} MT` : '0 MT',
      s.latestInvoice?.status.toUpperCase() || 'SEM DÉBITO'
    ]);
    exportToPDF('Relatório Financeiro', headers, data, `Financeiro_${new Date().toISOString().split('T')[0]}`);
  };

  const fetchSummaries = async () => {
    try {
      const { data } = await axios.get('/api/payments/summary-b2b', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummaries(data);
    } catch (err) {
      console.error('Erro ao carregar sumário de pagamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, [token]);

  const handleValidate = async (id: string, status: 'paid' | 'cancelled') => {
    const notes = window.prompt('Notas adicionais (opcional):');
    if (notes === null) return;

    try {
      await axios.put(`/api/payments/${id}/validate`, { status, notes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSummaries();
      setExpandedInv(null);
    } catch (err) {
      alert('Erro ao validar pagamento');
    }
  };

  const handleGenerateMonthly = async () => {
    if (!window.confirm('Deseja gerar faturas mensais para todos os clientes ativos?')) return;
    try {
      const { data } = await axios.post('/api/payments/generate-monthly', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(data.message);
      fetchSummaries();
    } catch (err) {
      alert('Erro ao gerar faturas');
    }
  };

  const filteredSummaries = summaries.filter(s => {
    if (filter === 'all') return true;
    if (!s.latestInvoice) return false;
    return s.latestInvoice.status === filter;
  });

  const stats = {
    total: summaries.reduce((acc, s) => acc + (s.latestInvoice?.status === 'paid' ? s.latestInvoice.amount : 0), 0),
    pending: summaries.reduce((acc, s) => acc + (s.latestInvoice?.status === 'pending' ? s.latestInvoice.amount : 0), 0),
    overdue: summaries.filter(s => s.latestInvoice?.status === 'overdue').length
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Gestão Financeira</h1>
          <p className="text-slate-400 font-medium text-lg">Controlo de mensalidades, recebimentos e comissões.</p>
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
            onClick={handleGenerateMonthly}
            className="flex items-center gap-3 bg-primary-500 hover:bg-primary-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-500/20"
          >
            <RefreshCw className="w-4 h-4" /> Gerar Mensalidades
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-card p-6 border-white/5 bg-emerald-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Receita Liquidada</p>
              <h3 className="text-2xl font-black text-white">{stats.total.toLocaleString()} MT</h3>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-white/5 bg-amber-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Pendente Validação</p>
              <h3 className="text-2xl font-black text-white">{stats.pending.toLocaleString()} MT</h3>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-white/5 bg-rose-500/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Faturas em Atraso</p>
              <h3 className="text-2xl font-black text-white">{stats.overdue} Clientes</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 border-b border-white/5 pb-2">
        {(['all', 'pending', 'overdue', 'paid'] as const).map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all ${filter === f ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendente' : f === 'overdue' ? 'Atraso' : 'Pagas'}
          </button>
        ))}
      </div>

      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente & Plano</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Broker</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nº Apólice</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-[10px] uppercase font-black tracking-widest animate-pulse">
                    Carregando dados financeiros...
                  </td>
                </tr>
              ) : filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registo encontrado para este filtro.
                  </td>
                </tr>
              ) : filteredSummaries.map((s) => (
                <React.Fragment key={s._id}>
                  <tr className="hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                          s.latestInvoice?.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          s.latestInvoice?.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          s.latestInvoice?.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-slate-800/50 text-slate-500 border-white/5'
                        }`}>
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-primary-400 transition-colors">{s.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{s.planName}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                             <span className="text-[10px] font-medium text-slate-600">{s.institutionName}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-bold">{s.amount.toLocaleString()} MT</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                        {s.invoiceStatus === 'recorrente' ? (
                          <span className="text-emerald-500/60 lowercase">recorrente</span>
                        ) : (
                          <span>{s.latestInvoice?.invoiceNumber || '---'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        {s.brokerName || 'Direto'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-white/5">
                        {s.policyNumber || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         s.latestInvoice?.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                         s.latestInvoice?.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                         s.latestInvoice?.status === 'overdue' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                         'bg-slate-800 text-slate-500 border-slate-700/50'
                       }`}>
                         {s.latestInvoice?.status.replace('_', ' ') || 'S/ FATURA'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {s.latestInvoice?.status === 'pending' && (
                          <button 
                            onClick={() => setExpandedInv(expandedInv === s.latestInvoice!._id ? null : s.latestInvoice!._id)}
                            className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20"
                            title="Revisar Prova"
                          >
                            <Search className="w-4 h-4" />
                          </button>
                        )}
                        {s.latestInvoice && s.latestInvoice.status !== 'paid' && s.latestInvoice.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleValidate(s.latestInvoice!._id, 'paid')}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                            title="Validar Pagamento"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {s.latestInvoice?.status === 'paid' && (
                          <div className="text-emerald-500/40 p-1.5" title="Liquidado">
                             <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {s.latestInvoice && expandedInv === s.latestInvoice._id && (
                    <tr className="bg-slate-900/40">
                      <td colSpan={6} className="px-6 py-6 border-t border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Detalhes do Pagamento
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                    <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Método</p>
                                    <p className="text-xs font-black text-white uppercase">{s.latestInvoice.paymentMethod || 'Indefinido'}</p>
                                 </div>
                                 <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                    <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Vencimento</p>
                                    <p className="text-xs font-black text-white uppercase">{new Date(s.latestInvoice.dueDate).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              {s.latestInvoice.notes && (
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                   <p className="text-[9px] text-slate-600 font-bold uppercase mb-1">Observações</p>
                                   <p className="text-xs text-slate-400 italic font-medium leading-relaxed">"{s.latestInvoice.notes}"</p>
                                </div>
                              )}
                          </div>
                          <div>
                              <DocumentManager 
                                 entityId={s.latestInvoice._id} 
                                 entityType="ApprovalRequest" 
                                 title="Comprovativo"
                                 readOnly
                              />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
