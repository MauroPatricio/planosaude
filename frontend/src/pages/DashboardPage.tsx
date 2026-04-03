import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Users, TrendingUp, DollarSign, Briefcase, 
  ArrowUpRight, ArrowDownRight, FileText
} from 'lucide-react';
import Layout from '../components/Layout';
import { useSocket } from '../context/SocketContext';

const data = [
  { name: 'Jan', vendas: 4000, comissoes: 2400 },
  { name: 'Fev', vendas: 3000, comissoes: 1398 },
  { name: 'Mar', vendas: 2000, comissoes: 9800 },
  { name: 'Abr', vendas: 2780, comissoes: 3908 },
  { name: 'Mai', vendas: 1890, comissoes: 4800 },
  { name: 'Jun', vendas: 2390, comissoes: 3800 },
];

const StatCard = ({ title, value, icon: Icon, trend, color, trendType = 'up' }: any) => (
  <div className="glass-card p-6 shadow-xl shadow-black/20 hover:border-primary-500/30 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 border border-current border-opacity-20 shadow-inner`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
          trendType === 'up' ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
        }`}>
          {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 opacity-70">{title}</h3>
      <p className="text-3xl font-bold text-white tracking-tight font-outfit">{value}</p>
    </div>
    <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Últimos 30 dias</span>
      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} w-2/3 rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]`} />
      </div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { token } = useAuthStore();
  const [stats, setStats] = React.useState({
    totalSales: 0,
    totalClients: 0,
    pendingCommissions: 0,
    salesProcessed: 0
  });
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(data);
    } catch (err) {
      console.error('Erro ao procurar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStats();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    socket.on('sale:created', () => {
      console.log('New sale detected via Socket.io - Updating Dashboard');
      fetchStats();
    });

    socket.on('sale:updated', () => {
      console.log('Sale update detected via Socket.io - Updating Dashboard');
      fetchStats();
    });

    return () => {
      socket.off('sale:created');
      socket.off('sale:updated');
    };
  }, [socket]);

  return (
    <Layout 
      title="Dashboard Overview" 
      subtitle="Bem-vindo de volta! Aqui está o resumo atualizado do seu desempenho e métricas de vendas."
    >
      {/* Actions Bar */}
      <div className="flex flex-wrap gap-4 mb-10">
        <button className="btn-primary">
          <TrendingUp className="w-4.5 h-4.5" />
          Nova Proposta
        </button>
        <button 
          onClick={() => window.open(`/api/reports/sales?token=${token}`, '_blank')}
          className="btn-secondary"
        >
          <FileText className="w-4.5 h-4.5" />
          Exportar Relatório (Excel)
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Vendas Totais" 
          value={`${stats.totalSales.toLocaleString()} MT`} 
          icon={TrendingUp} 
          trend="+12.5%" 
          color="bg-primary-500" 
        />
        <StatCard 
          title="Novos Clientes" 
          value={stats.totalClients} 
          icon={Users} 
          trend="+3%" 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Comissões Pendentes" 
          value={`${stats.pendingCommissions.toLocaleString()} MT`} 
          icon={DollarSign} 
          trend="-2.1%" 
          trendType="down"
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Vendas Emitidas" 
          value={stats.salesProcessed} 
          icon={Briefcase} 
          trend="+18%" 
          color="bg-amber-500" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        {/* Sales Chart */}
        <div className="glass-card p-8 border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white font-outfit">Fluxo de Vendas & Comissões</h3>
            <select className="bg-slate-800 border-none rounded-lg text-[10px] font-bold uppercase text-slate-400 focus:ring-0 cursor-pointer px-3 py-1.5 tracking-wider">
              <option>Últimos 6 meses</option>
              <option>Último ano</option>
            </select>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={15}
                  fontFamily="Inter"
                  fontWeight={600}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value/1000}k`}
                  fontFamily="Inter"
                  fontWeight={600}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  strokeWidth={3} 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="glass-card p-8 border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white font-outfit">Eficiência de Conversão</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Conversão</span>
              </div>
            </div>
          </div>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={15}
                  fontFamily="Inter"
                  fontWeight={600}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="Inter"
                  fontWeight={600}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Bar 
                  dataKey="comissoes" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                  animationDuration={2000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Mock (To feel "Full") */}
      <div className="glass-card p-8 border-white/5 shadow-2xl mb-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white font-outfit">Atividades Recentes</h3>
          <button className="text-xs font-bold text-primary-400 hover:text-primary-300 uppercase tracking-widest transition-colors">Ver Tudo</button>
        </div>
        <div className="space-y-6">
          {[1,2,3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-white/5 hover:bg-slate-900/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-500/10 group-hover:text-primary-400 transition-all">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight">Novo Cliente: João Silva</p>
                  <p className="text-xs text-slate-500 font-medium">Plano de Saúde Familiar • Há 2 horas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">+12.500 MT</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Emitido</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
