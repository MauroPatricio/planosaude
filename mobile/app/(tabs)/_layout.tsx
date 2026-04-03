import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Users, Briefcase, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1F2937', // Gray-800
          borderTopColor: '#374151', // Gray-700
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: '#3B82F6', // Blue-500
        tabBarInactiveTintColor: '#9CA3AF', // Gray-400
        tabBarLabelStyle: {
          fontSize: 11,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Vendas',
          tabBarIcon: ({ color }) => <Briefcase size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
