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
  Dimensions
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { useAuthStore } from '../src/store/authStore';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { registerForPushNotificationsAsync, registerTokenWithBackend } from '../src/services/notificationService';
import { API_URL } from '../src/config';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real device, you'd use your local IP instead of localhost
      const response = await axios.post(`${API_URL}/auth/login`, { 
        email, 
        password 
      });
      const userData = response.data;
      setAuth(userData, userData.token);

      // Register for Push Notifications
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await registerTokenWithBackend(pushToken, userData.token);
        }
      } catch (pushErr) {
        console.error('Erro ao registar notificações:', pushErr);
      }

      const destination = userData.status === 'active' 
        ? (userData.role === 'client' ? '/(tabs)/home' : '/(tabs)/dashboard')
        : '/pending-auth';
        
      router.replace(destination as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar login. Verifique sua conexão.');
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
      
      {/* Background with Gradients and Blobs */}
      <View style={styles.background}>
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.blob1} />
        <View style={styles.blob2} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
            style={styles.logoContainer}
          >
            <Icons.Shield size={38} color="#60A5FA" />
          </LinearGradient>
          <Text style={styles.title}>PlanoSaude360</Text>
          <Text style={styles.subtitle}>Gestão Inteligente de Corretagem</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Icons.AlertCircle size={18} color="#F87171" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL PROFISSIONAL</Text>
            <View style={styles.inputWrapper}>
              <Icons.Mail size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seuemail@gmail.com"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PALAVRA-PASSE</Text>
            <View style={styles.inputWrapper}>
              <Icons.Lock size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <Icons.EyeOff size={20} color="#64748b" />
                ) : (
                  <Icons.Eye size={20} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Entrar no Sistema</Text>
                  <Icons.ChevronRight size={20} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            style={styles.registerButton}
            onPress={() => router.push('/register-client')}
          >
            <LinearGradient
              colors={['rgba(30, 41, 59, 0.4)', 'rgba(30, 41, 59, 0.1)']}
              style={styles.registerButtonGradient}
            >
              <View style={styles.registerButtonInner}>
                <View style={styles.registerIconContainer}>
                   <Icons.UserPlus size={18} color="#60A5FA" />
                </View>
                <View style={styles.registerTextContainer}>
                  <Text style={styles.registerTextTitle}>Novo no PlanoSaude360?</Text>
                  <Text style={styles.registerTextSub}>Crie a sua conta de cliente agora</Text>
                </View>
                <Icons.ChevronRight size={18} color="#475569" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Acesso restrito a colaboradores autorizados.
          </Text>
          <Text style={styles.copyrightText}>
            © 2026 Nhiquela Servicos e Consultoria
          </Text>
        </View>
      </View>
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
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  blob2: {
    position: 'absolute',
    bottom: -width * 0.1,
    left: -width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 14,
    borderRadius: 16,
    marginBottom: 28,
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
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 58,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    borderRadius: 18,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerContainer: {
    marginTop: 64,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 18,
  },
  copyrightText: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  registerButton: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  registerButtonGradient: {
    padding: 16,
  },
  registerButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  registerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerTextContainer: {
    flex: 1,
  },
  registerTextTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  registerTextSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
});
