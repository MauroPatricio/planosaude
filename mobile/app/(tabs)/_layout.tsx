import React from 'react';
import { Tabs } from 'expo-router';
import { 
  LayoutDashboard, Users, Briefcase, User, 
  Home, HeartPulse, CreditCard, MapPin 
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function TabLayout() {
  const user = useAuthStore((state: any) => state.user);
  const isBroker = user?.role === 'broker' || user?.role === 'admin' || user?.role === 'superAdmin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a', // Slate-900
          borderTopColor: '#1e293b', // Slate-800
          paddingTop: 12,
          height: 85,
          paddingBottom: 25,
        },
        tabBarActiveTintColor: '#60A5FA', // Blue-400
        tabBarInactiveTintColor: '#475569', // Slate-500
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      {/* SHARED / BROKER TAB */}
      <Tabs.Screen
        name="dashboard"
        options={{
          href: isBroker ? '/dashboard' : null, // Hide if not broker
          title: 'Dashboard',
          tabBarIcon: ({ color }: any) => <LayoutDashboard size={22} color={color} />,
        }}
      />

      {/* CLIENT SPECIFIC TABS */}
      <Tabs.Screen
        name="home"
        options={{
          href: !isBroker ? '/home' : null,
          title: 'Início',
          tabBarIcon: ({ color }: any) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          href: !isBroker ? '/health' : null,
          title: 'Saúde',
          tabBarIcon: ({ color }: any) => <HeartPulse size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          href: !isBroker ? '/payments' : null,
          title: 'Faturas',
          tabBarIcon: ({ color }: any) => <CreditCard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clinics"
        options={{
          href: !isBroker ? '/clinics' : null,
          title: 'Unidades',
          tabBarIcon: ({ color }: any) => <MapPin size={22} color={color} />,
        }}
      />

      {/* BROKER SPECIFIC TABS */}
      <Tabs.Screen
        name="clients"
        options={{
          href: isBroker ? '/clients' : null,
          title: 'Clientes',
          tabBarIcon: ({ color }: any) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          href: isBroker ? '/sales' : null,
          title: 'Vendas',
          tabBarIcon: ({ color }: any) => <Briefcase size={22} color={color} />,
        }}
      />

      {/* SHARED PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }: any) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
