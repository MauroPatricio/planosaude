import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  Modal
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { 
  AlertCircle, 
  ChevronLeft, 
  FilePlus,
  FileText,
  CheckCircle,
  HelpCircle,
  Info
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../src/config';

export default function ClaimsScreen() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  // Form State
  const [type, setType] = useState('consultation');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [subId, setSubId] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/subscriptions`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setSubscriptions(data);
        if (data.length > 0) setSubId(data[0]._id);
      } catch (err) {
        console.error('Erro ao carregar subscrições');
      }
    };
    fetchSubs();
  }, [token]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      console.error('Erro ao escolher arquivo', err);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return [];

    const formData = new FormData();
    // In React Native, the format for file in FormData is special
    const fileToUpload = {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType || 'application/octet-stream',
    } as any;

    formData.append('file', fileToUpload);
    formData.append('entityType', 'Claim');
    formData.append('type', 'receipt');

    const response = await axios.post(`${API_URL}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });

    return [response.data.url];
  };

  const handleSubmit = async () => {
    if (!description || !amount || !subId) {
      Alert.alert("Erro", "Por favor preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);
      
      // Step 1: Upload Documents if any
      let documentUrls = [];
      if (selectedFile) {
        setUploading(true);
        documentUrls = await uploadFile();
        setUploading(false);
      }

      // Step 2: Submit Claim
      await axios.post(`${API_URL}/claims`, {
        type,
        description,
        amountRequested: parseFloat(amount),
        subscriptionId: subId,
        documents: documentUrls
      }, { headers: { Authorization: `Bearer ${token}` } });

      Alert.alert("Sucesso", "O seu pedido de sinistro foi submetido e será analisado em breve.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Não foi possível submeter o sinistro.";
      Alert.alert("Erro", msg);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comunicar Sinistro</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Info size={20} color="#60A5FA" />
          <Text style={styles.infoText}>
            Utilize este formulário para solicitar reembolsos ou comunicar eventos cobertos pelo seu plano.
          </Text>
        </View>

        <View style={styles.form}>
           <Text style={styles.label}>TIPO DE EVENTO</Text>
           <View style={styles.typeSelector}>
              {['consultation', 'exam', 'pharmacy', 'other'].map(t => (
                <TouchableOpacity 
                  key={t} 
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                    {t === 'consultation' ? 'Consulta' : t === 'exam' ? 'Exame' : t === 'pharmacy' ? 'Farmácia' : 'Outro'}
                  </Text>
                </TouchableOpacity>
              ))}
           </View>

           <Text style={styles.label}>PLANO / BENEFICIÁRIO</Text>
           <TouchableOpacity 
             style={styles.input} 
             onPress={() => setShowSubModal(true)}
           >
             <Text style={{ color: subId ? '#FFF' : '#475569' }}>
               {subscriptions.find(s => s._id === subId)?.plan?.name || 'Selecione o plano...'}
             </Text>
           </TouchableOpacity>

           <Text style={styles.label}>VALOR ESTIMADO (MT)</Text>
           <TextInput 
             style={styles.input}
             placeholder="0.00"
             placeholderTextColor="#475569"
             keyboardType="numeric"
             value={amount}
             onChangeText={setAmount}
           />

           <Text style={styles.label}>DESCRIÇÃO DOS FACTOS</Text>
           <TextInput 
             style={[styles.input, styles.textArea]}
             placeholder="Descreva o que aconteceu..."
             placeholderTextColor="#475569"
             multiline
             numberOfLines={4}
             value={description}
             onChangeText={setDescription}
           />

           <TouchableOpacity style={styles.uploadBox} onPress={handlePickDocument}>
              <FileText size={24} color={selectedFile ? "#60A5FA" : "#64748b"} />
              <Text style={[styles.uploadText, selectedFile && { color: '#60A5FA' }]}>
                {selectedFile ? selectedFile.name : "Anexar Recibos / Relatórios"}
              </Text>
              <Text style={styles.uploadSubtext}>
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Formato PDF ou Imagem (Máx 5MB)"}
              </Text>
           </TouchableOpacity>

           <Modal visible={showSubModal} transparent animationType="slide">
             <View style={styles.modalBg}>
               <View style={styles.modalContent}>
                 <Text style={styles.modalTitle}>Selecione o Plano</Text>
                 <FlatList 
                   data={subscriptions}
                   keyExtractor={(item) => item._id}
                   renderItem={({ item }) => (
                     <TouchableOpacity 
                       style={styles.modalItem}
                       onPress={() => {
                         setSubId(item._id);
                         setShowSubModal(false);
                       }}
                     >
                       <Text style={styles.modalItemText}>{item.plan?.name}</Text>
                       <CheckCircle size={20} color={subId === item._id ? "#2563eb" : "#334155"} />
                     </TouchableOpacity>
                   )}
                 />
                 <TouchableOpacity 
                   style={styles.closeBtn}
                   onPress={() => setShowSubModal(false)}
                 >
                   <Text style={styles.closeBtnText}>Fechar</Text>
                 </TouchableOpacity>
               </View>
             </View>
           </Modal>

           <TouchableOpacity 
             style={[styles.submitBtn, (loading || uploading) && { opacity: 0.7 }]} 
             onPress={handleSubmit}
             disabled={loading || uploading}
           >
             {loading || uploading ? (
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                 <ActivityIndicator color="#FFFFFF" />
                 <Text style={styles.submitBtnText}>{uploading ? "A carregar ficheiro..." : "A submeter..."}</Text>
               </View>
             ) : (
               <Text style={styles.submitBtnText}>Submeter Processo</Text>
             )}
           </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeBtnActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
  },
  typeBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#60A5FA',
  },
  uploadBox: {
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
  },
  uploadText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  uploadSubtext: {
    color: '#475569',
    fontSize: 11,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 10,
  },
  modalItemText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
  }
});
