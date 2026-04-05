import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Plus, Search, Filter, MoreVertical, 
  Mail, Shield, CheckCircle, Clock, X, Lock
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: 'superAdmin' | 'admin' | 'manager' | 'broker';
  isActive: boolean;
}

const roleMap: Record<string, { label: string, color: string }> = {
  admin: { label: 'Administrador', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  manager: { label: 'Gestor', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  broker: { label: 'Corretor', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

const TeamPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'broker'
  });

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(data);
    } catch (err) {
      console.error('Erro ao procurar membros da equipa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [token]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'broker' });
      fetchMembers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registar membro na equipa');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`/api/users/${id}/role`, { isActive: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMembers();
    } catch (err) {
      console.error('Erro ao alternar status do membro');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2">Equipa & Utilizadores</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Faça a gestão dos acessos à corretora e os cargos do seu staff.</p>
        </div>
        
        {['admin', 'manager'].includes(user?.role || '') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Colaborador
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="glass-card border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Procurar colaborador por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all text-white placeholder:text-slate-500"
          />
        </div>
        <button className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 transition-all text-sm">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Team Table */}
      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Colaborador</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cargo / Acesso</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                       <Clock className="w-5 h-5 animate-spin" />
                       A consultar utilizadores...
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : filteredMembers.map((member) => (
                <tr key={member._id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                        {member.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white">{member.name} {member._id === user?._id && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded ml-2">Voc&ecirc;</span>}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${roleMap[member.role]?.color || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {roleMap[member.role]?.label || member.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      member.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {member.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 relative">
                      {user?.role === 'admin' && member._id !== user?._id && (
                        <button 
                          onClick={() => handleToggleStatus(member._id, member.isActive)}
                          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                          {member.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
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
          <div className="glass-card border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white font-outfit">Convidar Colaborador</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 placeholder:text-slate-600"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 placeholder:text-slate-600"
                    placeholder="joao@corretora.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 placeholder:text-slate-600"
                      placeholder="Senha temporária"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Prestar Acesso</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  >
                    <option value="broker">Corretor / Agente Limitado</option>
                    <option value="manager">Gestor / Supervisor</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl flex gap-3 text-sm">
                <Mail className="w-5 h-5 text-primary-400 shrink-0" />
                <p className="text-slate-300">
                  Transmita a senha inicial (definida acima) em privado de forma segura. Após efetuar o login, o utilizador deverá alterar a sua nova conta.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 transition-all"
                >
                  Adicionar à Equipa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
