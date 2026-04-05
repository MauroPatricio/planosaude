import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Shield, Plus, Heart, Calendar, 
  UserPlus, FileText, CheckCircle, Clock, X, Paperclip, 
  CreditCard, Receipt, AlertTriangle, Download 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import DocumentManager from '../components/DocumentManager';

interface Member {
  _id: string;
  name: string;
  relationship: string;
  status: string;
  birthDate: string;
}

interface Subscription {
  _id: string;
  plan: { name: string; operator: string; category: string; priceMonthly: number };
  status: string;
  beneficiaryId: string;
}

interface ApprovalRequest {
  _id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  comments?: string;
  createdAt: string;
  requestData: any;
}

const ClientPortal: React.FC = () => {
  const { token, user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [expandedDocMember, setExpandedDocMember] = useState<string | null>(null);
  const [expandedDocRequest, setExpandedDocRequest] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);

  const [memberFormData, setMemberFormData] = useState({
    name: '',
    birthDate: '',
    relationship: 'child',
    documentId: ''
  });

  const fetchData = async () => {
    try {
      const [membersRes, subsRes, plansRes, requestsRes, paymentsRes] = await Promise.all([
        axios.get('/api/members', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/subscriptions', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/subscriptions/plans', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/approvals', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/payments', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMembers(membersRes.data);
      setSubscriptions(subsRes.data);
      setAvailablePlans(plansRes.data);
      setRequests(requestsRes.data);
      setInvoices(paymentsRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados do portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddMemberRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/approvals', {
        type: 'member_add',
        requestData: memberFormData,
        clientId: user?.clientId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert('Solicitação enviada com sucesso! Aguarde a aprovação da corretora.');
      setShowMemberModal(false);
      setMemberFormData({ name: '', birthDate: '', relationship: 'child', documentId: '' });
    } catch (err) {
      alert('Erro ao enviar solicitação');
    }
  };

  const handlePlanAdherenceRequest = async (planId: string) => {
    try {
      await axios.post('/api/approvals', {
        type: 'plan_adherence',
        requestData: { planId, beneficiaryType: 'Client', beneficiaryId: user?.clientId },
        clientId: user?.clientId
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert('Pedido de adesão enviado! Aguarde a validação.');
      setShowPlanModal(false);
    } catch (err) {
      alert('Erro ao enviar pedido de adesão');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-3">Olá, {user?.name} 👋</h1>
        <p className="text-slate-400 font-medium text-lg">Bem-vindo ao seu portal de saúde particular.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Familiares / Membros */}
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white font-outfit">O Meu Agregado Familiar</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Dependentes e Beneficiários</p>
            </div>
            <button 
              onClick={() => setShowMemberModal(true)}
              className="bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 p-2 rounded-xl transition-all"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {members.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700 text-slate-500 text-sm italic">
                Nenhum familiar registado.
              </div>
            ) : members.map((member) => (
              <div key={member._id} className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 group hover:border-primary-500/30 transition-all flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-tight">{member.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        {member.relationship} • {new Date(member.birthDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                       onClick={() => setExpandedDocMember(expandedDocMember === member._id ? null : member._id)}
                       className={`p-2 rounded-xl transition-all ${expandedDocMember === member._id ? 'bg-primary-500 text-slate-950 px-3' : 'bg-slate-800 text-slate-500 hover:text-primary-400'}`}
                     >
                       <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          {expandedDocMember === member._id && <span className="text-[10px] font-black uppercase tracking-widest">Fechar</span>}
                       </div>
                     </button>
                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${member.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
                       {member.status === 'active' ? 'Ativo' : 'Pendente'}
                     </span>
                  </div>
                </div>
                
                {/* Document Manager Integration */}
                {expandedDocMember === member._id && (
                  <div className="mt-4 p-4 bg-slate-950/40 rounded-2xl border border-white/5 animate-in slide-in-from-top-4 duration-300">
                     <DocumentManager 
                       entityId={member._id} 
                       entityType="Member" 
                       title={`Documentos de ${member.name.split(' ')[0]}`}
                     />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Meus Planos Ativos */}
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white font-outfit">Os Meus Planos</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Status de Cobertura e Ativação</p>
            </div>
            <button 
              onClick={() => setShowPlanModal(true)}
              className="bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 p-2 rounded-xl transition-all"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="text-center py-10 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700 text-slate-500 text-sm italic">
                Nenhum plano ativo encontrado.
              </div>
            ) : subscriptions.map((sub) => (
              <div key={sub._id} className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white text-sm">{sub.plan.name}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 tracking-tighter">
                    {sub.status === 'active' ? 'Cobertura Ativa' : sub.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{sub.plan.operator} - {sub.plan.category}</span>
                  <span className="text-xs font-bold text-white">{sub.plan.priceMonthly.toLocaleString()} MT/mês</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Central de Pedidos (New Section) */}
      <div className="glass-card p-8 border-white/5 mb-10 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-xl font-bold text-white font-outfit text-primary-400">Central de Pedidos</h2>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Histórico de Solicitações B2B</p>
            </div>
            <div className="bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{requests.length} Registos</span>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                     <th className="pb-4">Tipo de Pedido</th>
                     <th className="pb-4 text-center">Status</th>
                     <th className="pb-4">Data</th>
                     <th className="pb-4">Observações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {requests.length === 0 ? (
                    <tr>
                       <td colSpan={4} className="py-10 text-center text-slate-500 italic text-sm">Nenhuma solicitação pendente ou concluída.</td>
                    </tr>
                  ) : requests.map((req) => (
                    <tr key={req._id} className="group hover:bg-white/[0.02] transition-colors">
                       <td className="py-4">
                          <p className="text-sm font-bold text-white">{req.type === 'member_add' ? 'Adição de Familiar' : 'Adesão a Plano'}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{req.requestData?.name || req.requestData?.planId || 'Detalhes na aprovação'}</p>
                             {req.status === 'pending' && (
                               <button 
                                 onClick={() => setExpandedDocRequest(expandedDocRequest === req._id ? null : req._id)}
                                 className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${expandedDocRequest === req._id ? 'bg-primary-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                               >
                                 <Paperclip className="w-2.5 h-2.5" />
                                 {expandedDocRequest === req._id ? 'Fechar Docs' : 'Anexar Docs'}
                               </button>
                             )}
                          </div>
                          
                          {expandedDocRequest === req._id && (
                            <div className="mt-4 p-4 bg-slate-950/60 rounded-xl border border-white/5 w-[300px]">
                               <DocumentManager 
                                 entityId={req._id} 
                                 entityType="ApprovalRequest" 
                                 title="Docs p/ Aprovação"
                               />
                            </div>
                          )}
                       </td>
                       <td className="py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${
                             req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 
                             req.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                             {req.status === 'approved' ? 'Aprovado' : req.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                          </span>
                       </td>
                       <td className="py-4">
                          <p className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</p>
                       </td>
                       <td className="py-4">
                          <p className="text-xs text-slate-500 italic max-w-xs">{req.comments || 'Aguardando validação da corretora...'}</p>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Gestão Financeira (New Section) */}
      <div className="glass-card p-8 border-white/5 mb-10 overflow-hidden">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-xl font-bold text-white font-outfit text-primary-400">Gestão Financeira</h2>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Mensalidades e Recibos</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Saldo em Dia</span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.length === 0 ? (
               <div className="col-span-full py-10 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-slate-500 italic text-sm">Nenhuma fatura emitida até ao momento.</p>
               </div>
            ) : invoices.map((inv) => (
               <div key={inv._id} className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-primary-500/30 transition-all flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">{inv.invoiceNumber}</p>
                        <h4 className="text-lg font-black text-white">{inv.amount.toLocaleString()} MT</h4>
                     </div>
                     <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 
                        inv.status === 'overdue' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                     }`}>
                        {inv.status === 'paid' ? 'Liquidada' : inv.status === 'overdue' ? 'Atrasada' : 'Aguardando'}
                     </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-6">
                     <Clock className="w-3.5 h-3.5 text-slate-500" />
                     <p className="text-[10px] text-slate-400 font-bold uppercase">Vence em: {new Date(inv.dueDate).toLocaleDateString()}</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                     {inv.status === 'paid' ? (
                        <button className="flex items-center gap-2 text-primary-400 text-[10px] font-black uppercase tracking-widest hover:underline">
                           <Download className="w-3.5 h-3.5" /> Descarregar Recibo
                        </button>
                     ) : (
                        <button 
                           onClick={() => setShowPaymentModal(showPaymentModal === inv._id ? null : inv._id)}
                           className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              showPaymentModal === inv._id ? 'bg-slate-700 text-white' : 'bg-primary-500 text-slate-950 shadow-lg shadow-primary-500/20'
                           }`}
                        >
                           <CreditCard className="w-3.5 h-3.5" /> 
                           {showPaymentModal === inv._id ? 'Fechar' : 'Pagar Agora'}
                        </button>
                     )}
                  </div>

                  {showPaymentModal === inv._id && (
                     <div className="mt-4 p-4 bg-slate-950/60 rounded-xl border border-white/5 animate-in slide-in-from-top-2 duration-300">
                        <div className="mb-4">
                           <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Instruções de Pagamento</p>
                           <div className="p-3 bg-slate-900 rounded-lg text-[10px] text-slate-300 leading-relaxed border border-white/5">
                              Pode pagar via **M-Pesa (84XXXXXXX)** ou Transferência Bancária. Após o pagamento, anexe o comprovativo abaixo para validação.
                           </div>
                        </div>
                        <DocumentManager 
                           entityId={inv._id} 
                           entityType="ApprovalRequest" // We'll reuse this logic for invoices
                           title="Anexar Comprovativo"
                        />
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>

      {/* Recomendações Premium (Inteligência do Turn 25) */}
      <div className="glass-card p-8 border-primary-500/20 bg-primary-900/5 mb-10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-black text-white font-outfit mb-2 flex items-center gap-2">
              Optimization Insight
              <span className="bg-primary-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Premium</span>
            </h3>
            <p className="text-slate-300 max-w-xl">
              "Com base no seu perfil, o **Plano Premium Plus** oferece uma cobertura 40% superior para despesas de estomatologia pelo mesmo valor mensal para o seu agregado."
            </p>
          </div>
          <button className="bg-white text-slate-950 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-400 transition-all shadow-xl shadow-white/5 whitespace-nowrap">
            Atualizar Agora
          </button>
        </div>
      </div>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
               <h2 className="text-xl font-bold text-white font-outfit">Adicionar Familiar</h2>
               <button onClick={() => setShowMemberModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <form onSubmit={handleAddMemberRequest} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" required
                    value={memberFormData.name}
                    onChange={(e) => setMemberFormData({...memberFormData, name: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Data de Nascimento</label>
                    <input 
                      type="date" required
                      value={memberFormData.birthDate}
                      onChange={(e) => setMemberFormData({...memberFormData, birthDate: e.target.value})}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Grau de Parentesco</label>
                    <select 
                       value={memberFormData.relationship}
                       onChange={(e) => setMemberFormData({...memberFormData, relationship: e.target.value as any})}
                       className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    >
                      <option value="spouse">Cônjuge</option>
                      <option value="child">Filho(a)</option>
                      <option value="parent">Pai/Mãe</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-6">
                   <button type="button" onClick={() => setShowMemberModal(false)} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Cancelar</button>
                   <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-600/20 transition-all">Enviar Solicitação</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Plan Adherence Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card border border-white/10 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
               <div>
                  <h2 className="text-2xl font-bold text-white font-outfit">Planos de Saúde Disponíveis</h2>
                  <p className="text-xs text-primary-400 font-bold uppercase tracking-widest mt-1">Selecione uma cobertura para adesão</p>
               </div>
               <button onClick={() => setShowPlanModal(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6"/></button>
             </div>
             <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {availablePlans.map((plan) => (
                  <div key={plan._id} className="p-6 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-primary-500/30 transition-all flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black uppercase text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-lg border border-primary-500/20">{plan.category}</span>
                           <span className="text-lg font-black text-white">{plan.priceMonthly.toLocaleString()} MT<span className="text-[10px] text-slate-500 ml-1">/mês</span></span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase mb-4 tracking-tighter">{plan.operator}</p>
                        <ul className="space-y-2 mb-6">
                           {plan.benefits?.slice(0, 4).map((b: string, idx: number) => (
                             <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                               <CheckCircle className="w-3 h-3 text-emerald-400" /> {b}
                             </li>
                           ))}
                        </ul>
                    </div>
                    <button 
                      onClick={() => handlePlanAdherenceRequest(plan._id)}
                      className="w-full bg-slate-800 group-hover:bg-primary-600 group-hover:text-white text-slate-300 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Solicitar Adesão
                    </button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
