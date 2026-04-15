import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { useAuthStore } from '../../src/store/authStore';
import axios from 'axios';
import { API_URL } from '../../src/config';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statHeader}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}1A` }]}>
        <Icon size={20} color={color} />
      </View>
      {trend && (
        <View style={styles.trendBadge}>
          <Text style={styles.trendText}>{trend}</Text>
        </View>
      )}
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function DashboardScreen() {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    todaySalesCount: 0,
    totalClients: 0,
    todayClients: 0,
    pendingCommissions: 0,
    salesProcessed: 0
  });
  const [activities, setActivities] = useState<any[]>([]);

  const fetchStats = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      const [statsRes, activitiesRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/dashboard/activities`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setStats(statsRes.data);
      setActivities(activitiesRes.data);
    } catch (err) {
      console.error('Erro ao procurar estatísticas');
      setError('Não foi possível carregar as estatísticas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = React.useCallback(() => {
    fetchStats(true);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Olá, {user?.name || 'Corretor'}</Text>
            <Text style={styles.titleText}>Resumo de Hoje</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Icons.Bell size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Icons.AlertCircle size={18} color="#F87171" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchStats()}>
              <Text style={styles.retryText}>Tentar de novo</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
          <StatCard 
            title="Vendas (Hoje)" 
            value={`${stats.todaySales.toLocaleString()} MT`} 
            icon={Icons.TrendingUp} 
            trend={stats.todaySalesCount > 0 ? `+${stats.todaySalesCount}` : undefined} 
            color="#3B82F6" 
          />
          <StatCard 
            title="Clientes (Hoje)" 
            value={stats.todayClients} 
            icon={Icons.Users} 
            trend={stats.todayClients > 0 ? `+${stats.todayClients}` : undefined} 
            color="#8B5CF6" 
          />
          <StatCard 
            title="Comissões" 
            value={`${stats.pendingCommissions.toLocaleString()} MT`} 
            icon={Icons.DollarSign} 
            color="#10B981" 
          />
          <StatCard 
            title="Total Vendas" 
            value={`${stats.totalSales.toLocaleString()} MT`} 
            icon={Icons.Briefcase} 
            color="#F59E0B" 
          />
          </View>
        )}

        {/* Recent Actions Placeholder */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ações Recentes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentList}>
          {activities.length > 0 ? activities.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.recentItem}>
              <View style={[styles.itemIcon, { backgroundColor: activity.type === 'sale' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                {activity.type === 'sale' ? <Icons.TrendingUp size={18} color="#3B82F6" /> : <Icons.UserPlus size={18} color="#10B981" />}
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemName}>{activity.title}</Text>
                <Text style={styles.itemDate}>
                  {formatDistanceToNow(new Date(activity.timestamp))} • {activity.subtitle}
                </Text>
              </View>
              <View style={styles.valueContainer}>
                 <Text style={styles.valueText}>{activity.value}</Text>
                 <Icons.ChevronRight size={14} color="#4B5563" />
              </View>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyText}>Sem atividades recentes.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  welcomeText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1F2937CC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  statTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  recentList: {
    backgroundColor: '#1F2937CC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 8,
    marginBottom: 40,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  itemDate: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  errorIcon: {
    marginRight: 0,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  retryText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  valueText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyActivity: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 12,
  }
});

function formatDistanceToNow(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Agora mesmo';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Há ${diffInHours} h`;
  
  return date.toLocaleDateString();
}
