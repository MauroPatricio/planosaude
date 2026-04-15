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
  Platform,
  Image,
  Alert
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../src/config';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, token, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activePlans: 0,
    dependents: 0,
    nextPayment: 'N/A',
    financialStatus: 'covered' as 'covered' | 'overdue'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Sync user status first
      await refreshUser();
      const [membersRes, invoicesRes] = await Promise.all([
        axios.get(`${API_URL}/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/payments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const membersArray = Array.isArray(membersRes.data) ? membersRes.data : [];
      const invoicesArray = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      
      const unpaidInvoices = invoicesArray.filter((i: any) => i.status !== 'paid');
      const nextDue = unpaidInvoices.length > 0 && unpaidInvoices[0]?.dueDate 
        ? new Date(unpaidInvoices[0].dueDate).toLocaleDateString() 
        : 'Em dia';

      // Check if any invoice is actually overdue (dueDate < now)
      const now = new Date();
      const isOverdue = unpaidInvoices.some((inv: any) => {
        if (!inv.dueDate) return false;
        return new Date(inv.dueDate) < now;
      });

      setStats({
        activePlans: 1, // Assuming the client has 1 main plan
        dependents: membersArray.length,
        nextPayment: nextDue,
        financialStatus: isOverdue ? 'overdue' : 'covered'
      });
    } catch (err: any) {
      console.error('Erro ao carregar dados da home:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const getProfileImage = () => {
    if (!user?.profileImage) return null;
    if (user.profileImage.startsWith('http')) return user.profileImage;
    return `${BASE_URL}${user.profileImage}`;
  };

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
          <View style={styles.headerInfo}>
            <View style={styles.avatarContainer}>
              {user?.profileImage ? (
                <Image source={{ uri: getProfileImage() || undefined }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={['#60A5FA', '#3B82F6']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                </LinearGradient>
              )}
            </View>
            <View>
              <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Utilizador'} 👋</Text>
              <Text style={styles.headerSubtitle}>Bem-vindo ao seu portal de plano de saúde.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Icons.Bell size={22} color="#94a3b8" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Status Banner for Pending/Suspended accounts */}
        {user?.status !== 'active' && (
          <LinearGradient
            colors={user?.status === 'pending' ? ['#F59E0B', '#D97706'] : ['#EF4444', '#B91C1C']}
            style={styles.statusBanner}
          >
            <View style={styles.statusBannerInner}>
              <Icons.AlertTriangle size={20} color="#FFFFFF" />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusBannerTitle}>
                  {user?.status === 'pending' ? 'CONTA EM ANÁLISE' : 'CONTA SUSPENSA'}
                </Text>
                <Text style={styles.statusBannerDesc}>
                  {user?.status === 'pending' 
                    ? 'Aguarde a validação dos seus documentos pela nossa equipa.' 
                    : 'A sua conta foi suspensa. Por favor, contacte o suporte.'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Financial Situation Card (Only if active) */}
        {user?.status === 'active' ? (
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/payments')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={stats.financialStatus === 'covered' ? ['#10b981', '#059669'] : ['#ef4444', '#b91c1c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreCard}
            >
              <View style={styles.scoreInfo}>
                <View style={styles.scoreHeaderRow}>
                  <Text style={styles.scoreLabel}>Situação Financeira</Text>
                  {stats.financialStatus === 'covered' ? (
                    <Icons.CheckCircle size={16} color="rgba(255,255,255,0.8)" />
                  ) : (
                    <Icons.AlertTriangle size={16} color="rgba(255,255,255,0.8)" />
                  )}
                </View>
                
                <Text style={styles.scoreStatus}>
                  {stats.financialStatus === 'covered' ? 'EM DIA / COBERTO' : 'PAGAMENTO EM ATRASO'}
                </Text>

                {stats.financialStatus === 'overdue' && (
                  <View style={styles.suggestionContainer}>
                    <Text style={styles.suggestionText}>
                      Regularize o pagamento para manter o acesso aos serviços.
                    </Text>
                    <View style={styles.payNowBadge}>
                      <Text style={styles.payNowText}>Pagar Agora</Text>
                      <Icons.ChevronRight size={10} color="#FFFFFF" />
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.scoreProgressContainer}>
                 {stats.financialStatus === 'covered' ? (
                    <Icons.ShieldCheck size={48} color="rgba(255,255,255,0.3)" />
                 ) : (
                    <Icons.Wallet size={48} color="rgba(255,255,255,0.3)" />
                 )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.pendingScoreCard}>
            <Icons.Lock size={24} color="#475569" />
            <Text style={styles.pendingScoreText}>Funcionalidades limitadas até à ativação da conta</Text>
          </View>
        )}

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Icons.Shield size={20} color="#60A5FA" />
            </View>
            <Text style={styles.statValue}>{stats.activePlans}</Text>
            <Text style={styles.statLabel}>Planos Ativos</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Icons.Users size={20} color="#34d399" />
            </View>
            <Text style={styles.statValue}>{stats.dependents}</Text>
            <Text style={styles.statLabel}>Dependentes</Text>
          </View>
        </View>

        {/* Next Payment Card */}
        <TouchableOpacity 
          style={styles.paymentCard} 
          activeOpacity={0.9}
          onPress={() => {
            if (stats.nextPayment === 'N/A' || stats.nextPayment === 'Em dia') {
              Alert.alert('Estado de Pagamento', 'Não existem faturas pendentes de momento.');
            } else {
              Alert.alert(
                'Detalhes do Vencimento',
                `A sua próxima mensalidade vence no dia ${stats.nextPayment}.\n\nPor favor, garanta o pagamento até esta data para evitar a suspensão dos serviços.`
              );
            }
          }}
        >
          <View style={styles.paymentInfo}>
            <View style={styles.paymentIconWrapper}>
              <Icons.CreditCard size={24} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.paymentTitle}>Próximo Vencimento</Text>
              <Text style={styles.paymentDate}>{stats.nextPayment}</Text>
            </View>
          </View>
          <Icons.ChevronRight size={20} color="#475569" />
        </TouchableOpacity>

        {/* Support Section */}
        <TouchableOpacity 
          style={styles.supportCard} 
          activeOpacity={0.8}
          onPress={() => {
            const phoneNumber = '+258840000000'; // Real support number would go here
            const message = 'Olá! Preciso de ajuda com o meu plano de saúde.';
            const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
            
            import('react-native').then(({ Linking }) => {
              Linking.canOpenURL(url).then(supported => {
                if (supported) {
                  Linking.openURL(url);
                } else {
                  Linking.openURL(`https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`);
                }
              });
            });
          }}
        >
          <Icons.HelpCircle size={20} color="#FFFFFF" />
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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
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
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  suggestionText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  payNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  payNowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
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
  statusBanner: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBannerDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  pendingScoreCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  pendingScoreText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
