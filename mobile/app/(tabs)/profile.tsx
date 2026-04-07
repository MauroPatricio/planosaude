import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../src/config';

export default function ProfileScreen() {
  const { user, token, logout } = useAuthStore();
  const [fullUser, setFullUser] = useState<any>(null);
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(true);
  const [biometrics, setBiometrics] = React.useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFullUser(data);
    } catch (err) {
      console.error('Erro ao carregar perfil completo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const handleUpdateDocument = async (field: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setUpdating(field);
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'upload.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpg`;

        formData.append(field, { uri, name: filename, type } as any);

        await axios.patch(`${API_URL}/auth/profile/documents`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        Alert.alert('Sucesso', 'Documento atualizado com sucesso.');
        fetchProfile();
      } catch (err) {
        Alert.alert('Erro', 'Falha ao atualizar documento.');
      } finally {
        setUpdating(null);
      }
    }
  };

  const renderDocItem = (title: string, field: string, url?: string) => (
    <View style={styles.docItem}>
      <View style={styles.docIconWrapper}>
        <Icons.FileText size={20} color="#94a3b8" />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docStatus}>{url ? 'Enviado ✓' : 'Não enviado'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.updateDocBtn}
        onPress={() => handleUpdateDocument(field)}
        disabled={!!updating}
      >
        {updating === field ? (
          <ActivityIndicator size="small" color="#60A5FA" />
        ) : (
          <Icons.Camera size={18} color="#60A5FA" />
        )}
      </TouchableOpacity>
    </View>
  );

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
                {fullUser?.profileImage || user?.profileImage ? (
                  <Image 
                    source={{ uri: (fullUser?.profileImage || user?.profileImage).startsWith('http') 
                      ? (fullUser?.profileImage || user?.profileImage) 
                      : `${BASE_URL}${fullUser?.profileImage || user?.profileImage}` }} 
                    style={styles.avatarImage} 
                  />
                ) : (
                  <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.editAvatarBtn}
                onPress={() => handleUpdateDocument('profilePhoto')}
                disabled={!!updating}
              >
                 {updating === 'profilePhoto' ? (
                   <ActivityIndicator size="small" color="#fff" />
                 ) : (
                   <Icons.Settings size={14} color="#FFFFFF" />
                 )}
              </TouchableOpacity>
           </View>
           <Text style={styles.userName}>{fullUser?.name || user?.name}</Text>
           <Text style={styles.userEmail}>{fullUser?.email || user?.email}</Text>
           <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{(fullUser?.role || user?.role || '').toUpperCase()}</Text>
           </View>
        </View>

        {/* User Status / Info (Only for Clients) */}
        {fullUser?.role === 'client' && (
          <>
            <Text style={styles.sectionTitle}>Documentação Verificada</Text>
            <View style={styles.settingsGroup}>
               {renderDocItem('Identidade (Frente)', 'idFront', fullUser?.clientId?.documents?.identificationFrontUrl)}
               <View style={styles.divider} />
               {renderDocItem('Identidade (Verso)', 'idBack', fullUser?.clientId?.documents?.identificationBackUrl)}
               <View style={styles.divider} />
               {renderDocItem('Comprovativo Morada', 'addressProof', fullUser?.clientId?.documents?.addressProofUrl)}
            </View>
          </>
        )}

        {/* General Settings */}
        <Text style={styles.sectionTitle}>Configurações Gerais</Text>
        <View style={styles.settingsGroup}>
           <View style={styles.settingItem}>
              <View style={styles.settingIconWrapperBlue}>
                 <Icons.Bell size={20} color="#60A5FA" />
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
                 <Icons.Fingerprint size={20} color="#34d399" />
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
                 <Icons.Globe size={20} color="#F59E0B" />
              </View>
              <Text style={styles.settingLabel}>Idioma</Text>
              <View style={styles.settingRight}>
                 <Text style={styles.settingValue}>Português (PT)</Text>
                 <Icons.ChevronRight size={18} color="#475569" />
              </View>
           </TouchableOpacity>
        </View>

        {/* Security & Data */}
        <Text style={styles.sectionTitle}>Segurança & Planos</Text>
        <View style={styles.settingsGroup}>
           <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconWrapperSlate}>
                 <Icons.Shield size={20} color="#94a3b8" />
              </View>
              <Text style={styles.settingLabel}>Alterar Palavra-passe</Text>
              <Icons.ChevronRight size={18} color="#475569" />
           </TouchableOpacity>

           <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconWrapperSlate}>
                 <Icons.CreditCard size={20} color="#94a3b8" />
              </View>
              <Text style={styles.settingLabel}>Meus Cartões Digitais</Text>
              <Icons.ChevronRight size={18} color="#475569" />
           </TouchableOpacity>

           <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIconWrapperSlate}>
                 <Icons.HelpCircle size={20} color="#94a3b8" />
              </View>
              <Text style={styles.settingLabel}>Centro de Ajuda / FAQ</Text>
              <Icons.ChevronRight size={18} color="#475569" />
           </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
           <Icons.LogOut size={20} color="#EF4444" />
           <Text style={styles.logoutText}>Encerrar Sessão</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versão 1.0.1 (Premium Beta)</Text>
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
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
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
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  docIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  docStatus: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  updateDocBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 16,
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
