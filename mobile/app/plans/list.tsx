import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../src/config';

export default function PlansListScreen() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(data.filter((p: any) => p.isActive));
    } catch (err: any) {
      console.error('Erro ao carregar planos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icons.ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planos Disponíveis</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPlans} tintColor="#60A5FA" />}
      >
        <Text style={styles.subtitle}>Escolha o plano que melhor se adapta às suas necessidades e da sua família.</Text>

        {loading && plans.length === 0 ? (
          <ActivityIndicator size="large" color="#60A5FA" style={{ marginTop: 40 }} />
        ) : plans.map((plan) => (
          <TouchableOpacity 
            key={plan._id}
            activeOpacity={0.9}
            style={styles.planCard}
            onPress={() => router.push(`/plans/${plan._id}`)}
          >
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.4)']}
              style={styles.planCardInner}
            >
              <View style={styles.planHeader}>
                <View style={styles.planMainInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planOperator}>{plan.operator}</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceValue}>{plan.priceMonthly.toLocaleString()}</Text>
                  <Text style={styles.priceCurrency}>MT/mês</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.benefitsPreview}>
                {plan.benefits?.slice(0, 3).map((benefit: string, idx: number) => (
                  <View key={idx} style={styles.benefitItem}>
                    <Icons.Check size={14} color="#10b981" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.selectBtn}
                onPress={() => router.push(`/plans/${plan._id}`)}
              >
                <Text style={styles.selectBtnText}>Ver Detalhes</Text>
                <Icons.ChevronRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 24,
  },
  planCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  planCardInner: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planMainInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  planOperator: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  priceBadge: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#60A5FA',
  },
  priceCurrency: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 20,
  },
  benefitsPreview: {
    gap: 12,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  selectBtn: {
    backgroundColor: '#2563eb',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  }
});
