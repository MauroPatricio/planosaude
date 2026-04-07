import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  Modal
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../src/config';

const { width } = Dimensions.get('window');

export default function RegisterClientScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    planType: 'particular', // 'particular' | 'institucional'
    institutionId: '',
    documentType: 'BI', // 'BI' | 'Passaporte'
    documentNumber: '',
    address: '',
    idFront: null as any,
    idBack: null as any,
    addressProof: null as any,
    profilePhoto: null as any,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showInstModal, setShowInstModal] = useState(false);
  const [instSearch, setInstSearch] = useState('');

  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (step === 2 && institutions.length === 0) {
      fetchInstitutions();
    }
  }, [step]);

  const fetchInstitutions = async () => {
    try {
      const resp = await axios.get(`${API_URL}/institutions-public`);
      setInstitutions(resp.data);
    } catch (err) {
      console.error('Erro ao buscar instituições:', err);
    }
  };

  const pickImage = async (field: string, useCamera: boolean = false) => {
    let result;
    
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Precisamos de acesso à câmara para tirar a foto.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Precisamos de acesso à sua galeria.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
    }

    if (!result.canceled) {
      setFormData({ ...formData, [field]: result.assets[0] });
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.phone) {
        setError('Preencha os campos obrigatórios.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }
    }
    
    if (step === 2 && formData.planType === 'institucional' && !formData.institutionId) {
      setError('Selecione uma instituição.');
      return;
    }

    if (step === 3) {
      console.log('Step 3 Validation:', {
        documentNumber: formData.documentNumber,
        address: formData.address,
        idFront: !!formData.idFront
      });
      if (!formData.documentNumber) {
        setError('Preencha o número do documento.');
        return;
      }
      if (!formData.address) {
        setError('Preencha a sua morada completa.');
        return;
      }
      if (!formData.idFront) {
        setError('Submeta a foto da frente do documento.');
        return;
      }
    }

    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (!['idFront', 'idBack', 'addressProof', 'profilePhoto'].includes(key)) {
          data.append(key, (formData as any)[key]);
        }
      });

      // Append files
      if (formData.idFront) {
        data.append('idFront', {
          uri: formData.idFront.uri,
          name: 'idFront.jpg',
          type: 'image/jpeg',
        } as any);
      }
      if (formData.idBack) {
        data.append('idBack', {
          uri: formData.idBack.uri,
          name: 'idBack.jpg',
          type: 'image/jpeg',
        } as any);
      }
      if (formData.addressProof) {
        data.append('addressProof', {
          uri: formData.addressProof.uri,
          name: 'addressProof.jpg',
          type: 'image/jpeg',
        } as any);
      }
      if (formData.profilePhoto) {
        data.append('profilePhoto', {
          uri: formData.profilePhoto.uri,
          name: 'profilePhoto.jpg',
          type: 'image/jpeg',
        } as any);
      }

      await axios.post(`${API_URL}/auth/register-client`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Sucesso!', 'Seu cadastro foi submetido e está em análise.', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (err: any) {
      console.error('Registration error:', err.response?.data);
      const msg = err.response?.data?.message || 'Erro ao submeter cadastro.';
      const details = err.response?.data?.details;
      setError(details && details.length > 0 ? `${msg}: ${details.join(', ')}` : msg);
    } finally {
      setLoading(false);
    }
  };

  const renderProgress = () => (
    <View style={styles.progressWrapper}>
      {[1, 2, 3, 4, 5].map((s) => (
        <View 
          key={s} 
          style={[
            styles.progressDot, 
            s <= step ? styles.progressDotActive : null,
            s < step ? styles.progressDotDone : null
          ]} 
        />
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
            <Icons.ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Cliente</Text>
          <View style={{ width: 24 }} />
        </View>

        {renderProgress()}

        <View style={styles.card}>
          <Text style={styles.stepTitle}>
            {step === 1 && "Dados Básicos"}
            {step === 2 && "Tipo de Plano"}
            {step === 3 && "Identificação"}
            {step === 4 && "Foto do Cliente"}
            {step === 5 && "Resumo"}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* STEP 1 */}
          {step === 1 && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOME COMPLETO</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.name}
                  onChangeText={(val: string) => setFormData({...formData, name: val})}
                  placeholder="Seu nome"
                  placeholderTextColor="#475569"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput 
                  style={styles.input} 
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val: string) => setFormData({...formData, email: val})}
                  placeholder="exemplo@gmail.com"
                  placeholderTextColor="#475569"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TELEFONE</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(val: string) => setFormData({...formData, phone: val})}
                  placeholder="+258 8X XXX XXXX"
                  placeholderTextColor="#475569"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput 
                    style={styles.flexInput} 
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(val: string) => setFormData({...formData, password: val})}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Icons.EyeOff size={20} color="#60A5FA" /> : <Icons.Eye size={20} color="#64748b" />}
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRMAR PASSWORD</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput 
                    style={styles.flexInput} 
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirmPassword}
                    onChangeText={(val: string) => setFormData({...formData, confirmPassword: val})}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <Icons.EyeOff size={20} color="#60A5FA" /> : <Icons.Eye size={20} color="#64748b" />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View style={styles.form}>
              <Text style={styles.label}>QUAL O SEU TIPO DE ADESÃO?</Text>
              <View style={styles.planOptions}>
                <TouchableOpacity 
                   style={[styles.planCard, formData.planType === 'particular' && styles.planCardActive]}
                   onPress={() => setFormData({...formData, planType: 'particular'})}
                >
                  <Icons.User size={24} color={formData.planType === 'particular' ? '#60A5FA' : '#64748b'} />
                  <Text style={[styles.planText, formData.planType === 'particular' && styles.planTextActive]}>Particular</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                   style={[styles.planCard, formData.planType === 'institucional' && styles.planCardActive]}
                   onPress={() => setFormData({...formData, planType: 'institucional'})}
                >
                  <Icons.Building2 size={24} color={formData.planType === 'institucional' ? '#60A5FA' : '#64748b'} />
                  <Text style={[styles.planText, formData.planType === 'institucional' && styles.planTextActive]}>Instituição</Text>
                </TouchableOpacity>
              </View>

              {formData.planType === 'institucional' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SELECIONE A SUA INSTITUIÇÃO</Text>
                  <TouchableOpacity 
                    style={styles.selectboxTrigger} 
                    onPress={() => setShowInstModal(true)}
                  >
                    <View style={styles.selectboxContent}>
                      <Icons.Building2 size={18} color="#60A5FA" />
                      <Text style={[styles.selectboxValue, !formData.institutionId && styles.selectboxPlaceholder]}>
                        {formData.institutionId 
                          ? (institutions.find((i: any) => i._id === formData.institutionId) as any)?.name 
                          : "Localizar minha instituição..."}
                      </Text>
                    </View>
                    <Icons.ChevronDown size={18} color="#64748b" />
                  </TouchableOpacity>

                  <Modal
                    visible={showInstModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowInstModal(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>Instituições Parceiras</Text>
                          <TouchableOpacity onPress={() => setShowInstModal(false)}>
                            <Icons.X size={24} color="#64748b" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                          <Icons.Search size={18} color="#475569" style={styles.searchIcon} />
                          <TextInput 
                            style={styles.modalSearchInput}
                            placeholder="Procurar instituição..."
                            placeholderTextColor="#475569"
                            value={instSearch}
                            onChangeText={setInstSearch}
                          />
                        </View>

                        <ScrollView style={styles.modalList}>
                          {institutions
                            .filter((inst: any) => inst.name.toLowerCase().includes(instSearch.toLowerCase()))
                            .map((inst: any) => (
                              <TouchableOpacity 
                                key={inst._id}
                                style={[styles.modalItem, formData.institutionId === inst._id && styles.modalItemActive]}
                                onPress={() => {
                                  setFormData({...formData, institutionId: inst._id});
                                  setShowInstModal(false);
                                  setInstSearch('');
                                }}
                              >
                                <View style={styles.modalItemLeft}>
                                  <View style={styles.instIconSmall}>
                                    <Icons.Building2 size={16} color="#60A5FA" />
                                  </View>
                                  <Text style={styles.modalItemText}>{inst.name}</Text>
                                </View>
                                {formData.institutionId === inst._id && <Icons.CheckCircle size={18} color="#10B981" />}
                              </TouchableOpacity>
                            ))}
                          {institutions.length === 0 && (
                            <View style={styles.emptyResults}>
                              <Icons.SearchX size={32} color="#334155" />
                              <Text style={styles.emptyText}>Nenhuma instituição encontrada.</Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    </View>
                  </Modal>
                </View>
              )}
            </View>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NÚMERO DO DOCUMENTO ({formData.documentType})</Text>
                <TextInput 
                   style={styles.input} 
                   value={formData.documentNumber}
                   onChangeText={(val: string) => setFormData({...formData, documentNumber: val})}
                   placeholder="Número do BI"
                   placeholderTextColor="#475569"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>MORADA / ENDEREÇO</Text>
                <TextInput 
                   style={styles.input} 
                   value={formData.address}
                   onChangeText={(val: string) => setFormData({...formData, address: val})}
                   placeholder="Ex: Maputo, Av. 25 de Setembro"
                   placeholderTextColor="#475569"
                />
              </View>

              <View style={styles.uploadSection}>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('idFront')}>
                   {formData.idFront ? <Image source={{ uri: formData.idFront.uri }} style={styles.preview} /> : <Icons.Upload color="#60A5FA" />}
                   <Text style={styles.uploadText}>Frente do Doc</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('idBack')}>
                   {formData.idBack ? <Image source={{ uri: formData.idBack.uri }} style={styles.preview} /> : <Icons.Upload color="#60A5FA" />}
                   <Text style={styles.uploadText}>Verso do Doc</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('addressProof')}>
                   {formData.addressProof ? <Image source={{ uri: formData.addressProof.uri }} style={styles.preview} /> : <Icons.FileText color="#60A5FA" />}
                   <Text style={styles.uploadText}>Comprov. Morada</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <View style={styles.photoContainer}>
              <TouchableOpacity style={styles.bigPhotoBtn} onPress={() => pickImage('profilePhoto', true)}>
                {formData.profilePhoto ? (
                  <Image source={{ uri: formData.profilePhoto.uri }} style={styles.fullPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Icons.Camera size={40} color="#60A5FA" />
                    <Text style={styles.photoText}>Tirar Foto Agora</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => pickImage('profilePhoto', false)}>
                <Text style={styles.galleryLink}>Escolher da Galeria</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewLabel}>NOME: <Text style={styles.reviewVal}>{formData.name}</Text></Text>
              <Text style={styles.reviewLabel}>PLANO: <Text style={styles.reviewVal}>{formData.planType}</Text></Text>
              <Text style={styles.reviewLabel}>ESTADO: <Text style={styles.reviewVal}>Pendente de Validação</Text></Text>
              
              <Icons.ShieldCheck size={48} color="#10B981" style={{ alignSelf: 'center', marginVertical: 20 }} />
              <Text style={styles.finalNote}>Ao confirmar, os seus dados serão enviados para auditoria.</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.mainBtn} 
            onPress={step === 5 ? handleSubmit : handleNext}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{step === 5 ? "Confirmar Registo" : "Próximo Passo"}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  progressWrapper: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 30 },
  progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#334155' },
  progressDotActive: { backgroundColor: '#60A5FA' },
  progressDotDone: { backgroundColor: '#10B981' },
  card: { backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155' },
  stepTitle: { fontSize: 13, fontWeight: '900', color: '#60A5FA', textTransform: 'uppercase', marginBottom: 20, letterSpacing: 1 },
  form: { gap: 18 },
  inputGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 15 },
  passwordInputContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#0f172a', 
    borderRadius: 12, 
    alignItems: 'center',
    paddingRight: 12
  },
  flexInput: { 
    flex: 1, 
    padding: 16, 
    color: '#fff', 
    fontSize: 15 
  },
  eyeIcon: { 
    padding: 8,
    marginLeft: 4
  },
  planOptions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planCard: { flex: 1, height: 100, backgroundColor: '#0f172a', borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  planCardActive: { borderColor: '#60A5FA', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  planText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 },
  planTextActive: { color: '#60A5FA' },
  instItem: { padding: 16, backgroundColor: '#0f172a', borderRadius: 12, marginBottom: 8 },
  instItemActive: { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 1, borderColor: '#60A5FA' },
  instText: { color: '#fff', fontSize: 14 },
  uploadSection: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  uploadBtn: { width: '48%', height: 100, backgroundColor: '#0f172a', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  preview: { ...StyleSheet.absoluteFillObject },
  photoContainer: { alignItems: 'center', gap: 20 },
  bigPhotoBtn: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#334155' },
  fullPreview: { ...StyleSheet.absoluteFillObject },
  photoPlaceholder: { alignItems: 'center', gap: 10 },
  photoText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  galleryLink: { color: '#60A5FA', fontWeight: 'bold' },
  reviewContainer: { gap: 10 },
  reviewLabel: { color: '#94a3b8', fontSize: 14 },
  reviewVal: { color: '#fff', fontWeight: 'bold' },
  finalNote: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 20 },
  mainBtn: { marginTop: 30, backgroundColor: '#60A5FA', borderRadius: 16, height: 58, alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#F87171', fontSize: 12, marginBottom: 15, fontWeight: 'bold' },
  uploadText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' },
  
  // Selectbox Styles
  selectboxTrigger: { 
    flexDirection: 'row', 
    backgroundColor: '#0f172a', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155'
  },
  selectboxContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    flex: 1
  },
  selectboxValue: { 
    color: '#fff', 
    fontSize: 15,
    fontWeight: '500'
  },
  selectboxPlaceholder: { color: '#475569' },

  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#1e293b', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    maxHeight: '80%',
    minHeight: '50%'
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#fff', 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'normal' 
  },
  searchContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#0f172a', 
    borderRadius: 12, 
    alignItems: 'center', 
    paddingHorizontal: 12,
    marginBottom: 20
  },
  searchIcon: { marginRight: 8 },
  modalSearchInput: { 
    flex: 1, 
    height: 50, 
    color: '#fff', 
    fontSize: 14 
  },
  modalList: { flex: 1 },
  modalItem: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 10, 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: 'rgba(51, 65, 85, 0.3)'
  },
  modalItemActive: { 
    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
    borderWidth: 1, 
    borderColor: '#60A5FA' 
  },
  modalItemLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  instIconSmall: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  modalItemText: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '600' 
  },
  emptyResults: { 
    padding: 40, 
    alignItems: 'center', 
    gap: 12 
  },
  emptyText: { 
    color: '#475569', 
    fontSize: 14, 
    textAlign: 'center' 
  }
});
