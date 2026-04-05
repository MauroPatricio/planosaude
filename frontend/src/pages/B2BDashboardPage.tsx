import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, TrendingUp, DollarSign, Activity, 
  ArrowUpRight, ArrowDownRight, Briefcase, 
  Clock, Shield, Building2, UserCheck, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from 'recharts';

const B2BDashboardPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeEmployees: 0,
    monthlyCost: 0,
    claimsCount: 0,
    usageRate: 0
  });

  const fetchB2BData = async () => {
    try {
      // Mocking B2B data for now or fetching from a specific endpoint
      // const { data } = await axios.get('/api/dashboard/b2b', { headers: { Authorization: `Bearer ${token}` } });
      setStats({
        activeEmployees: 145,
        monthlyCost: 285000,
        claimsCount: 12,
        usageRate: 68
      });
    } catch (err) {
      console.error('Erro ao carregar dados B2B');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchB2BData();
  }, [token]);

  const costData = [
    { name: 'Jan', cost: 240000 },
    { name: 'Fev', cost: 265000 },
    { name: 'Mar', cost: 285000 },
  ];

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2 text-glow-blue">Portal RH Empresa</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">Visão estratégica de benefícios, custos e saúde do seu capital humano.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-white/5">
           <Building2 className="w-6 h-6 text-indigo-400 ml-2" />
           <div className="pr-4 border-r border-white/10 mr-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Empresa</p>
              <p className="text-sm font-bold text-white">Nhiquela Labs, Lda</p>
           </div>
           <button className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold transition-all border border-indigo-500/20">
              Relatório PDF
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Colaboradores Ativos', value: stats.activeEmployees, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Custo Mensal (MT)', value: stats.monthlyCost.toLocaleString(), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Sinistros este Mês', value: stats.claimsCount, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Taxa de Utilização', value: `${stats.usageRate}%`, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10' }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 border border-white/5 group hover:border-white/10 transition-all duration-300">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white font-outfit">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 glass-card border border-white/5 p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3 font-outfit">
              <TrendingUp className="text-emerald-400 w-5 h-5" />
              Evolução de Custos
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="cost" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card border border-white/5 p-8">
           <h3 className="text-xl font-bold text-white mb-6 font-outfit">Distribuição por Categoria</h3>
           <div className="space-y-6">
              {[
                { label: 'Plano Base', value: 85, color: 'bg-emerald-500' },
                { label: 'Plano Plus', value: 42, color: 'bg-blue-500' },
                { label: 'Plano Executive', value: 18, color: 'bg-indigo-500' },
              ].map((cat, i) => (
                <div key={i}>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-slate-400">{cat.label}</span>
                     <span className="text-white font-bold">{cat.value} colabs</span>
                   </div>
                   <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color}`} style={{ width: `${(cat.value/stats.activeEmployees)*100}%` }} />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="glass-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <h3 className="text-lg font-bold text-white font-outfit">Recém Admitidos no Seguro</h3>
           <button className="text-xs text-indigo-400 font-bold hover:underline">Gerir Colaboradores</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
               <tr className="bg-slate-900/50 border-b border-white/5 text-xs text-slate-500 uppercase tracking-widest font-black">
                 <th className="px-8 py-4">Colaborador</th>
                 <th className="px-8 py-4">Departamento</th>
                 <th className="px-8 py-4">Plano</th>
                 <th className="px-8 py-4">Data Início</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
               {[
                 { name: 'Ana Silva', dept: 'Marketing', plan: 'Executive', date: '2026-03-15' },
                 { name: 'Ricardo Santos', dept: 'TI', plan: 'Plus', date: '2026-03-10' },
                 { name: 'Marta Ferreira', dept: 'Vendas', plan: 'Base', date: '2026-03-01' },
               ].map((emp, i) => (
                 <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-4 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold">
                          {emp.name[0]}
                       </div>
                       <span className="text-white font-medium">{emp.name}</span>
                    </td>
                    <td className="px-8 py-4 text-slate-400 text-sm">{emp.dept}</td>
                    <td className="px-8 py-4 text-white text-sm font-bold">{emp.plan}</td>
                    <td className="px-8 py-4 text-slate-500 text-xs">{emp.date}</td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default B2BDashboardPage;
