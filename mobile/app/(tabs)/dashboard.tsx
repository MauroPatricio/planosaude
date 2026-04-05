import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Briefcase, 
  Search, 
  Bell,
  ChevronRight
} from 'lucide-react-native';
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
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalClients: 0,
    pendingCommissions: 0,
    salesProcessed: 0
  });

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(data);
    } catch (err) {
      console.error('Erro ao procurar estatísticas');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats().then(() => setRefreshing(false));
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
            <Bell size={24} color="#FFFFFF" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Vendas Totais" 
            value={`${stats.totalSales.toLocaleString()} MT`} 
            icon={TrendingUp} 
            trend="+12%" 
            color="#3B82F6" 
          />
          <StatCard 
            title="Novos Clientes" 
            value={stats.totalClients} 
            icon={Users} 
            trend="+3%" 
            color="#8B5CF6" 
          />
          <StatCard 
            title="Comissões" 
            value={`${stats.pendingCommissions.toLocaleString()} MT`} 
            icon={DollarSign} 
            color="#10B981" 
          />
          <StatCard 
            title="Emitidas" 
            value={stats.salesProcessed} 
            icon={Briefcase} 
            trend="+18%" 
            color="#F59E0B" 
          />
        </View>

        {/* Recent Actions Placeholder */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ações Recentes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentList}>
          <TouchableOpacity style={styles.recentItem}>
            <View style={[styles.itemIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Search size={18} color="#3B82F6" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>Nova Proposta Emitida</Text>
              <Text style={styles.itemDate}>Há 2 horas • Plano Plátino</Text>
            </View>
            <ChevronRight size={18} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.recentItem}>
            <View style={[styles.itemIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Users size={18} color="#10B981" />
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>Novo Lead Registado</Text>
              <Text style={styles.itemDate}>Há 5 horas • Maria Silva</Text>
            </View>
            <ChevronRight size={18} color="#4B5563" />
          </TouchableOpacity>
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
  }
});
