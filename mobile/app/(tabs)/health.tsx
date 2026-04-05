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
import { 
  Heart, 
  Users, 
  Plus, 
  ChevronRight, 
  ShieldCheck, 
  UserCircle,
  FileText,
  AlertCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../src/config';

export default function HealthScreen() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseUrl = 'http://10.0.2.2:5000/api';
      const [membersRes, subsRes] = await Promise.all([
        axios.get(`${baseUrl}/clients/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseUrl}/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMembers(membersRes.data);
      setSubscriptions(subsRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados de saúde');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddMember = () => {
    Alert.alert(
      "Adicionar Dependente",
      "Deseja iniciar o processo de inclusão de um novo membro familiar? Uma solicitação de aprovação será enviada à corretora.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Continuar", onPress: () => console.log("Navegar para formulário de adição") }
      ]
    );
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
        {subscriptions.length > 0 ? subscriptions.map(sub => (
          <LinearGradient
            key={sub._id}
            colors={['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.4)']}
            style={styles.planCard}
          >
            <View style={styles.planHeader}>
              <View style={styles.planIconWrapper}>
                <ShieldCheck size={28} color="#60A5FA" />
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
                <View style={styles.statusBadge}>
                   <View style={styles.statusDot} />
                   <Text style={styles.statusText}>{sub.status.toUpperCase()}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.detailsBtn}>
                <Text style={styles.detailsBtnText}>Ver Cobertura</Text>
                <ChevronRight size={14} color="#60A5FA" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )) : (
          <View style={styles.emptyCard}>
            <Heart size={32} color="#475569" />
            <Text style={styles.emptyText}>Nenhum plano ativo encontrado.</Text>
          </View>
        )}

        {/* Members Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agregado Familiar</Text>
          <TouchableOpacity onPress={handleAddMember} style={styles.addBtn}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.membersGrid}>
          {/* Main User Card */}
          <View style={styles.memberCard}>
            <View style={styles.memberAvatarWrapper}>
              <UserCircle size={40} color="#60A5FA" />
            </View>
            <Text style={styles.memberName}>{user?.name.split(' ')[0]} (Eu)</Text>
            <Text style={styles.memberRole}>Titular</Text>
          </View>

          {/* Dependents */}
          {members.map(member => (
            <View key={member._id} style={styles.memberCard}>
              <View style={styles.memberAvatarWrapper}>
                <UserCircle size={40} color="#94a3b8" />
              </View>
              <Text style={styles.memberName}>{member.name.split(' ')[0]}</Text>
              <Text style={styles.memberRole}>{member.relationship || 'Dependente'}</Text>
            </View>
          ))}
        </View>

        {/* Benefits Card */}
        <TouchableOpacity style={styles.benefitsCard}>
           <LinearGradient
            colors={['rgba(96, 165, 250, 0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
           />
           <View style={styles.benefitsIconWrapper}>
              <FileText size={24} color="#60A5FA" />
           </View>
           <View style={{ flex: 1 }}>
              <Text style={styles.benefitsTitle}>Meus Benefícios Premium</Text>
              <Text style={styles.benefitsDesc}>Consulte a lista completa de clínicas e exames cobertos pelo seu plano.</Text>
           </View>
           <ChevronRight size={20} color="#475569" />
        </TouchableOpacity>

        {/* Claims Card */}
        <TouchableOpacity 
           style={[styles.benefitsCard, { borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
           onPress={() => router.push('/claims')}
        >
           <View style={[styles.benefitsIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <AlertCircle size={24} color="#F87171" />
           </View>
           <View style={{ flex: 1 }}>
              <Text style={[styles.benefitsTitle, { color: '#F87171' }]}>Comunicar Sinistro</Text>
              <Text style={styles.benefitsDesc}>Peça o reembolso ou autorização para um evento de saúde.</Text>
           </View>
           <ChevronRight size={20} color="#F87171" />
        </TouchableOpacity>

        {/* Warning Card */}
        <View style={styles.warningCard}>
           <AlertCircle size={20} color="#F59E0B" />
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
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    marginBottom: 32,
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
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
