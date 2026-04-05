import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Users, TrendingUp, DollarSign, Briefcase, 
  ArrowUpRight, ArrowDownRight, FileText, Activity, CheckCircle,
  Shield, Zap, AlertTriangle, Info, Filter, Download, Plus, Calendar, Clock
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

// Data will be fetched from API

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
  const { token, user } = useAuthStore();
  const [stats, setStats] = React.useState({
    totalSales: 0,
    totalClients: 0,
    pendingCommissions: 0,
    salesProcessed: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [b2bStats, setB2bStats] = useState<any>(null);
  const [intelligentData, setIntelligentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'last30',
    brokerId: '',
    institutionId: ''
  });
  const [dropdowns, setDropdowns] = useState({ brokers: [], institutions: [] });
  const { socket } = useSocket();

  const fetchDashboardData = async () => {
    try {
      const params = { 
        period: filters.period, 
        brokerId: filters.brokerId, 
        institutionId: filters.institutionId 
      };
      
      const config = { headers: { Authorization: `Bearer ${token}` }, params };
      
      const [statsRes, chartsRes, b2bRes, activitiesRes, intelRes, brokersRes, instsRes] = await Promise.all([
        axios.get('/api/dashboard/stats', config),
        axios.get('/api/dashboard/charts', config),
        axios.get('/api/institutions/stats/global', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/dashboard/activities', config),
        axios.get('/api/dashboard/intelligent', config),
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/institutions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setStats(statsRes.data);
      setChartData(chartsRes.data);
      setB2bStats(b2bRes.data);
      setActivities(activitiesRes.data);
      setIntelligentData(intelRes.data);
      setDropdowns({
        brokers: (brokersRes.data || []).filter((u: any) => u.role === 'broker' || u.role === 'manager'),
        institutions: instsRes.data || []
      });
    } catch (err) {
      console.error('Erro ao procurar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
  }, [token, filters]);

  useEffect(() => {
    if (!socket) return;

    socket.on('sale:created', () => {
      console.log('New sale detected via Socket.io - Updating Dashboard');
      fetchDashboardData();
    });

    socket.on('sale:updated', () => {
      console.log('Sale update detected via Socket.io - Updating Dashboard');
      fetchDashboardData();
    });

    return () => {
      socket.off('sale:created');
      socket.off('sale:updated');
    };
  }, [socket, token]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight font-outfit mb-2 flex items-center gap-3">
             Dashboard Inteligente 
             <Zap className="w-6 h-6 text-primary-400 animate-pulse" />
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
            Bem-vindo ao centro de operações. Filtre os indicadores abaixo para uma análise detalhada.
          </p>
        </div>
        
        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filtros</span>
           </div>
           
           <select 
              value={filters.period}
              onChange={(e) => setFilters({...filters, period: e.target.value})}
              className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 cursor-pointer min-w-[120px]"
           >
              <option value="last7">Últimos 7 dias</option>
              <option value="last30">Últimos 30 dias</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="1year">Último ano</option>
           </select>

           {user?.role === 'admin' && (
             <>
               <select 
                  value={filters.brokerId}
                  onChange={(e) => setFilters({...filters, brokerId: e.target.value})}
                  className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 cursor-pointer min-w-[140px] border-l border-white/10 pl-3"
               >
                  <option value="">Todos os Corretores</option>
                  {dropdowns.brokers.map((b: any) => <option key={b._id} value={b._id}>{b.name}</option>)}
               </select>

               <select 
                  value={filters.institutionId}
                  onChange={(e) => setFilters({...filters, institutionId: e.target.value})}
                  className="bg-transparent text-sm font-bold text-white border-none focus:ring-0 cursor-pointer min-w-[140px] border-l border-white/10 pl-3"
               >
                  <option value="">Todas Instituições</option>
                  {dropdowns.institutions.map((i: any) => <option key={i._id} value={i._id}>{i.name}</option>)}
               </select>
             </>
           )}
        </div>
      </div>

      {/* Alerts & Insights Section */}
      {intelligentData && (intelligentData.alerts?.length > 0 || intelligentData.insights?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
           {/* Alerts */}
           <div className="space-y-3">
              {intelligentData.alerts.map((alert: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-xl border flex items-center gap-4 animate-in slide-in-from-left duration-300 ${
                  alert.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                   <AlertTriangle className="w-5 h-5 shrink-0" />
                   <p className="text-sm font-bold tracking-tight">{alert.message}</p>
                </div>
              ))}
           </div>
           {/* Insights */}
           <div className="space-y-3">
              {intelligentData.insights.map((insight: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center gap-4 animate-in slide-in-from-right duration-300">
                   <Info className="w-5 h-5 shrink-0" />
                   <p className="text-sm font-bold italic tracking-tight">{insight}</p>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Actions Bar (Advanced) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <button className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2">
            <Plus className="w-4.5 h-4.5" />
            Nova Proposta
          </button>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-bold">
             Saúde do Negócio: 
             <span className={`flex items-center gap-1.5 ${
               (intelligentData?.kpis?.payments?.defaultRate || 0) < 10 ? 'text-emerald-400' : (intelligentData?.kpis?.payments?.defaultRate || 0) < 20 ? 'text-amber-400' : 'text-rose-400'
             }`}>
                <Shield className="w-4 h-4" />
                {(intelligentData?.kpis?.payments?.defaultRate || 0) < 10 ? 'Saudável' : (intelligentData?.kpis?.payments?.defaultRate || 0) < 20 ? 'Atenção' : 'Crítico'}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-white/5 border border-white/5 transition-all">
            <Calendar className="w-5 h-5" />
          </button>
          <button 
            onClick={() => window.open(`/api/reports/sales?token=${token}`, '_blank')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all border border-white/5"
          >
            <Download className="w-4.5 h-4.5 text-primary-400" />
            Relatórios Customizados
          </button>
        </div>
      </div>

      {/* Stats Grid - Enhanced & Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 gap-6 mb-10">
        <StatCard 
          title="Receita Total" 
          value={`${stats.totalSales.toLocaleString()} MT`} 
          icon={TrendingUp} 
          color="bg-primary-500" 
        />
        <StatCard 
          title="Clientes Ativos" 
          value={intelligentData?.kpis?.clients?.active || 0} 
          icon={Users} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Novos (30d)" 
          value={intelligentData?.kpis?.clients?.new || 0} 
          icon={Plus} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Instituições" 
          value={intelligentData?.kpis?.institutions?.active || 0} 
          icon={Shield} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Pago" 
          value={`${(intelligentData?.kpis?.payments?.paid || 0).toLocaleString()} MT`} 
          icon={CheckCircle} 
          color="bg-emerald-400" 
        />
        <StatCard 
          title="Em Atraso" 
          value={`${(intelligentData?.kpis?.payments?.late || 0).toLocaleString()} MT`} 
          icon={AlertTriangle} 
          color="bg-rose-500" 
        />
        <StatCard 
          title="Conversão" 
          value={`${(intelligentData?.kpis?.conversion?.convRate || 0).toFixed(1)}%`} 
          icon={Zap} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Retenção" 
          value={`${(intelligentData?.kpis?.retention?.rate || 98.5).toFixed(1)}%`} 
          icon={Activity} 
          color="bg-teal-500" 
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
              <AreaChart data={chartData}>
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

        {/* Team Performance Ranking */}
        <div className="glass-card p-8 border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white font-outfit">Performance da Equipa</h3>
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest bg-primary-500/10 px-2 py-1 rounded">Ranking Geral</span>
          </div>
          <div className="space-y-6">
            {!intelligentData?.team || intelligentData.team.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 italic bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
                  Nenhum dado de performance disponível para este período.
               </div>
            ) : intelligentData.team.map((broker: any, idx: number) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-3">
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                       idx === 0 ? 'bg-amber-400 text-amber-950' : 
                       idx === 1 ? 'bg-slate-300 text-slate-900' : 
                       idx === 2 ? 'bg-orange-400 text-orange-950' : 'bg-slate-800 text-slate-400'
                     }`}>
                        {idx + 1}
                     </div>
                     <span className="text-sm font-bold text-white tracking-tight group-hover:text-primary-400 transition-colors">{broker.name}</span>
                  </div>
                  <span className="text-sm font-black text-white">{broker.value.toLocaleString()} MT</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000"
                     style={{ width: `${Math.min(100, (broker.value / (intelligentData.team[0]?.value || 1)) * 100)}%` }}
                   />
                </div>
                <div className="flex justify-between mt-1">
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{broker.count} apólices emitidas</span>
                   <span className="text-[10px] text-primary-400 font-bold uppercase tracking-tighter">Média: {(broker.value / (broker.count || 1)).toLocaleString()} MT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* B2B Insights & Top Institutions */}
      {b2bStats && b2bStats.topInstitutions?.length > 0 && (
        <div className="glass-card p-8 border-white/5 shadow-2xl mb-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white font-outfit">Top Instituições (B2B)</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Maiores contas corporativas</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {b2bStats.topInstitutions.map((inst: any) => (
              <div key={inst._id} className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-primary-500/30 transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 font-bold text-lg">
                    {inst.details.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{inst.details.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{inst.vendas} Vendas Ativas</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Volume Total</span>
                  <span className="text-sm font-bold text-emerald-400">{inst.revenue.toLocaleString()} MT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Feed (Real Data) */}
      <div className="glass-card p-8 border-white/5 shadow-2xl mb-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-400" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white font-outfit">Atividades Recentes</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Eventos reais da sua corretora</p>
             </div>
          </div>
          <button className="text-xs font-bold text-primary-400 hover:text-primary-300 uppercase tracking-widest transition-colors">Ver Tudo</button>
        </div>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic bg-slate-900/20 rounded-2xl border border-dashed border-slate-700">
               Nenhuma atividade recente registada. Comece a fechar negócios!
            </div>
          ) : activities.map((act) => (
            <div key={act.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-900/30 border border-white/5 hover:bg-slate-900/50 hover:border-primary-500/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  act.type === 'sale' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary-500/10 text-primary-400'
                }`}>
                  {act.type === 'sale' ? <Briefcase className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-tight group-hover:text-primary-400 transition-colors">{act.title}</p>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                    {act.subtitle}
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="text-[10px] text-slate-600 uppercase font-black tracking-tighter">
                       {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${act.type === 'sale' ? 'text-emerald-400' : 'text-primary-400'}`}>
                  {act.value}
                </p>
                <div className="flex items-center gap-1 justify-end mt-1">
                   {act.status === 'PAID' && <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />}
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{act.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
