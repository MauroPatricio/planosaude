import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { 
  Shield, 
  ChevronRight, 
  CreditCard, 
  Users, 
  Activity,
  Bell,
  Clock,
  CheckCircle,
  HelpCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import axios from 'axios';
import { API_URL } from '../../src/config';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activePlans: 0,
    dependents: 0,
    nextPayment: 'N/A',
    score: 85
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // In a real device, replace with actual IP
      const baseUrl = 'http://10.0.2.2:5000/api';
      const [membersRes, invoicesRes] = await Promise.all([
        axios.get(`${baseUrl}/clients/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseUrl}/payments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const unpaidInvoices = invoicesRes.data.filter((i: any) => i.status !== 'paid');
      const nextDue = unpaidInvoices.length > 0 ? new Date(unpaidInvoices[0].dueDate).toLocaleDateString() : 'Em dia';

      setStats({
        activePlans: 1, // Assuming the client has 1 main plan
        dependents: membersRes.data.length,
        nextPayment: nextDue,
        score: 92 // Logic for health score can be added later
      });
    } catch (err) {
      console.error('Erro ao carregar dados da home');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#60A5FA" />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0]} 👋</Text>
            <Text style={styles.headerSubtitle}>Bem-vindo ao seu portal premium</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell size={22} color="#94a3b8" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Health Score Card */}
        <LinearGradient
          colors={['#3b82f6', '#2dd4bf']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreCard}
        >
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Score de Saúde Financeira</Text>
            <Text style={styles.scoreValue}>{stats.score}</Text>
            <Text style={styles.scoreStatus}>EXCELENTE</Text>
          </View>
          <View style={styles.scoreProgressContainer}>
             <Activity size={48} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Shield size={20} color="#60A5FA" />
            </View>
            <Text style={styles.statValue}>{stats.activePlans}</Text>
            <Text style={styles.statLabel}>Planos Ativos</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Users size={20} color="#34d399" />
            </View>
            <Text style={styles.statValue}>{stats.dependents}</Text>
            <Text style={styles.statLabel}>Dependentes</Text>
          </View>
        </View>

        {/* Next Payment Card */}
        <TouchableOpacity style={styles.paymentCard} activeOpacity={0.9}>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentIconWrapper}>
              <CreditCard size={24} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.paymentTitle}>Próximo Vencimento</Text>
              <Text style={styles.paymentDate}>{stats.nextPayment}</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#475569" />
        </TouchableOpacity>

        {/* Important Alerts */}
        <Text style={styles.sectionTitle}>Alertas da Corretora</Text>
        
        <View style={styles.alertItem}>
          <View style={styles.alertIconBlue}>
            <Clock size={18} color="#60A5FA" />
          </View>
          <View style={styles.alertTextContent}>
            <Text style={styles.alertTitle}>Submissão em Análise</Text>
            <Text style={styles.alertDesc}>O pedido de inclusão do dependente "João" está a ser revisto.</Text>
          </View>
        </View>

        <View style={styles.alertItem}>
          <View style={styles.alertIconGreen}>
            <CheckCircle size={18} color="#34d399" />
          </View>
          <View style={styles.alertTextContent}>
            <Text style={styles.alertTitle}>Pagamento Confirmado</Text>
            <Text style={styles.alertDesc}>Recebemos com sucesso o seu pagamento de Março.</Text>
          </View>
        </View>

        {/* Support Section */}
        <TouchableOpacity style={styles.supportCard}>
          <HelpCircle size={20} color="#FFFFFF" />
          <Text style={styles.supportText}>Precisa de ajuda? Fale com suporte</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  scoreCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scoreProgressContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 4,
  },
  scoreStatus: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  paymentCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  paymentDate: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  alertIconBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertIconGreen: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  alertDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  supportCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  supportText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  }
});
