import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardCheck, CheckCircle, XCircle, Clock, 
  User, Plus, Minus, Edit, FileText, Search, Calendar, Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import DocumentManager from '../components/DocumentManager';

interface ApprovalRequest {
  _id: string;
  client: { name: string; email: string };
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestData: any;
  createdAt: string;
  comments?: string;
  handledBy?: { name: string };
}

const ApprovalsPage: React.FC = () => {
  const { token } = useAuthStore();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get('/api/approvals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(data);
    } catch (err) {
      console.error('Erro ao procurar solicitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    const comments = window.prompt(`Comentários para ${status === 'approved' ? 'Aprovação' : 'Rejeição'}:`);
    if (comments === null) return;

    try {
      await axios.put(`/api/approvals/${id}`, { status, comments }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRequests();
    } catch (err) {
      alert('Erro ao processar solicitação');
    }
  };

  const filteredRequests = requests.filter(r => 
    activeTab === 'pending' ? r.status === 'pending' : r.status !== 'pending'
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'member_add': return <Plus className="w-4 h-4 text-emerald-400" />;
      case 'member_removal': return <Minus className="w-4 h-4 text-rose-400" />;
      case 'plan_adherence': return <FileText className="w-4 h-4 text-primary-400" />;
      case 'plan_removal': return <XCircle className="w-4 h-4 text-amber-400" />;
      default: return <Edit className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'member_add': return 'Adição de Membro';
      case 'member_removal': return 'Remoção de Membro';
      case 'plan_adherence': return 'Adesão a Plano';
      case 'plan_removal': return 'Cancelamento de Plano';
      case 'data_change': return 'Alteração de Dados';
      default: return type;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Central de Aprovações</h1>
        <p className="text-slate-400 font-medium text-lg">Valide as solicitações e alterações enviadas pelos clientes.</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/5 pb-2">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Pendentes ({requests.filter(r => r.status === 'pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Histórico
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Procurando solicitações...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700 text-slate-500">
             Nenhuma solicitação encontrada nesta categoria.
          </div>
        ) : filteredRequests.map((req) => (
          <div key={req._id} className="glass-card p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary-500/20 transition-all">
            <div className="flex items-center gap-6 flex-1">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {getIcon(req.type)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-tighter text-slate-500">{getTypeText(req.type)}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(req.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Solicitado por: {req.client?.name}</h3>
                <div className="bg-slate-950/30 p-5 rounded-2xl border border-white/5 shadow-inner">
                  {req.type === 'member_add' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                         <User className="w-4 h-4 text-primary-400" />
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nome do Beneficiário</p>
                            <p className="text-sm font-bold text-white">{req.requestData?.name}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <Calendar className="w-4 h-4 text-indigo-400" />
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Data de Nascimento</p>
                            <p className="text-sm font-bold text-white">{new Date(req.requestData?.birthDate).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <Users className="w-4 h-4 text-emerald-400" />
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Parentesco</p>
                            <p className="text-sm font-bold text-white uppercase tracking-tighter">{req.requestData?.relationship}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <FileText className="w-4 h-4 text-slate-400" />
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Documento ID</p>
                            <p className="text-sm font-bold text-white">{req.requestData?.documentId || 'Não informado'}</p>
                         </div>
                      </div>
                    </div>
                  )}
                  {req.type === 'plan_adherence' && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                             <Plus className="w-5 h-5 text-primary-400" />
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pedido de Adesão</p>
                             <p className="text-sm font-bold text-white">ID do Plano: <span className="font-mono text-primary-400">{req.requestData?.planId}</span></p>
                          </div>
                       </div>
                    </div>
                  )}
                  {req.type !== 'member_add' && req.type !== 'plan_adherence' && (
                    <pre className="text-[10px] text-slate-500 font-mono overflow-x-auto">
                       {JSON.stringify(req.requestData, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4">
                   {req.comments && (
                     <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                        <ClipboardCheck className="w-3.5 h-3.5 text-slate-500" />
                        <p className="text-xs text-slate-400 italic">"{req.comments}"</p>
                     </div>
                   )}
                   {req.status !== 'pending' && (
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Processado por: {req.handledBy?.name || 'Sistema'} 
                     </div>
                   )}
                   <button 
                     onClick={() => setExpandedDoc(expandedDoc === req._id ? null : req._id)}
                     className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${expandedDoc === req._id ? 'bg-primary-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                   >
                     <FileText className="w-3.5 h-3.5" />
                     {expandedDoc === req._id ? 'Ocultar Documentos' : 'Ver Documentos'}
                   </button>
                </div>

                {expandedDoc === req._id && (
                  <div className="mt-6 p-6 bg-slate-950/50 rounded-2xl border border-white/5 animate-in slide-in-from-top-4 duration-300">
                     <DocumentManager 
                       entityId={req._id} 
                       entityType="ApprovalRequest" 
                       title="Documentos Enviados pelo Cliente"
                       readOnly={req.status !== 'pending'}
                     />
                  </div>
                )}
              </div>
            </div>

            {req.status === 'pending' && (
              <div className="flex items-center gap-3">
                <button 
                   onClick={() => handleAction(req._id, 'rejected')}
                   className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/20 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Rejeitar
                </button>
                <button 
                  onClick={() => handleAction(req._id, 'approved')}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle className="w-4 h-4" /> Aprovar
                </button>
              </div>
            )}
            {req.status !== 'pending' && (
               <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                 {req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
               </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalsPage;
