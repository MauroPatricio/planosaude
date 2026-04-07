import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Users, Plus, Search, Filter, MoreVertical, 
  Mail, Phone, FileText, CheckCircle, Clock, X,
  FileSpreadsheet, Download, UploadCloud, Trash2, Eye, Pencil
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  documentId: string;
  status: 'active' | 'inactive' | 'lead' | 'pending' | 'pending_correction' | 'rejected';
  institution?: { _id: string, name: string };
  billingCycle?: 'monthly' | 'quarterly' | 'annually';
  preferredPaymentDate?: string;
  address?: string;
  createdAt: string;
  hasActiveSubscription?: boolean;
  memberCount?: number;
  documents?: {
    identificationFrontUrl?: string;
    identificationBackUrl?: string;
    addressProofUrl?: string;
  };
}

interface Institution {
  _id: string;
  name: string;
}

interface Member {
  _id: string;
  name: string;
  relationship: 'pai' | 'mae' | 'filho' | 'irmao' | 'conjuge' | 'outro';
  birthDate: string;
  documentNumber?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedProfileClient, setSelectedProfileClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    documentId: '',
    address: '',
    status: 'active',
    institution: '',
    billingCycle: 'monthly',
    preferredPaymentDate: new Date().toISOString().split('T')[0]
  });
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [bulkPlanId, setBulkPlanId] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  // Member States
  const [members, setMembers] = useState<Member[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    relationship: 'filho',
    birthDate: '',
    documentNumber: '',
    phone: ''
  });

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkPlanModal, setShowBulkPlanModal] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredClients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredClients.map(c => c._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(idx => idx !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportExcel = () => {
    const exportData = clients.map(c => ({
      Nome: c.name,
      Email: c.email,
      Telefone: c.phone,
      Instituicao: c.institution?.name || 'Individual',
      Status: c.status
    }));
    exportToExcel(exportData, `Clientes_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = [['Nome', 'Email', 'Telefone', 'Instituicao', 'Status']];
    const data = clients.map(c => [
      c.name,
      c.email,
      c.phone,
      c.institution?.name || 'Individual',
      c.status.toUpperCase()
    ]);
    exportToPDF('Listagem de Clientes', headers, data, `Clientes_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportSingleExcel = (c: Client) => {
    const exportData = [{
      Nome: c.name,
      Email: c.email,
      Telefone: c.phone,
      Instituicao: c.institution?.name || 'Individual',
      Status: c.status,
      Ciclo: c.billingCycle || 'N/A',
      'Vencimento Preferencial': c.preferredPaymentDate ? new Date(c.preferredPaymentDate).toLocaleDateString() : 'N/A'
    }];
    exportToExcel(exportData, `Cliente_${c.name}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportSinglePDF = (c: Client) => {
    const headers = [['Campo', 'Informação']];
    const data = [
      ['Nome', c.name],
      ['Email', c.email],
      ['Telefone', c.phone],
      ['Instituição', c.institution?.name || 'Particular'],
      ['Status', c.status.toUpperCase()],
      ['Ciclo de Faturação', c.billingCycle || 'Mensal'],
      ['Vencimento Preferencial', c.preferredPaymentDate ? new Date(c.preferredPaymentDate).toLocaleDateString() : 'N/A']
    ];
    exportToPDF(`Relatório de Cliente - ${c.name}`, headers, data, `Cliente_${c.name}_${new Date().toISOString().split('T')[0]}`);
  };

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (err) {
      console.error('Erro ao procurar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const { data } = await api.get('/institutions');
      setInstitutions(data);
    } catch (err) {
      console.error('Erro ao procurar instituições:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/plans');
      setPlans(data);
    } catch (err) {
      console.error('Erro ao procurar planos:', err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchInstitutions();
    fetchPlans();
  }, []);

  const fetchMembers = async (clientId: string) => {
    setMemberLoading(true);
    try {
      const { data } = await api.get(`/members?clientId=${clientId}`);
      setMembers(data);
    } catch (err) {
      console.error('Erro ao procurar membros:', err);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProfileClient) {
      fetchMembers(selectedProfileClient._id);
    }
  }, [selectedProfileClient]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileClient) return;
    setMemberLoading(true);
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember._id}`, memberFormData);
      } else {
        await api.post('/members', {
          ...memberFormData,
          primaryClient: selectedProfileClient._id
        });
      }
      setShowMemberModal(false);
      setEditingMember(null);
      setMemberFormData({ name: '', relationship: 'filho', birthDate: '', documentNumber: '', phone: '' });
      fetchMembers(selectedProfileClient._id);
    } catch (err) {
      alert('Erro ao guardar membro');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Certeza que deseja remover este membro?')) return;
    try {
      await api.delete(`/members/${memberId}`);
      if (selectedProfileClient) fetchMembers(selectedProfileClient._id);
    } catch (err) {
      alert('Erro ao remover membro');
      console.error('Erro ao apagar membro:', err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja remover este cliente?')) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch (err) {
      alert('Erro ao remover cliente');
      console.error('Erro ao apagar cliente:', err);
    }
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      documentId: client.documentId,
      address: client.address || '',
      status: client.status,
      institution: client.institution?._id || '',
      billingCycle: client.billingCycle || 'monthly',
      preferredPaymentDate: client.preferredPaymentDate ? new Date(client.preferredPaymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setUploading(true);
    let documentsUrls = { ...editingClient.documents };

    try {
      if (idFrontFile || idBackFile || addressFile) {
        const formDataUpload = new FormData();
        if (idFrontFile) formDataUpload.append('identificationFront', idFrontFile);
        if (idBackFile) formDataUpload.append('identificationBack', idBackFile);
        if (addressFile) formDataUpload.append('addressProof', addressFile);

        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (uploadRes.data.success) {
          documentsUrls = { ...documentsUrls, ...uploadRes.data.documents };
        }
      }

      await api.patch(`/clients/${editingClient._id}`, {
        ...formData,
        documents: documentsUrls
      });
      setShowEditModal(false);
      setEditingClient(null);
      setFormData({ 
        name: '', email: '', phone: '', documentId: '', address: '', status: 'active', institution: '',
        billingCycle: 'monthly', preferredPaymentDate: new Date().toISOString().split('T')[0]
      });
      setIdFrontFile(null);
      setIdBackFile(null);
      setAddressFile(null);
      alert('Cliente atualizado com sucesso');
      fetchClients();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao atualizar cliente';
      alert(msg);
      console.error('Update Error:', err.response?.data);
    } finally {
      setUploading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let documentsUrls = {};

    try {
      if (idFrontFile || idBackFile || addressFile) {
        const formDataUpload = new FormData();
        if (idFrontFile) formDataUpload.append('identificationFront', idFrontFile);
        if (idBackFile) formDataUpload.append('identificationBack', idBackFile);
        if (addressFile) formDataUpload.append('addressProof', addressFile);

        const uploadRes = await api.post('/upload', formDataUpload, {
          headers: { 
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (uploadRes.data.success) {
          documentsUrls = uploadRes.data.documents;
        }
      }

      await api.post('/clients', {
        ...formData,
        documents: documentsUrls
      });
      setShowAddModal(false);
      setFormData({ 
        name: '', email: '', phone: '', documentId: '', address: '', status: 'active', institution: '',
        billingCycle: 'monthly', preferredPaymentDate: new Date().toISOString().split('T')[0]
      });
      setIdFrontFile(null);
      setIdBackFile(null);
      setAddressFile(null);
      fetchClients();
    } catch (err) {
      alert('Erro ao registar cliente');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkAssociate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPlanId || selectedIds.length === 0) return;
    
    setIsProcessingBulk(true);
    let successCount = 0;
    
    try {
      for (const clientId of selectedIds) {
        const client = clients.find(c => c._id === clientId);
        const plan = plans.find(p => p._id === bulkPlanId);
        
        if (client && plan) {
          await api.post('/sales', {
            client: clientId,
            plan: bulkPlanId,
            value: plan.priceMonthly,
            paymentMethod: 'm-pesa',
            status: 'pending',
            notes: 'Associação em massa via Gestão de Clientes',
            beneficiaries: [{ kind: 'Client', person: clientId }]
          });
          successCount++;
        }
      }
      
      alert(`${successCount} clientes associados ao plano com sucesso!`);
      setSelectedIds([]);
      setShowBulkPlanModal(false);
      setBulkPlanId('');
      fetchClients();
    } catch (err) {
      alert('Ocorreu um erro ao processar algumas associações.');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Deseja remover os ${selectedIds.length} clientes selecionados?`)) return;
    
    setLoading(true);
    try {
      for (const id of selectedIds) {
        await api.delete(`/clients/${id}`);
      }
      setSelectedIds([]);
      fetchClients();
      alert('Clientes removidos com sucesso');
    } catch (err) {
      alert('Erro ao remover alguns clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => {
    // Only show active (approved) clients in the main list
    if (c.status !== 'active') return false;

    const nameMatch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const docMatch = c.documentId?.includes(searchTerm);
    
    return (nameMatch || emailMatch || docMatch);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Clientes</h1>
          <p className="text-gray-400 mt-1">Administre a sua carteira de clientes e leads.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExportExcel}
            className="bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, email ou BI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-xl border border-gray-700 hover:bg-gray-700/30 transition-all text-sm">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Clients Table */}
      <div className="bg-gray-800/40 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-700/50">
                <th className="px-4 py-4 w-10">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filteredClients.length && filteredClients.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-900/50 text-blue-500 focus:ring-blue-500/40"
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Instituição / B2B</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Dependentes</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data de Registo</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                       <Clock className="w-5 h-5 animate-spin" />
                       Procurando clientes...
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client._id} className={`hover:bg-gray-700/20 transition-colors group ${selectedIds.includes(client._id) ? 'bg-blue-500/5' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(client._id)}
                          onChange={() => toggleSelectOne(client._id)}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-900/50 text-blue-500 focus:ring-blue-500/40"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                          {client.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-white">{client.name}</div>
                          <div className="text-xs text-gray-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-sm font-bold text-primary-400 bg-primary-500/5 px-2 py-1 rounded border border-primary-500/10 w-fit">
                          Dia {client.preferredPaymentDate ? new Date(client.preferredPaymentDate).getUTCDate() : '5'}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.institution ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-lg border border-primary-500/20 w-fit">
                          <FileText className="w-3 h-3" />
                          {client.institution.name}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600 italic">Particular</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-white/5 text-xs font-bold text-slate-300">
                        <Users className="w-3 h-3 text-primary-400" />
                        {client.memberCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        client.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        client.status === 'lead' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(client.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setSelectedProfileClient(client)} 
                           className="p-1.5 text-slate-500 hover:text-primary-400 bg-slate-800/50 hover:bg-primary-500/10 rounded-lg transition-colors border border-transparent hover:border-primary-500/20" 
                           title="Ver Perfil Completo"
                         >
                          <Eye className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => setSelectedProfileClient(client)} 
                           className="p-1.5 text-slate-500 hover:text-primary-400 bg-slate-800/50 hover:bg-primary-500/10 rounded-lg transition-colors border border-transparent hover:border-primary-500/20" 
                           title="Gerir Dependentes"
                         >
                          <Users className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => handleEditClick(client)} 
                           className="p-1.5 text-slate-500 hover:text-amber-400 bg-slate-800/50 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20" 
                           title="Editar Cliente"
                         >
                           <Pencil className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => handleDeleteClient(client._id)} 
                           className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-800/50 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" 
                           title="Remover Cliente"
                         >
                          <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-gray-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Novo Cliente</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Telefone / Contacto</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">BI / NUIT</label>
                  <input 
                    type="text" 
                    required
                    value={formData.documentId}
                    onChange={(e) => setFormData({...formData, documentId: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Instituição / Empresa (B2B)</label>
                  <select 
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="">Particular / Individual</option>
                    {institutions.map(inst => (
                      <option key={inst._id} value={inst._id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Morada</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Ex: Maputo, Av. 25 de Setembro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Ciclo de Faturação</label>
                  <select 
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="monthly">Mensal (30 dias)</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="annually">Anual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Data de Vencimento Preferencial</label>
                  <input 
                    type="date"
                    required
                    value={formData.preferredPaymentDate}
                    onChange={(e) => setFormData({...formData, preferredPaymentDate: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 color-scheme-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">BI/Passaporte (Frente)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-gray-900/50 border border-gray-700 border-dashed rounded-xl py-2.5 px-4 text-sm text-gray-400 flex items-center gap-2 overflow-hidden">
                      <UploadCloud className="w-4 h-4 shrink-0 text-blue-400" />
                      <span className="truncate">{idFrontFile ? idFrontFile.name : 'Anexar frente'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">BI/Passaporte (Verso)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-gray-900/50 border border-gray-700 border-dashed rounded-xl py-2.5 px-4 text-sm text-gray-400 flex items-center gap-2 overflow-hidden">
                      <UploadCloud className="w-4 h-4 shrink-0 text-blue-400" />
                      <span className="truncate">{idBackFile ? idBackFile.name : 'Anexar verso'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Fatura Água/Energia</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => setAddressFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-gray-900/50 border border-gray-700 border-dashed rounded-xl py-2.5 px-4 text-sm text-gray-400 flex items-center gap-2 overflow-hidden">
                      <UploadCloud className="w-4 h-4 shrink-0 text-blue-400" />
                      <span className="truncate">{addressFile ? addressFile.name : 'Anexar fatura'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <><Clock className="w-4 h-4 animate-spin" /> Registando...</>
                  ) : (
                    'Registar Cliente'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Profile Modal */}
      {selectedProfileClient && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-gray-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card border border-gray-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex justify-between items-center shadow-lg shadow-black/20">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-black text-xl font-outfit">
                    {selectedProfileClient.name[0]}
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white font-outfit uppercase tracking-tighter leading-none">{selectedProfileClient.name}</h2>
                    <p className="text-[10px] text-primary-400 font-black uppercase tracking-widest mt-1">Perfil Detalhado do Cliente</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => handleExportSingleExcel(selectedProfileClient)}
                   className="p-2.5 text-emerald-400 hover:bg-emerald-500/10 bg-slate-900 border border-emerald-500/20 rounded-xl transition-all" 
                   title="Exportar Excel"
                 >
                   <FileSpreadsheet className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={() => handleExportSinglePDF(selectedProfileClient)}
                   className="p-2.5 text-rose-400 hover:bg-rose-500/10 bg-slate-900 border border-rose-500/20 rounded-xl transition-all" 
                   title="Exportar PDF"
                 >
                   <Download className="w-5 h-5" />
                 </button>
                 <div className="w-px h-6 bg-gray-700 mx-1"></div>
                 <button onClick={() => setSelectedProfileClient(null)} className="p-2 text-gray-500 hover:text-white bg-slate-900 border border-gray-700 rounded-xl">
                   <X className="w-5 h-5" />
                 </button>
              </div>
            </div>
            
            <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <section className="space-y-6">
                    <div>
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" /> Dados Pessoais
                       </h4>
                       <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 space-y-4">
                          <div>
                             <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Identificação / BI</p>
                             <p className="text-sm font-bold text-white tracking-widest">{selectedProfileClient.documentId}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Email de Contacto</p>
                             <p className="text-sm font-bold text-white">{selectedProfileClient.email}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Telefone</p>
                             <p className="text-sm font-bold text-white">{selectedProfileClient.phone}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Localização / Morada</p>
                             <p className="text-sm font-bold text-white">{selectedProfileClient.address || 'Não especificada'}</p>
                          </div>
                       </div>
                    </div>
                 </section>

                 <section className="space-y-6">
                    <div>
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5" /> Faturação & Plano
                       </h4>
                       <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 space-y-4">
                          <div>
                             <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Estado de Conta</p>
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                selectedProfileClient.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                             }`}>
                                {selectedProfileClient.status}
                             </span>
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Ciclo de Pagamentos</p>
                             <p className="text-sm font-bold text-primary-400 uppercase">{selectedProfileClient.billingCycle || 'Mensal'}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Vencimento Programado</p>
                             <p className="text-sm font-bold text-white">
                                {selectedProfileClient.preferredPaymentDate ? `Dia ${new Date(selectedProfileClient.preferredPaymentDate).getDate()}` : 'Padrao (Dia 5)'}
                             </p>
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Instituição Relacionada (B2B)</p>
                             <p className="text-sm font-bold text-white uppercase">{selectedProfileClient.institution?.name || 'CLIENTE PARTICULAR'}</p>
                          </div>
                       </div>
                    </div>
                 </section>
              </div>

              {/* Members (Dependents) Section */}
              <div className="pt-4 border-t border-white/5">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <Users className="w-3.5 h-3.5" /> Membros Representados (Dependentes)
                    </h4>
                    <button 
                      onClick={() => {
                        setEditingMember(null);
                        setMemberFormData({ name: '', relationship: 'filho', birthDate: '', documentNumber: '', phone: '' });
                        setShowMemberModal(true);
                      }}
                      className="bg-primary-600/20 hover:bg-primary-600 px-3 py-1.5 rounded-lg text-primary-400 hover:text-white text-[10px] font-black uppercase transition-all flex items-center gap-1.5 border border-primary-600/30"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                 </div>
                 <div className="space-y-3">
                    {memberLoading ? (
                      <div className="text-center py-6 text-slate-600 text-xs flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 animate-spin" /> Carregando membros...
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-6 text-slate-600 text-xs italic bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                        Nenhum membro (dependente) associado.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {members.map(member => (
                          <div key={member._id} className="bg-slate-900 border border-white/5 p-3 rounded-xl flex items-center justify-between group hover:bg-slate-800 transition-all">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                 {member.relationship[0]}
                               </div>
                               <div>
                                 <div className="text-xs font-bold text-slate-200">{member.name}</div>
                                 <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                   {member.relationship} • {new Date().getFullYear() - new Date(member.birthDate).getFullYear()} anos
                                 </div>
                               </div>
                             </div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button 
                                 onClick={() => {
                                   setEditingMember(member);
                                   setMemberFormData({
                                     name: member.name,
                                     relationship: member.relationship,
                                     birthDate: new Date(member.birthDate).toISOString().split('T')[0],
                                     documentNumber: member.documentNumber || '',
                                     phone: member.phone || ''
                                   });
                                   setShowMemberModal(true);
                                 }}
                                 className="p-1.5 text-slate-500 hover:text-amber-400 bg-slate-800 rounded-lg"
                               >
                                 <Pencil className="w-3 h-3" />
                               </button>
                               <button 
                                 onClick={() => handleDeleteMember(member._id)}
                                 className="p-1.5 text-slate-500 hover:text-red-400 bg-slate-800 rounded-lg"
                                >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>

              {/* Documents Section */}
              <div className="pt-4 border-t border-white/5">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Arquivo de Documentos (Uploads)
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProfileClient.documents?.identificationFrontUrl && (
                      <div className="group bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-white/5 flex items-center justify-between transition-all">
                        <div className="flex items-center gap-3">
                           {selectedProfileClient.documents.identificationFrontUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                             <img 
                               src={selectedProfileClient.documents.identificationFrontUrl} 
                               alt="BI Frente" 
                               className="w-10 h-8 object-cover rounded border border-white/10"
                             />
                           ) : (
                             <div className="w-10 h-8 bg-slate-800 rounded border border-white/10 flex items-center justify-center">
                               <FileText className="w-4 h-4 text-primary-400" />
                             </div>
                           )}
                           <div>
                             <span className="text-xs font-bold text-slate-300 block">BI Frente</span>
                             <button onClick={() => window.open(selectedProfileClient.documents!.identificationFrontUrl, '_blank')} className="text-[9px] font-black uppercase text-primary-400 hover:text-white underline tracking-widest mt-1">Ver Original</button>
                           </div>
                        </div>
                      </div>
                    )}
                    {selectedProfileClient.documents?.identificationBackUrl && (
                      <div className="group bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-white/5 flex items-center justify-between transition-all">
                        <div className="flex items-center gap-3">
                           {selectedProfileClient.documents.identificationBackUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                             <img 
                               src={selectedProfileClient.documents.identificationBackUrl} 
                               alt="BI Verso" 
                               className="w-10 h-8 object-cover rounded border border-white/10"
                             />
                           ) : (
                             <div className="w-10 h-8 bg-slate-800 rounded border border-white/10 flex items-center justify-center">
                               <FileText className="w-4 h-4 text-primary-400" />
                             </div>
                           )}
                           <div>
                             <span className="text-xs font-bold text-slate-300 block">BI Verso</span>
                             <button onClick={() => window.open(selectedProfileClient.documents!.identificationBackUrl, '_blank')} className="text-[9px] font-black uppercase text-primary-400 hover:text-white underline tracking-widest mt-1">Ver Original</button>
                           </div>
                        </div>
                      </div>
                    )}
                    {selectedProfileClient.documents?.addressProofUrl && (
                      <div className="group bg-slate-900 hover:bg-slate-800 p-4 rounded-xl border border-white/5 flex items-center justify-between transition-all">
                        <div className="flex items-center gap-3">
                           {selectedProfileClient.documents.addressProofUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                             <img 
                               src={selectedProfileClient.documents.addressProofUrl} 
                               alt="Residência" 
                               className="w-10 h-8 object-cover rounded border border-white/10"
                             />
                           ) : (
                             <div className="w-10 h-8 bg-slate-800 rounded border border-white/10 flex items-center justify-center">
                               <FileText className="w-4 h-4 text-primary-400" />
                             </div>
                           )}
                           <div>
                             <span className="text-xs font-bold text-slate-300 block">Comprov. Morada</span>
                             <button onClick={() => window.open(selectedProfileClient.documents!.addressProofUrl, '_blank')} className="text-[9px] font-black uppercase text-primary-400 hover:text-white underline tracking-widest mt-1">Ver Original</button>
                           </div>
                        </div>
                      </div>
                    )}
                    {Object.keys(selectedProfileClient.documents || {}).length === 0 && (
                      <div className="md:col-span-2 text-center py-6 text-slate-600 text-xs italic">Nenhum documento anexado.</div>
                    )}
                 </div>
              </div>
            </div>
            <div className="p-6 bg-slate-900 border-t border-gray-700 font-bold text-[10px] text-slate-600 text-center uppercase tracking-tighter">
               Registado em: {new Date(selectedProfileClient.createdAt).toLocaleString('pt-PT')}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-gray-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card border border-gray-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white font-outfit">Editar Cliente</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Telefone / Contacto</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Estado</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="lead">Lead / Potencial</option>
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Instituição / Empresa (B2B)</label>
                  <select 
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="">Particular / Individual</option>
                    {institutions.map(inst => (
                      <option key={inst._id} value={inst._id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Morada</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Ciclo de Faturação</label>
                  <select 
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({...formData, billingCycle: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="monthly">Mensal (30 dias)</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="annually">Anual</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Data Exata de Pagamento</label>
                  <input 
                    type="date"
                    required
                    value={formData.preferredPaymentDate}
                    onChange={(e) => setFormData({...formData, preferredPaymentDate: e.target.value})}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 color-scheme-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">BI/Passaporte (Frente)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-gray-900/50 border border-gray-700 border-dashed rounded-xl py-2.5 px-4 text-sm text-gray-400 flex items-center gap-2 overflow-hidden">
                      <UploadCloud className="w-4 h-4 shrink-0 text-primary-400" />
                      <span className="truncate">{idFrontFile ? idFrontFile.name : (editingClient?.documents?.identificationFrontUrl ? 'Alterar frente' : 'Anexar frente')}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">BI/Passaporte (Verso)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-gray-900/50 border border-gray-700 border-dashed rounded-xl py-2.5 px-4 text-sm text-gray-400 flex items-center gap-2 overflow-hidden">
                      <UploadCloud className="w-4 h-4 shrink-0 text-primary-400" />
                      <span className="truncate">{idBackFile ? idBackFile.name : (editingClient?.documents?.identificationBackUrl ? 'Alterar verso' : 'Anexar verso')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase ml-1 tracking-widest">Fatura Água/Energia</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => setAddressFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full bg-gray-900/50 border border-gray-700 border-dashed rounded-xl py-2.5 px-4 text-sm text-gray-400 flex items-center gap-2 overflow-hidden">
                      <UploadCloud className="w-4 h-4 shrink-0 text-primary-400" />
                      <span className="truncate">{addressFile ? addressFile.name : (editingClient?.documents?.addressProofUrl ? 'Alterar fatura' : 'Anexar fatura')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20 disabled:opacity-50"
                >
                  {uploading ? (
                    <><Clock className="w-4 h-4 animate-spin" /> Atualizando...</>
                  ) : (
                    'Atualizar Dados'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Member Modal (Add/Edit Dependent) */}
      {showMemberModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-md">
          <div className="glass-card border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
              <h2 className="text-xl font-bold text-white font-outfit uppercase tracking-tight">
                {editingMember ? 'Editar Dependente' : 'Novo Dependente'}
              </h2>
              <button onClick={() => setShowMemberModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={memberFormData.name}
                  onChange={(e) => setMemberFormData({...memberFormData, name: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                  placeholder="Nome do membro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parentesco</label>
                  <select 
                    value={memberFormData.relationship}
                    onChange={(e) => setMemberFormData({...memberFormData, relationship: e.target.value as any})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all font-bold"
                  >
                    <option value="filho">Filho(a)</option>
                    <option value="conjuge">Cônjuge</option>
                    <option value="pai">Pai</option>
                    <option value="mae">Mãe</option>
                    <option value="irmao">Irmão(ã)</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Nasc.</label>
                  <input 
                    type="date" 
                    required
                    value={memberFormData.birthDate}
                    onChange={(e) => setMemberFormData({...memberFormData, birthDate: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all color-scheme-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Documento (BI)</label>
                  <input 
                    type="text" 
                    value={memberFormData.documentNumber}
                    onChange={(e) => setMemberFormData({...memberFormData, documentNumber: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contacto</label>
                  <input 
                    type="text" 
                    value={memberFormData.phone}
                    onChange={(e) => setMemberFormData({...memberFormData, phone: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={memberLoading}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20 disabled:opacity-50"
                >
                  {memberLoading ? (
                    <><Clock className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    editingMember ? 'Atualizar Membro' : 'Adicionar Membro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
           <div className="bg-slate-900/90 backdrop-blur-xl border border-primary-500/30 px-6 py-4 rounded-3xl shadow-2xl shadow-primary-500/10 flex items-center gap-8 min-w-[500px]">
              <div className="flex items-center gap-3 pr-8 border-r border-white/10">
                 <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center text-white font-black shadow-lg shadow-primary-500/20">
                    {selectedIds.length}
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-primary-400 uppercase tracking-widest leading-none mb-1">Selecionados</div>
                    <div className="text-sm font-bold text-white whitespace-nowrap">Gestão de Lote</div>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setShowBulkPlanModal(true)}
                   className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-primary-600/10"
                 >
                    <CheckCircle className="w-4 h-4" /> Associar a Plano
                 </button>
                 <button 
                   onClick={handleDeleteSelected}
                   className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-rose-500/20"
                 >
                    <Trash2 className="w-4 h-4" /> Remover
                 </button>
                 <button 
                   onClick={() => setSelectedIds([])}
                   className="text-slate-500 hover:text-white px-3 py-2 text-xs font-bold transition-colors"
                 >
                    Desselecionar Tudo
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Bulk Associate Modal */}
      {showBulkPlanModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="glass-card border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tighter">Associação em Massa</h2>
                <p className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">Atribuir plano a {selectedIds.length} clientes</p>
              </div>
              <button onClick={() => setShowBulkPlanModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleBulkAssociate} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Selecionar Plano de Saúde</label>
                  <select 
                    required
                    value={bulkPlanId}
                    onChange={(e) => setBulkPlanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all font-bold"
                  >
                    <option value="">Escolha um plano...</option>
                    {plans.map(p => (
                      <option key={p._id} value={p._id}>{p.name} - {p.priceMonthly.toLocaleString()} MT</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-primary-500/5 border border-primary-500/20 rounded-xl p-4 flex gap-3 items-start">
                   <div className="p-2 bg-primary-500/10 rounded-lg">
                      <Clock className="w-4 h-4 text-primary-400" />
                   </div>
                   <p className="text-xs text-slate-400 leading-relaxed">
                      Ao confirmar, o sistema criará <span className="text-white font-bold">{selectedIds.length} registos de venda</span> pendentes de aprovação. O método de pagamento padrão será M-Pesa.
                   </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowBulkPlanModal(false)}
                  className="flex-1 px-4 py-3 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors bg-slate-900 border border-white/5 rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isProcessingBulk || !bulkPlanId}
                  className="flex-[2] bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 disabled:opacity-50"
                >
                  {isProcessingBulk ? (
                    <><Clock className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    'Confirmar Associação'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
