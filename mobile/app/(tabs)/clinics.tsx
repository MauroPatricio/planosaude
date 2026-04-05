import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Image,
  Dimensions
} from 'react-native';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Phone, 
  Star, 
  Filter,
  Activity,
  ChevronRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CLINICS = [
  {
    id: '1',
    name: 'Hospital Privado de Maputo',
    type: 'Hospital Geral',
    distance: '2.4 km',
    rating: 4.8,
    address: 'Rua do Rio Inhami, Maputo',
    image: 'https://images.unsplash.com/photo-1586773860418-d3b97998c637?auto=format&fit=crop&q=80&w=400',
    tags: ['Emergência 24h', 'Cirurgia']
  },
  {
    id: '2',
    name: 'Clínica Sommerschield',
    type: 'Clínica de Especialidades',
    distance: '1.1 km',
    rating: 4.9,
    address: 'Av. Julius Nyerere, Maputo',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400',
    tags: ['Pediatria', 'Exames']
  },
  {
    id: '3',
    name: 'MediCity Maputo',
    type: 'Centro de Diagnóstico',
    distance: '3.8 km',
    rating: 4.7,
    address: 'Av. Mao Tsé Tung, Maputo',
    image: 'https://images.unsplash.com/photo-1538108197017-c1b89c0ef319?auto=format&fit=crop&q=80&w=400',
    tags: ['Laboratório', 'Raios-X']
  }
];

export default function ClinicsScreen() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
         <Text style={styles.title}>Rede Médica</Text>
         <Text style={styles.subtitle}>Encontre unidades de saúde próximas de si</Text>
         
         <View style={styles.searchContainer}>
            <Search size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput 
               style={styles.searchInput}
               placeholder="Pesquisar clínicas ou especialidades..."
               placeholderTextColor="#475569"
               value={searchTerm}
               onChangeText={setSearchTerm}
            />
            <TouchableOpacity style={styles.filterBtn}>
               <Filter size={18} color="#60A5FA" />
            </TouchableOpacity>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
         {/* Map Placeholder */}
         <View style={styles.mapPlaceholder}>
            <Image 
               source={{ uri: 'https://miro.medium.com/v2/resize:fit:1400/1*qV9-BDlcS60Vt_SInS_6lg.png' }} 
               style={styles.mapImg}
               resizeMode="cover"
            />
            <LinearGradient
               colors={['transparent', '#0f172a']}
               style={styles.mapOverlay}
            />
            <View style={styles.myLocationBtn}>
               <Navigation size={20} color="#FFFFFF" />
            </View>
         </View>

         {/* Clinics List */}
         <Text style={styles.sectionTitle}>Unidades de Saúde</Text>
         
         {CLINICS.map(clinic => (
            <TouchableOpacity key={clinic.id} style={styles.clinicCard} activeOpacity={0.95}>
               <Image source={{ uri: clinic.image }} style={styles.clinicImg} />
               <View style={styles.clinicInfo}>
                  <View style={styles.clinicHeader}>
                     <View style={{ flex: 1 }}>
                        <Text style={styles.clinicName}>{clinic.name}</Text>
                        <Text style={styles.clinicType}>{clinic.type}</Text>
                     </View>
                     <View style={styles.ratingBadge}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{clinic.rating}</Text>
                     </View>
                  </View>

                  <View style={styles.addressRow}>
                     <MapPin size={14} color="#64748b" />
                     <Text style={styles.addressText} numberOfLines={1}>{clinic.address}</Text>
                  </View>

                  <View style={styles.tagsRow}>
                     {clinic.tags.map(tag => (
                        <View key={tag} style={styles.tag}>
                           <Activity size={10} color="#60A5FA" />
                           <Text style={styles.tagText}>{tag}</Text>
                        </View>
                     ))}
                     <Text style={styles.distanceText}>{clinic.distance}</Text>
                  </View>

                  <View style={styles.cardActions}>
                     <TouchableOpacity style={styles.callBtn}>
                        <Phone size={16} color="#FFFFFF" />
                        <Text style={styles.callBtnText}>Ligar</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.directionsBtn}>
                        <Navigation size={16} color="#60A5FA" />
                        <Text style={styles.directionsBtnText}>Direções</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </TouchableOpacity>
         ))}
         
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
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#0f172a',
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
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  filterBtn: {
    padding: 10,
  },
  scrollContent: {
    paddingTop: 0,
  },
  mapPlaceholder: {
    height: 240,
    width: '100%',
    marginBottom: 24,
    overflow: 'hidden',
  },
  mapImg: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
  },
  clinicCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 24,
    marginHorizontal: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  clinicImg: {
    width: '100%',
    height: 140,
  },
  clinicInfo: {
    padding: 20,
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  clinicName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  clinicType: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  addressText: {
    color: '#64748b',
    fontSize: 12,
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(96, 165, 250, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.1)',
  },
  tagText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
  },
  distanceText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  directionsBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  directionsBtnText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '800',
  }
});
