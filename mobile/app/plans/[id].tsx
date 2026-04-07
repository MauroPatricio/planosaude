import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../src/config';

export default function PlanDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { token, user, refreshUser } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userPlanStatus, setUserPlanStatus] = useState<'none' | 'pending' | 'active'>('none');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [planRes, subsRes, reqsRes] = await Promise.all([
          axios.get(`${API_URL}/plans/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/subscriptions`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/plan-requests/my`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setPlan(planRes.data);
        
        // Check if this plan is already active
        const isActive = subsRes.data.some((s: any) => s.plan?._id === id);
        if (isActive) {
          setUserPlanStatus('active');
        } else {
          // Check if it's pending
          const isPending = reqsRes.data.some((r: any) => r.plan?._id === id && r.status === 'pending');
          if (isPending) setUserPlanStatus('pending');
        }

      } catch (err: any) {
        console.error('Erro ao carregar dados:', err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, token]);

  const handleSelectPlan = async () => {
    Alert.alert(
      'Confirmar Plano',
      `Deseja contratar o plano ${plan.name} por ${plan.priceMonthly.toLocaleString()} MT mensais?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Contratar', 
          onPress: async () => {
            setSubmitting(true);
            try {
              // Create Plan Request (Pending Review)
              await axios.post(`${API_URL}/plan-requests`, {
                planId: plan._id,
                clientId: user?.clientId
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });

              Alert.alert(
                'Pedido Enviado', 
                'Seu pedido de adesão ao plano foi enviado para aprovação. Você será notificado assim que for processado.',
                [{ text: 'OK', onPress: () => router.push('/(tabs)/health') }]
              );
              await refreshUser();
            } catch (err: any) {
              const msg = err.response?.data?.message || 'Não foi possível enviar o pedido agora.';
              Alert.alert('Erro', msg);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  if (!plan) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icons.ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.heroInfo}>
            <Text style={styles.operatorTag}>{plan.operator}</Text>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>{plan.priceMonthly.toLocaleString()}</Text>
              <Text style={styles.priceUnit}>MT / mês</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          {/* Description */}
          <Text style={styles.sectionTitle}>Sobre o Plano</Text>
          <Text style={styles.description}>
            {plan.description || `O plano ${plan.name} oferece uma cobertura abrangente para garantir a sua tranquilidade e da sua família.`}
          </Text>

          {/* Coberturas */}
          <Text style={styles.sectionTitle}>Coberturas</Text>
          <View style={styles.grid}>
            {(plan.coberturas?.length > 0 ? plan.coberturas : plan.benefits).map((item: string, idx: number) => (
              <View key={idx} style={styles.checkItem}>
                <View style={styles.checkIcon}>
                  <Icons.Check size={14} color="#10b981" />
                </View>
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Limites */}
          {plan.limites?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Limites e Carências</Text>
              <View style={styles.list}>
                {plan.limites.map((item: string, idx: number) => (
                  <View key={idx} style={styles.listItem}>
                    <Icons.Info size={16} color="#60A5FA" />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

           {/* Parceiros */}
           {plan.parceiros?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Rede Parceria (Hospitais)</Text>
              <View style={styles.partnerGrid}>
                {plan.parceiros.map((item: string, idx: number) => (
                  <View key={idx} style={styles.partnerCard}>
                    <Icons.Hospital size={20} color="#94a3b8" />
                    <Text style={styles.partnerText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.selectBtn, 
            userPlanStatus === 'active' && { backgroundColor: '#10b981' },
            userPlanStatus === 'pending' && { backgroundColor: '#F59E0B' }
          ]} 
          onPress={handleSelectPlan}
          disabled={submitting || userPlanStatus !== 'none'}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.selectBtnText}>
                {userPlanStatus === 'active' ? 'Seu Plano Atual' : 
                 userPlanStatus === 'pending' ? 'Pedido em Análise' : 
                 'Selecionar este Plano'}
              </Text>
              {userPlanStatus === 'active' ? (
                <Icons.CheckCircle size={20} color="#FFFFFF" />
              ) : (
                <Icons.ShieldCheck size={20} color="#FFFFFF" />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    height: 280,
    paddingTop: 60,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 32,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    gap: 8,
  },
  operatorTag: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  planName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  priceUnit: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  detailsContainer: {
    padding: 24,
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#0f172a',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 32,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 24,
  },
  grid: {
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    padding: 16,
    borderRadius: 16,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 12,
  },
  listText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  partnerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  partnerCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  partnerText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  selectBtn: {
    backgroundColor: '#2563eb',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  }
});
