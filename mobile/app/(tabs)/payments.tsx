import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  RefreshControl,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { 
  CreditCard, 
  Receipt, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Download,
  Smartphone,
  Banknote,
  ArrowUpRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import axios from 'axios';
import { API_URL } from '../../src/config';

const { width } = Dimensions.get('window');

export default function PaymentsScreen() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const baseUrl = 'http://10.0.2.2:5000/api';
      const { data } = await axios.get(`${baseUrl}/payments`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setInvoices(data);
    } catch (err) {
      console.error('Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', icon: <CheckCircle size={14} color="#10b981" /> };
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', icon: <Clock size={14} color="#f59e0b" /> };
      case 'overdue': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', icon: <AlertCircle size={14} color="#ef4444" /> };
      default: return { bg: 'rgba(30, 41, 59, 0.5)', text: '#64748b', icon: <Clock size={14} color="#64748b" /> };
    }
  };

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, current) => acc + current.amount, 0);
  const pendingCount = invoices.filter(i => i.status !== 'paid').length;

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
        <Text style={styles.title}>Finanças</Text>
        <Text style={styles.subtitle}>Gestão de mensalidades e pagamentos</Text>

        {/* Financial Summary Card */}
        <View style={styles.summaryGrid}>
          <LinearGradient
            colors={['#0f172a', '#1e293b']}
            style={styles.summaryCard}
          >
            <View style={styles.summaryIconWrapper}>
              <Smartphone size={24} color="#60A5FA" />
            </View>
            <Text style={styles.summaryLabel}>TOTAL LIQUIDADO</Text>
            <Text style={styles.summaryValue}>{totalPaid.toLocaleString()} MT</Text>
          </LinearGradient>
          
          <View style={styles.summaryCardAlt}>
            <View style={styles.summaryIconWrapperAmber}>
              <Clock size={24} color="#F59E0B" />
            </View>
            <Text style={styles.summaryLabel}>PENDENTES</Text>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
          </View>
        </View>

        {/* Payment Methods Section */}
        <Text style={styles.sectionTitle}>Métodos Disponíveis</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodsRow}>
          <TouchableOpacity style={styles.methodBtn}>
             <Image source={{ uri: 'https://seeklogo.com/images/M/m-pesa-logo-7E68F3C7E3-seeklogo.com.png' }} style={styles.methodImg} resizeMode="contain" />
             <Text style={styles.methodText}>M-Pesa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.methodBtn}>
             <CreditCard size={24} color="#60A5FA" />
             <Text style={styles.methodText}>Cartão</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.methodBtn}>
             <Banknote size={24} color="#10B981" />
             <Text style={styles.methodText}>Transferência</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Invoices List */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Histórico de Faturas</Text>
          <TouchableOpacity>
             <Text style={styles.seeAllText}>Ver Todas</Text>
          </TouchableOpacity>
        </View>

        {invoices.length > 0 ? invoices.map((inv) => {
          const style = getStatusStyle(inv.status);
          return (
            <TouchableOpacity key={inv._id} style={styles.invoiceCard} activeOpacity={0.8}>
                <View style={styles.invoiceMain}>
                    <View style={styles.invoiceIconWrapper}>
                        <Receipt size={22} color="#94a3b8" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.invoiceHeader}>
                            <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                                {style.icon}
                                <Text style={[styles.statusText, { color: style.text }]}>{inv.status.toUpperCase()}</Text>
                            </View>
                        </View>
                        <Text style={styles.invoiceAmount}>{inv.amount.toLocaleString()} MT</Text>
                        <Text style={styles.invoiceDate}>Vence aos {new Date(inv.dueDate).toLocaleDateString()}</Text>
                    </View>
                </View>
                
                <View style={styles.invoiceActions}>
                    <TouchableOpacity style={styles.downloadBtn}>
                        <Download size={16} color="#64748b" />
                    </TouchableOpacity>
                    <ChevronRight size={18} color="#334155" />
                </View>
            </TouchableOpacity>
          );
        }) : (
          <View style={styles.emptyContainer}>
             <Receipt size={40} color="#334155" />
             <Text style={styles.emptyText}>Nenhuma fatura registada.</Text>
          </View>
        )}

        <View style={styles.footerNote}>
           <AlertCircle size={16} color="#475569" />
           <Text style={styles.footerNoteText}>O processamento de pagamentos via transferência pode demorar 24h.</Text>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 32,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1.2,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.1)',
  },
  summaryCardAlt: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  summaryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryIconWrapperAmber: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  methodsRow: {
    marginBottom: 32,
  },
  methodBtn: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  methodImg: {
    width: 32,
    height: 32,
  },
  methodText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  invoiceCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  invoiceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  invoiceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceNumber: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  invoiceAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  invoiceDate: {
    color: '#475569',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  downloadBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    marginBottom: 32,
  },
  emptyText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  footerNoteText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  }
});
