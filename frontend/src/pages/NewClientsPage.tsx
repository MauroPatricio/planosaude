import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Users, CheckCircle, XCircle, Clock, 
  Search, Eye, Mail, FileText, Calendar, 
  Shield, Check, X, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface PendingClient {
  _id: string;
  name: string;
  email: string;
  status: 'pending' | 'active' | 'suspended' | 'pending_correction' | 'rejected';
  createdAt: string;
  profileImage?: string;
  planType?: string;
  address?: string;
  documentType?: string;
  documentNumber?: string;
  nuit?: string;
  clientId?: {
    _id: string;
    phone: string;
    documents?: {
      identificationFrontUrl?: string;
      identificationBackUrl?: string;
      addressProofUrl?: string;
    };
    institution?: { name: string };
  };
}

const NewClientsPage: React.FC = () => {
  const { token } = useAuthStore();
  const [clients, setClients] = useState<PendingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'correction' | 'history'>('pending');
  const [selectedClient, setSelectedClient] = useState<PendingClient | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/users/admin/approvals/clients?status=${activeTab}`);
      setClients(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja aprovar este cliente?')) return;
    setIsProcessing(true);
    try {
      await api.put(`/users/admin/approvals/clients/${id}/approve`);
      fetchClients();
      setSelectedClient(null);
    } catch (err) {
      alert('Erro ao aprovar cliente');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!actionReason) {
      alert('Por favor, insira o motivo da rejeição.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.put(`/users/admin/approvals/clients/${id}/reject`, { reason: actionReason });
      fetchClients();
      setSelectedClient(null);
      setActionReason('');
    } catch (err) {
      alert('Erro ao rejeitar cliente');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCorrection = async (id: string) => {
    if (!actionReason) {
      alert('Por favor, insira o que precisa de ser corrigido.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.put(`/users/admin/approvals/clients/${id}/correction`, { message: actionReason });
      fetchClients();
      setSelectedClient(null);
      setActionReason('');
    } catch (err) {
      alert('Erro ao solicitar correção');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">Pendente</span>;
      case 'pending_correction':
        return <span className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">Correção</span>;
      case 'active':
        return <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">Ativo</span>;
      case 'rejected':
        return <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-rose-500/20">Rejeitado</span>;
      default:
        return <span className="text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Central de Validação</h1>
        <p className="text-slate-400 font-medium text-lg">Analise e aprove os novos registos de clientes no sistema.</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/5 pb-2">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-6 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Pendentes ({clients.filter(c => c.status === 'pending').length})
        </button>
        <button 
          onClick={() => setActiveTab('correction')}
          className={`pb-4 px-6 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'correction' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Aguardando Correção
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-6 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Histórico de Decisões
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carregando solicitações...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-700">
           <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
           <p className="text-slate-500 font-bold">Nenhum cliente encontrado nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clients.map((client) => (
            <div key={client._id} className="glass-card p-6 border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-6 hover:border-primary-500/20 transition-all group">
              <div className="flex items-center gap-6 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/5 shadow-xl group-hover:scale-105 transition-transform">
                   {client.status === 'pending' ? <Clock className="w-8 h-8 text-amber-500" /> : <Shield className="w-8 h-8 text-primary-500" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">{client.planType || 'PARTICULAR'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(client.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 font-outfit">{client.name}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Mail className="w-4 h-4 text-slate-600" />
                      {client.email}
                    </div>
                    {client.clientId?.phone && (
                      <div className="flex items-center gap-2 text-slate-400 text-sm border-l border-white/5 pl-4">
                        <Users className="w-4 h-4 text-slate-600" />
                        {client.clientId.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <button 
                  onClick={() => setSelectedClient(client)}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all border border-white/5"
                >
                  <Eye className="w-4 h-4" /> Ver Detalhes
                </button>
                {client.status === 'pending' && (
                  <button 
                    onClick={() => handleApprove(client._id)}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Check className="w-4 h-4" /> Aprovar
                  </button>
                )}
                {client.status !== 'pending' && getStatusBadge(client.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary-400" />
                 </div>
                 <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Validar Cliente</p>
                    <h2 className="text-xl font-bold text-white font-outfit">{selectedClient.name}</h2>
                 </div>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                       <Users className="w-3.5 h-3.5" /> Dados Pessoais
                    </h4>
                    <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Email</p>
                            <p className="text-sm font-bold text-white break-all">{selectedClient.email}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Telefone</p>
                            <p className="text-sm font-bold text-white">{selectedClient.clientId?.phone || 'N/A'}</p>
                         </div>
                         <div className="col-span-2">
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Morada / Endereço</p>
                            <p className="text-sm font-bold text-white">{selectedClient.address || 'N/A'}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                       <FileText className="w-3.5 h-3.5" /> Identificação e Plano
                    </h4>
                    <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tipo de Plano</p>
                            <p className="text-sm font-bold text-primary-400 uppercase tracking-tighter">{selectedClient.planType || 'Particular'}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Instituição</p>
                            <p className="text-sm font-bold text-white">
                                {(selectedClient.planType?.toUpperCase() === 'INSTITUCIONAL' || selectedClient.planType?.toUpperCase() === 'INSTITUTIONAL')
                                    ? (selectedClient.clientId?.institution?.name || 'Instituição não informada')
                                    : 'Membro Particular'}
                            </p>
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">{selectedClient.documentType || 'Documento'}</p>
                            <p className="text-sm font-bold text-white uppercase">{selectedClient.documentNumber || 'N/A'}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">NUIT</p>
                            <p className="text-sm font-bold text-white uppercase">{selectedClient.nuit || 'N/A'}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                       <Eye className="w-3.5 h-3.5" /> Documentos Submetidos
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                       {[
                         { label: 'Foto de Perfil', url: selectedClient.profileImage },
                         { label: 'Frente do BI', url: selectedClient.clientId?.documents?.identificationFrontUrl },
                         { label: 'Verso do BI', url: selectedClient.clientId?.documents?.identificationBackUrl },
                         { label: 'Comprovativo', url: selectedClient.clientId?.documents?.addressProofUrl },
                        ].map((doc, idx) => {
                          if (!doc.url) return null;
                          const finalUrl = doc.url.startsWith('http') ? doc.url : `http://localhost:5000${doc.url.startsWith('/') ? '' : '/'}${doc.url}`;
                          
                          return (
                            <div key={idx} className="group relative aspect-square md:aspect-video rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center transition-all hover:border-primary-500/50">
                               <img 
                                 src={finalUrl} 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500 z-10 relative"
                                 alt={doc.label}
                                 onError={(e) => {
                                   (e.target as HTMLImageElement).style.display = 'none';
                                 }}
                               />
                               <div className="absolute inset-x-0 bottom-0 top-1/2 bg-slate-950/40 z-20 pointer-events-none" />
                               <FileText className="w-10 h-10 text-slate-700 absolute z-0" />
                               <div className="absolute bottom-3 left-4 z-30">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-white shadow-lg">{doc.label}</p>
                               </div>
                               <div 
                                 className="absolute inset-0 z-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 cursor-pointer"
                                 onClick={() => window.open(finalUrl, '_blank')}
                               >
                                 <div className="bg-white text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2">
                                   <Eye className="w-3.5 h-3.5" /> Ver Original
                                 </div>
                               </div>
                            </div>
                          );
                        })}
                    </div>
                </div>
              </div>

              {selectedClient.status !== 'active' && selectedClient.status !== 'rejected' && (
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                       <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Tomar uma Decisão
                   </h4>
                   <textarea 
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Insira o motivo da rejeição ou instruções para correção..."
                      className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-primary-500 outline-none transition-all mb-4 h-24"
                   />
                   <div className="flex flex-wrap gap-3">
                      <button 
                         onClick={() => handleApprove(selectedClient._id)}
                         disabled={isProcessing}
                         className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-6 py-3.5 rounded-2xl text-xs font-black transition-all"
                      >
                         <CheckCircle className="w-4 h-4" /> Aprovar Cadastro
                      </button>
                      <button 
                         onClick={() => handleCorrection(selectedClient._id)}
                         disabled={isProcessing}
                         className="flex-1 flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-50 text-indigo-400 px-6 py-3.5 rounded-2xl text-xs font-bold border border-indigo-500/20 transition-all"
                      >
                         <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} /> Solicitar Correção
                      </button>
                      <button 
                         onClick={() => handleReject(selectedClient._id)}
                         disabled={isProcessing}
                         className="flex-1 flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-rose-400 px-6 py-3.5 rounded-2xl text-xs font-bold border border-rose-500/20 transition-all"
                      >
                         <XCircle className="w-4 h-4" /> Rejeitar
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewClientsPage;
