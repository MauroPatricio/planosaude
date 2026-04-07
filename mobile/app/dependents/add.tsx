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
  ScrollView,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as LucideIcons from 'lucide-react-native';
const Icons = LucideIcons as any;
import { useRouter } from 'expo-router';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { API_URL } from '../../src/config';

export default function AddDependentScreen() {
  const { user, token } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Esposo(a)',
    documentNumber: '',
    phone: '',
  });
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!formData.name || !formData.relationship) {
      Alert.alert('Erro', 'Por favor, preencha o nome e o grau de parentesco.');
      return;
    }
    
    // Map UI labels to backend enum values
    const relationshipMap: Record<string, string> = {
      'Esposo(a)': 'conjuge',
      'Filho(a)': 'filho',
      'Pai/Mãe': 'pai',
      'Outro': 'outro'
    };

    setLoading(true);
    try {
      await axios.post(`${API_URL}/members`, {
        ...formData,
        relationship: relationshipMap[formData.relationship] || 'outro',
        birthDate: birthDate.toISOString().split('T')[0], // Send as YYYY-MM-DD
        primaryClient: user?.clientId,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Sucesso', 'Dependente adicionado com sucesso. Aguarde a validação pela corretora.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error('Erro ao criar dependente:', err.response?.data || err.message);
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao adicionar dependente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Icons.ArrowLeft size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Dependente</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <Icons.Users size={48} color="#60A5FA" style={{ alignSelf: 'center', marginBottom: 20 }} />
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NOME COMPLETO</Text>
              <TextInput 
                style={styles.input} 
                value={formData.name}
                onChangeText={(val) => setFormData({...formData, name: val})}
                placeholder="Nome do dependente"
                placeholderTextColor="#475569"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GRAU DE PARENTESCO</Text>
              <View style={styles.optionsRow}>
                {['Esposo(a)', 'Filho(a)', 'Pai/Mãe', 'Outro'].map((rel) => (
                  <TouchableOpacity 
                    key={rel}
                    style={[styles.optionBtn, formData.relationship === rel && styles.optionBtnActive]}
                    onPress={() => setFormData({...formData, relationship: rel})}
                  >
                    <Text style={[styles.optionText, formData.relationship === rel && styles.optionTextActive]}>{rel}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DATA DE NASCIMENTO</Text>
              
              <TouchableOpacity 
                style={styles.dateDisplay} 
                onPress={() => setShowDatePicker(true)}
              >
                <Icons.Calendar size={18} color="#64748b" style={{ marginRight: 12 }} />
                <Text style={styles.dateText}>
                  {birthDate.toLocaleDateString('pt-PT')}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || birthDate;
                    setShowDatePicker(Platform.OS === 'ios');
                    setBirthDate(currentDate);
                  }}
                  maximumDate={new Date()} // Can't be born in the future
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>NR. DOCUMENTO (OPCIONAL)</Text>
              <TextInput 
                style={styles.input} 
                value={formData.documentNumber}
                onChangeText={(val) => setFormData({...formData, documentNumber: val})}
                placeholder="Número do BI"
                placeholderTextColor="#475569"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Registar Dependente</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBox}>
           <Icons.Info size={20} color="#64748b" />
           <Text style={styles.infoText}>A adição de dependentes pode influenciar o valor da sua mensalidade.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 15 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  optionBtnActive: { borderColor: '#60A5FA', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  optionText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  optionTextActive: { color: '#60A5FA' },
  submitBtn: { marginTop: 20, backgroundColor: '#2563eb', borderRadius: 16, height: 58, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 32, paddingHorizontal: 10 },
  infoText: { flex: 1, color: '#64748b', fontSize: 12, lineHeight: 18 },
  dateDisplay: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0f172a', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#334155' 
  },
  dateText: { color: '#fff', fontSize: 15 }
});
