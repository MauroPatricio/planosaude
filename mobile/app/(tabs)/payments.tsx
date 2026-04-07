import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl,
  Image,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_URL } from '../../src/config';

const { width, height } = Dimensions.get('window');

export default function PaymentsScreen() {
  const { token, refreshUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      await refreshUser();
      
      const { data } = await axios.get(`${API_URL}/payments`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Erro ao carregar faturas:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleInvoicePress = (inv: any) => {
    if (inv.status === 'paid' || inv.status === 'pending') {
      Alert.alert('Estado da Fatura', `Esta fatura está ${inv.status === 'paid' ? 'paga' : 'a aguardar validação'}.`);
      return;
    }
    setSelectedInvoice(inv);
    setModalVisible(true);
  };

  const handleMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert('Erro', 'Por favor, insira um número M-Pesa válido.');
      return;
    }

    setProcessing(true);
    try {
      await axios.post(`${API_URL}/payments/${selectedInvoice._id}/simulate-mpesa`, { 
        phoneNumber 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Alert.alert('Sucesso', 'Pagamento M-Pesa processado com sucesso!');
      setModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Erro', 'Falha ao processar pagamento M-Pesa.');
    } finally {
      setProcessing(false);
    }
  };

  const handleProofUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setProcessing(true);
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpg`;

        formData.append('proof', { uri, name: filename, type } as any);
        formData.append('paymentMethod', 'bank_transfer');

        await axios.patch(`${API_URL}/payments/${selectedInvoice._id}/proof`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        Alert.alert('Sucesso', 'Comprovativo enviado para validação.');
        setModalVisible(false);
        fetchData();
      } catch (err) {
        Alert.alert('Erro', 'Falha ao enviar comprovativo.');
      } finally {
        setProcessing(false);
      }
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', icon: <Icons.CheckCircle size={14} color="#10b981" /> };
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', icon: <Icons.Clock size={14} color="#f59e0b" /> };
      case 'overdue': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', icon: <Icons.AlertCircle size={14} color="#ef4444" /> };
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', icon: <Icons.XCircle size={14} color="#ef4444" /> };
      default: return { bg: 'rgba(30, 41, 59, 0.5)', text: '#64748b', icon: <Icons.Clock size={14} color="#64748b" /> };
    }
  };

  const totalPaid = Array.isArray(invoices) 
    ? invoices.filter(i => i.status === 'paid').reduce((acc, current) => acc + (current.amount || 0), 0)
    : 0;

  const pendingCount = Array.isArray(invoices) 
    ? invoices.filter(i => i.status !== 'paid').length
    : 0;

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
              <Icons.Smartphone size={24} color="#60A5FA" />
            </View>
            <Text style={styles.summaryLabel}>TOTAL LIQUIDADO</Text>
            <Text style={styles.summaryValue}>{totalPaid.toLocaleString()} MT</Text>
          </LinearGradient>
          
          <View style={styles.summaryCardAlt}>
            <View style={styles.summaryIconWrapperAmber}>
              <Icons.Clock size={24} color="#F59E0B" />
            </View>
            <Text style={styles.summaryLabel}>PENDENTES</Text>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
          </View>
        </View>

        {/* Payment Methods Info */}
        <Text style={styles.sectionTitle}>Métodos Disponíveis</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodsRow}>
          <View style={styles.methodBtn}>
             <Image source={{ uri: 'https://seeklogo.com/images/M/m-pesa-logo-7E68F3C7E3-seeklogo.com.png' }} style={styles.methodImg} resizeMode="contain" />
             <Text style={styles.methodText}>M-Pesa</Text>
          </View>
          <View style={styles.methodBtn}>
             <Icons.CreditCard size={24} color="#60A5FA" />
             <Text style={styles.methodText}>Cartão</Text>
          </View>
          <View style={styles.methodBtn}>
             <Icons.Banknote size={24} color="#10B981" />
             <Text style={styles.methodText}>NIB/IBAN</Text>
          </View>
        </ScrollView>

        {/* Invoices List */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Histórico de Faturas</Text>
          <TouchableOpacity onPress={fetchData}>
             <Icons.RefreshCw size={14} color="#60A5FA" />
          </TouchableOpacity>
        </View>

        {invoices.length > 0 ? invoices.map((inv) => {
          const style = getStatusStyle(inv.status);
          return (
            <TouchableOpacity 
              key={inv._id} 
              style={styles.invoiceCard} 
              activeOpacity={0.8}
              onPress={() => handleInvoicePress(inv)}
            >
                <View style={styles.invoiceMain}>
                    <View style={styles.invoiceIconWrapper}>
                        <Icons.Receipt size={22} color="#94a3b8" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.invoiceHeader}>
                            <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: style.bg }]}>
                                {style.icon}
                                <Text style={[styles.statusText, { color: style.text }]}>
                                  {inv.status?.toUpperCase() || 'EM ANÁLISE'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.invoiceAmount}>{(inv.amount || 0).toLocaleString()} MT</Text>
                        <Text style={styles.invoiceDate}>
                          Vence aos {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.invoiceActions}>
                    {inv.status !== 'paid' && (
                        <TouchableOpacity style={styles.payNowBtn} onPress={() => handleInvoicePress(inv)}>
                           <Icons.Wallet size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                    <Icons.ChevronRight size={18} color="#334155" />
                </View>
            </TouchableOpacity>
          );
        }) : (
          <View style={styles.emptyContainer}>
             <Icons.Receipt size={40} color="#334155" />
             <Text style={styles.emptyText}>Nenhuma fatura registada.</Text>
          </View>
        )}

        <View style={styles.footerNote}>
           <Icons.AlertCircle size={16} color="#475569" />
           <Text style={styles.footerNoteText}>O processamento de pagamentos via transferência pode demorar 24h.</Text>
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContent}
            >
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Pagamento</Text>
                    <TouchableOpacity onPress={() => { setModalVisible(false); setPaymentMethod(null); }}>
                        <Icons.X size={24} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                {selectedInvoice && (
                  <View style={styles.modalInvoiceInfo}>
                      <Text style={styles.modalAmountLabel}>Total a Pagar</Text>
                      <Text style={styles.modalAmountValue}>{selectedInvoice.amount.toLocaleString()} MT</Text>
                      <Text style={styles.modalInvoiceRef}>REF: {selectedInvoice.invoiceNumber}</Text>
                  </View>
                )}

                {!paymentMethod ? (
                  <View style={styles.methodSelection}>
                      <Text style={styles.methodSelectionTitle}>Escolha o método:</Text>
                      <TouchableOpacity 
                        style={styles.selectionCard}
                        onPress={() => setPaymentMethod('mpesa')}
                      >
                          <Image source={{ uri: 'https://seeklogo.com/images/M/m-pesa-logo-7E68F3C7E3-seeklogo.com.png' }} style={styles.methodImg} resizeMode="contain" />
                          <View style={{ flex: 1 }}>
                              <Text style={styles.selectionTitle}>M-Pesa</Text>
                              <Text style={styles.selectionDesc}>Pagamento instantâneo via telemóvel</Text>
                          </View>
                          <Icons.ChevronRight size={20} color="#334155" />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.selectionCard}
                        onPress={() => setPaymentMethod('bank')}
                      >
                          <View style={styles.bankIconWrapper}>
                             <Icons.Banknote size={24} color="#10B981" />
                          </View>
                          <View style={{ flex: 1 }}>
                              <Text style={styles.selectionTitle}>Transferência Bancária</Text>
                              <Text style={styles.selectionDesc}>Submeter comprovativo de depósito</Text>
                          </View>
                          <Icons.ChevronRight size={20} color="#334155" />
                      </TouchableOpacity>
                  </View>
                ) : paymentMethod === 'mpesa' ? (
                  <View style={styles.mpesaFlow}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => setPaymentMethod(null)}>
                          <Icons.ArrowLeft size={16} color="#60A5FA" />
                          <Text style={styles.backText}>Voltar</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.mpesaInstructionsCard}>
                         <Text style={styles.instrTitle}>Instruções M-Pesa:</Text>
                         <Text style={styles.instrStep}>1. Digite <Text style={{fontWeight: '900'}}>*150#</Text></Text>
                         <Text style={styles.instrStep}>2. Selecione <Text style={{fontWeight: '900'}}>6 – Pagamentos</Text></Text>
                         <Text style={styles.instrStep}>3. Selecione <Text style={{fontWeight: '900'}}>7 – Código de Serviço</Text></Text>
                         <Text style={styles.instrStep}>4. Digite o Código: <Text style={{fontWeight: '900', color: '#60A5FA'}}>900100</Text></Text>
                         <Text style={styles.instrStep}>5. Referência: <Text style={{fontWeight: '900', color: '#60A5FA'}}>{selectedInvoice.invoiceNumber}</Text></Text>
                      </View>

                      <View style={styles.inputContainer}>
                          <Icons.Smartphone size={20} color="#475569" style={styles.inputIcon} />
                          <TextInput 
                            style={styles.input}
                            placeholder="Seu número (para registo)"
                            placeholderTextColor="#475569"
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            maxLength={9}
                          />
                      </View>

                      <TouchableOpacity 
                        style={styles.uploadProofBtn}
                        onPress={handleProofUpload}
                        disabled={processing}
                      >
                         {processing ? (
                           <ActivityIndicator color="#60A5FA" />
                         ) : (
                           <>
                             <Icons.Camera size={20} color="#60A5FA" />
                             <Text style={styles.uploadProofText}>Submeter Comprovativo M-Pesa</Text>
                           </>
                         )}
                      </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.bankFlow}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => setPaymentMethod(null)}>
                          <Icons.ArrowLeft size={16} color="#60A5FA" />
                          <Text style={styles.backText}>Voltar</Text>
                      </TouchableOpacity>

                      <View style={styles.bankDetails}>
                          <Text style={styles.bankDetailLabel}>NOME DA EMPRESA:</Text>
                          <Text style={styles.bankDetailValue}>NHIQUELA SERVICOS & CONSULTORIA</Text>
                          <Text style={styles.bankDetailLabel}>BANCO:</Text>
                          <Text style={styles.bankDetailValue}>BCI (Moçambique)</Text>
                          <Text style={styles.bankDetailLabel}>NÚMERO DA CONTA:</Text>
                          <Text style={styles.bankDetailValue}>213456789</Text>
                          <Text style={styles.bankDetailLabel}>NIB / IBAN:</Text>
                          <Text style={styles.bankDetailValue}>0010 0000 2134 5678 9012 3</Text>
                      </View>

                      <TouchableOpacity 
                        style={styles.uploadProofBtn}
                        onPress={handleProofUpload}
                        disabled={processing}
                      >
                         {processing ? (
                           <ActivityIndicator color="#60A5FA" />
                         ) : (
                           <>
                             <Icons.UploadCloud size={20} color="#60A5FA" />
                             <Text style={styles.uploadProofText}>Anexar Comprovativo (Foto)</Text>
                           </>
                         )}
                      </TouchableOpacity>

                      <Text style={styles.bankNotice}>
                        Após o upload, a nossa equipa irá validar o depósito em até 24h úteis.
                      </Text>
                  </View>
                )}
            </KeyboardAvoidingView>
        </View>
      </Modal>
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
  payNowBtn: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  modalInvoiceInfo: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalAmountLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalAmountValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  modalInvoiceRef: {
    color: '#475569',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '700',
  },
  methodSelection: {
    gap: 12,
  },
  methodSelectionTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  selectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  selectionDesc: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  bankIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpesaInstructionsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    gap: 8,
  },
  instrTitle: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  instrStep: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  mpesaFlow: {
    gap: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },
  flowInstructions: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#10b981',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  bankFlow: {
    gap: 16,
  },
  bankDetails: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  bankDetailLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
  },
  bankDetailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  uploadProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  uploadProofText: {
    color: '#60A5FA',
    fontSize: 15,
    fontWeight: '700',
  },
  bankNotice: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  }
});
