import React, { useState } from 'react';
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
  ScrollView
} from 'react-native';
import { 
  Building2, Lock, Mail, User, ChevronRight, 
  AlertCircle, Briefcase, Globe, Phone, CheckCircle2,
  ArrowLeft
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: 'corretora',
    contactEmail: '',
    contactPhone: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleNext = () => {
    if (step === 1) {
      if (!formData.companyName || !formData.contactEmail || !formData.contactPhone) {
        setError('Preencha os dados da empresa para continuar.');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!formData.adminName || !formData.adminEmail || !formData.password) {
      setError('Preencha os dados do administrador.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use 10.0.2.2 for Android Emulator, localhost for iOS
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
      await axios.post(`${baseUrl}/api/auth/register-tenant`, formData);
      router.replace('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Background */}
      <View style={styles.background}>
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.blob1} />
        <View style={styles.blob2} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => step === 2 ? setStep(1) : router.back()}
          >
            <ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            {step === 1 ? (
              <Building2 size={32} color="#60A5FA" />
            ) : (
              <User size={32} color="#60A5FA" />
            )}
          </View>
          <Text style={styles.title}>
            {step === 1 ? 'Registrar Empresa' : 'Administrador'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Configure sua organização' : 'Crie seu perfil de acesso'}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={18} color="#F87171" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {step === 1 ? (
            <View style={styles.stepContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOME DA EMPRESA</Text>
                <View style={styles.inputWrapper}>
                  <Building2 size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome da organização"
                    placeholderTextColor="#475569"
                    value={formData.companyName}
                    onChangeText={(val) => setFormData({...formData, companyName: val})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TIPO DE NEGÓCIO</Text>
                <View style={styles.inputWrapper}>
                  <Briefcase size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Corretora, Clínica"
                    placeholderTextColor="#475569"
                    value={formData.companyType}
                    onChangeText={(val) => setFormData({...formData, companyType: val})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL INSTITUCIONAL</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="geral@empresa.com"
                    placeholderTextColor="#475569"
                    value={formData.contactEmail}
                    onChangeText={(val) => setFormData({...formData, contactEmail: val})}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONTACTO TELEFÓNICO</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+258 ..."
                    placeholderTextColor="#475569"
                    value={formData.contactPhone}
                    onChangeText={(val) => setFormData({...formData, contactPhone: val})}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleNext}
                style={styles.submitButton}
              >
                <LinearGradient
                  colors={['#2563eb', '#1d4ed8']}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>Próximo Passo</Text>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOME DO ADMINISTRADOR</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome completo"
                    placeholderTextColor="#475569"
                    value={formData.adminName}
                    onChangeText={(val) => setFormData({...formData, adminName: val})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL DE ACESSO</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="admin@empresa.com"
                    placeholderTextColor="#475569"
                    value={formData.adminEmail}
                    onChangeText={(val) => setFormData({...formData, adminEmail: val})}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PALAVRA-PASSE</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    value={formData.password}
                    onChangeText={(val) => setFormData({...formData, password: val})}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRMAR PALAVRA-PASSE</Text>
                <View style={styles.inputWrapper}>
                  <CheckCircle2 size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    value={formData.confirmPassword}
                    onChangeText={(val) => setFormData({...formData, confirmPassword: val})}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={handleRegister}
                disabled={loading}
                style={styles.submitButton}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Text style={styles.buttonText}>Finalizar Registro</Text>
                      <ChevronRight size={20} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.loginText}>
            Já possui conta? <Text style={styles.loginTextBold}>Iniciar Sessão</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  blob1: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
  },
  blob2: {
    position: 'absolute',
    bottom: -width * 0.1,
    left: -width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#60A5FA',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  form: {
    gap: 20,
  },
  stepContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    marginLeft: 4,
    letterSpacing: 1.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  gradient: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: 32,
    alignItems: 'center',
  },
  loginText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  loginTextBold: {
    color: '#60A5FA',
    fontWeight: '800',
  },
});
