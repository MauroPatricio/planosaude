import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../src/config';
import { useSocket } from '../../src/context/SocketContext';

export default function HealthScreen() {
  const { token, user, refreshUser } = useAuthStore();
  const { socket } = useSocket();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await refreshUser();
      
      const [membersRes, subsRes, requestsRes] = await Promise.all([
        axios.get(`${API_URL}/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/subscriptions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/plan-requests/my`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMembers(membersRes.data);
      setSubscriptions(subsRes.data.filter((s: any) => s.status !== 'cancelled'));
      setRequests(requestsRes.data.filter((r: any) => r.status === 'pending'));
    } catch (err: any) {
      console.error('Erro ao carregar dados de saúde:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    socket.on('planRequest:updated', (data: any) => {
      console.log('Plan Request updated via Socket:', data);
      fetchData();
    });

    return () => {
      socket.off('planRequest:updated');
    };
  }, [socket]);

  const handleAddMember = () => {
    router.push('/dependents/add');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#60A5FA" />}
      >
        <Text style={styles.title}>Minha Saúde</Text>
        <Text style={styles.subtitle}>Gestão de planos e agregados familiares</Text>

        {/* Active Plans Section */}
        <Text style={styles.sectionTitle}>Plano Principal</Text>
        {subscriptions.length > 0 ? (() => {
          const sub = subscriptions[0];
          const pendingCancellation = requests.find(r => r.plan?._id === sub.plan?._id && r.requestType === 'cancellation');
          return (
            <LinearGradient
              key={sub._id}
              colors={['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.4)']}
              style={styles.planCard}
            >
              <View style={styles.planHeader}>
                <View style={styles.planIconWrapper}>
                  <Icons.ShieldCheck size={28} color="#60A5FA" />
                </View>
                <View>
                  <Text style={styles.planName}>{sub.plan?.name || 'Plano de Saúde'}</Text>
                  <Text style={styles.planOperator}>{sub.plan?.operator || 'Operadora Parceira'}</Text>
                </View>
              </View>
              <View style={styles.planDivider} />
              <View style={styles.planFooter}>
                <View>
                  <Text style={styles.planStatusLabel}>ESTADO</Text>
                  <View style={[
                    styles.statusBadge, 
                    (sub.status === 'pending' || pendingCancellation) && { backgroundColor: 'rgba(245, 158, 11, 0.1)' }
                  ]}>
                     <View style={[
                       styles.statusDot, 
                       (sub.status === 'pending' || pendingCancellation) && { backgroundColor: '#F59E0B' }
                     ]} />
                     <Text style={[
                       styles.statusText, 
                       (sub.status === 'pending' || pendingCancellation) && { color: '#F59E0B' }
                     ]}>
                       {pendingCancellation ? 'CANCELAMENTO EM ANÁLISE' : 
                        sub.status === 'pending' ? 'AGUARDANDO PAGAMENTO' : 
                        sub.status?.toUpperCase() || 'ATIVO'}
                     </Text>
                  </View>
                </View>
                <View>
                  <TouchableOpacity 
                    style={styles.detailsBtn}
                    onPress={() => router.push(`/plans/${sub.plan?._id}`)}
                  >
                    <Text style={styles.detailsBtnText}>Ver Cobertura</Text>
                    <Icons.ChevronRight size={14} color="#60A5FA" />
                  </TouchableOpacity>

                  {!pendingCancellation && (
                    <TouchableOpacity 
                      style={[styles.detailsBtn, { marginTop: 8 }]}
                      onPress={() => {
                        Alert.alert(
                          'Cancelar Plano',
                          'Deseja solicitar o cancelamento/desassociação do seu plano atual? Este pedido será analisado pela administração.',
                          [
                            { text: 'Voltar', style: 'cancel' },
                            { 
                              text: 'Solicitar Cancelamento', 
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  setLoading(true);
                                  await axios.post(`${API_URL}/plan-requests`, {
                                    planId: sub.plan?._id,
                                    clientId: user?.clientId,
                                    requestType: 'cancellation'
                                  }, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  Alert.alert('Sucesso', 'Seu pedido de cancelamento foi enviado para aprovação.');
                                  fetchData();
                                } catch (err: any) {
                                  Alert.alert('Erro', err.response?.data?.message || 'Erro ao enviar pedido');
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }
                          ]
                        );
                      }}
                    >
                      <Text style={[styles.detailsBtnText, { color: '#EF4444' }]}>Desassociar Plano</Text>
                      <Icons.Slash size={14} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          );
        })() : requests.length > 0 ? (
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => router.push(`/plans/${requests[0].plan?._id}`)}
          >
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.1)', 'rgba(30, 41, 59, 0.4)']}
              style={[styles.noPlanCard, { borderColor: 'rgba(245, 158, 11, 0.2)' }]}
            >
              <View style={[styles.noPlanIconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Icons.Clock size={32} color="#F59E0B" />
              </View>
              <View style={styles.noPlanContent}>
                <Text style={styles.noPlanTitle}>Pedido em Análise</Text>
                <Text style={styles.noPlanSubtitle}>Clique para ver detalhes do plano {(requests[0].plan as any)?.name}.</Text>
                <View style={[styles.addPlanBtn, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Text style={[styles.addPlanBtnText, { color: '#F59E0B' }]}>Aguardando Aprovação...</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <LinearGradient
            colors={['rgba(37, 99, 235, 0.1)', 'rgba(30, 41, 59, 0.4)']}
            style={styles.noPlanCard}
          >
            <View style={styles.noPlanIconWrapper}>
              <Icons.PlusCircle size={32} color="#60A5FA" />
            </View>
            <View style={styles.noPlanContent}>
              <Text style={styles.noPlanTitle}>Você ainda não possui um plano ativo</Text>
              <Text style={styles.noPlanSubtitle}>Comece por escolher um plano que se adapte às suas necessidades.</Text>
              <TouchableOpacity 
                style={styles.addPlanBtn}
                onPress={() => router.push('/plans/list')}
              >
                <Text style={styles.addPlanBtnText}>Adicionar Plano</Text>
                <Icons.ChevronRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        {/* Members Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agregado Familiar</Text>
          <TouchableOpacity onPress={handleAddMember} style={styles.addBtn}>
            <Icons.Plus size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.membersGrid}>
          {/* Main User Card */}
          <View style={styles.memberCard}>
            <View style={styles.memberAvatarWrapper}>
              <Icons.UserCircle size={40} color="#60A5FA" />
            </View>
            <Text style={styles.memberName}>{user?.name?.split(' ')[0] || 'Eu'}</Text>
            <Text style={styles.memberRole}>Titular</Text>
          </View>

          {/* Dependents */}
          {members.map(member => (
            <View key={member._id} style={styles.memberCard}>
              <View style={styles.memberAvatarWrapper}>
                <Icons.UserCircle size={40} color="#94a3b8" />
              </View>
              <Text style={styles.memberName}>{member.name?.split(' ')[0] || 'Membro'}</Text>
              <Text style={styles.memberRole}>{member.relationship || 'Dependente'}</Text>
            </View>
          ))}
        </View>

        {/* Benefits Card */}
        <TouchableOpacity 
          style={styles.benefitsCard}
          onPress={() => {
            const planId = subscriptions[0]?.plan?._id || requests[0]?.plan?._id;
            if (planId) {
              router.push(`/plans/${planId}`);
            } else {
              router.push('/plans/list');
            }
          }}
        >
           <LinearGradient
            colors={['rgba(96, 165, 250, 0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
           />
           <View style={styles.benefitsIconWrapper}>
              <Icons.FileText size={24} color="#60A5FA" />
           </View>
           <View style={{ flex: 1 }}>
              <Text style={styles.benefitsTitle}>Meus Benefícios</Text>
              <Text style={styles.benefitsDesc}>Consulte a lista completa de clínicas e exames cobertos pelo seu plano.</Text>
           </View>
           <Icons.ChevronRight size={20} color="#475569" />
        </TouchableOpacity>

        {/* Claims Card */}
        <TouchableOpacity 
           style={[styles.benefitsCard, { borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
           onPress={() => router.push('/claims')}
        >
           <View style={[styles.benefitsIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Icons.AlertCircle size={24} color="#F87171" />
           </View>
           <View style={{ flex: 1 }}>
              <Text style={[styles.benefitsTitle, { color: '#F87171' }]}>Comunicar Sinistro</Text>
              <Text style={styles.benefitsDesc}>Peça o reembolso ou autorização para um evento de saúde.</Text>
           </View>
           <Icons.ChevronRight size={20} color="#F87171" />
        </TouchableOpacity>

        {/* Warning Card */}
        <View style={styles.warningCard}>
           <Icons.AlertCircle size={20} color="#F59E0B" />
           <Text style={styles.warningText}>Algumas alterações podem levar até 48h para serem aprovadas pela corretora.</Text>
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  planCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  planIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  planOperator: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  planDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  planStatusLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  memberCard: {
    width: '31%',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  memberAvatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  memberRole: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  noPlanCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 32,
  },
  noPlanIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPlanContent: {
    flex: 1,
    gap: 4,
  },
  noPlanTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  noPlanSubtitle: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  addPlanBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  addPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  benefitsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.1)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  benefitsIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  benefitsDesc: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.1)',
    marginBottom: 40,
  },
  warningText: {
    flex: 1,
    color: '#d97706',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  }
});
