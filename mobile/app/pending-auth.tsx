import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function PendingAuthScreen() {
  const { user, refreshUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const updatedUser = await refreshUser();
      if (updatedUser.status === 'active') {
        const destination = updatedUser.role === 'client' ? '/(tabs)/home' : '/(tabs)/dashboard';
        router.replace(destination as any);
      } else if (updatedUser.status === 'rejected') {
        Alert.alert('Conta Rejeitada', 'A sua conta foi rejeitada. Entre em contacto com o suporte para mais informações.');
      } else {
        Alert.alert('Aguardando...', 'A sua conta ainda está a ser validada pelos nossos administradores.');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o estado no momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Blobs */}
      <View style={[styles.blob, { top: -100, right: -100, backgroundColor: 'rgba(59, 130, 246, 0.1)' }]} />
      <View style={[styles.blob, { bottom: -100, left: -100, backgroundColor: 'rgba(96, 165, 250, 0.05)' }]} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
            style={styles.iconGradient}
          >
            <Icons.Clock size={48} color="#F59E0B" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Validação Pendente</Text>
        <Text style={styles.description}>
          Olá, <Text style={styles.highlight}>{user?.name}</Text>.{"\n"}
          A sua conta foi criada com sucesso, mas ainda requer autorização da nossa equipa administrativa.
        </Text>

        <View style={styles.messageBox}>
          <Icons.Info size={18} color="#60A5FA" />
          <Text style={styles.messageText}>
            “Conta não autorizada. Por favor, aguarde validação ou contacte o suporte.”
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.refreshBtn}
          onPress={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Icons.RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.refreshBtnText}>Verificar Estado Agora</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={logout}
        >
          <Icons.LogOut size={20} color="#94a3b8" />
          <Text style={styles.logoutBtnText}>Sair da Conta</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Precisa de ajuda urgente? Contate o suporte: </Text>
          <Text style={styles.supportLink}>nhiquelaservicos@gmail.com</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    zIndex: 1,
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  highlight: {
    color: '#60A5FA',
    fontWeight: '700',
  },
  messageBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    marginBottom: 40,
    gap: 12,
    width: '100%',
  },
  messageText: {
    flex: 1,
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  refreshBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    height: 58,
    width: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    height: 52,
    width: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  logoutBtnText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
  },
  supportLink: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  }
});
