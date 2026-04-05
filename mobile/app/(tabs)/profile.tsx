import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Switch
} from 'react-native';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  LogOut, 
  ChevronRight,
  Globe,
  CreditCard,
  HelpCircle,
  Fingerprint
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);
  const [biometrics, setBiometrics] = React.useState(false);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Meu Perfil</Text>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
           <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                 <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
              </View>
              <TouchableOpacity style={styles.editAvatarBtn}>
                 <Settings size={14} color="#FFFFFF" />
              </TouchableOpacity>
           </View>
           <Text style={styles.userName}>{user?.name}</Text>
           <Text style={styles.userEmail}>{user?.email}</Text>
           <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role.toUpperCase()}</Text>
           </View>
        </View>

        {/* General Settings */}
        <Text style={styles.sectionTitle}>Configurações Gerais</Text>
        <View style={styles.settingsGroup}>
           <View style={styles.settingItem}>
              <View style={styles.settingIconWrapperBlue}>
                 <Bell size={20} color="#60A5FA" />
              </View>
              <Text style={styles.settingLabel}>Notificações Push</Text>
              <Switch 
                 value={notifications} 
                 onValueChange={setNotifications}
                 trackColor={{ false: '#334155', true: '#2563eb' }}
                 thumbColor={notifications ? '#FFFFFF' : '#94a3b8'}
              />
           </View>

           <View style={styles.settingItem}>
              <View style={styles.settingIconWrapperGreen}>
                 <Fingerprint size={20} color="#34d399" />
              </View>
              <Text style={styles.settingLabel}>Login com Biometria</Text>
              <Switch 
                 value={biometrics} 
                 onValueChange={setBiometrics}
                 trackColor={{ false: '#334155', true: '#10b981' }}
                 thumbColor={biometrics ? '#FFFFFF' : '#94a3b8'}
              />
           </View>

           <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconWrapperAmber}>
                 <Globe size={20} color="#F59E0B" />
              </View>
              <Text style={styles.settingLabel}>Idioma</Text>
              <View style={styles.settingRight}>
                 <Text style={styles.settingValue}>Português (PT)</Text>
                 <ChevronRight size={18} color="#475569" />
              </View>
           </TouchableOpacity>
        </View>

        {/* Security & Data */}
        <Text style={styles.sectionTitle}>Segurança & Planos</Text>
        <View style={styles.settingsGroup}>
           <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconWrapperSlate}>
                 <Shield size={20} color="#94a3b8" />
              </View>
              <Text style={styles.settingLabel}>Alterar Palavra-passe</Text>
              <ChevronRight size={18} color="#475569" />
           </TouchableOpacity>

           <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconWrapperSlate}>
                 <CreditCard size={20} color="#94a3b8" />
              </View>
              <Text style={styles.settingLabel}>Meus Cartões Digitais</Text>
              <ChevronRight size={18} color="#475569" />
           </TouchableOpacity>

           <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconWrapperSlate}>
                 <HelpCircle size={20} color="#94a3b8" />
              </View>
              <Text style={styles.settingLabel}>Centro de Ajuda / FAQ</Text>
              <ChevronRight size={18} color="#475569" />
           </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
           <LogOut size={20} color="#EF4444" />
           <Text style={styles.logoutText}>Encerrar Sessão</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versão 1.0.0 (Premium Beta)</Text>
        <View style={{ height: 40 }} />
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
    marginBottom: 32,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  userEmail: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  roleText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 24,
    padding: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 16,
  },
  settingIconWrapperBlue: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconWrapperGreen: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconWrapperAmber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconWrapperSlate: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
    marginBottom: 24,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  },
  versionText: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  }
});
