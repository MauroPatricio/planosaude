import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isPendingAuth = segments[0] === 'pending-auth';

    if (user?.status !== 'active' && !isPendingAuth && inAuthGroup) {
      // Redirect unauthorized users to pending screen if they try to access tabs
      router.replace('/pending-auth');
    } else if (user?.status === 'active' && isPendingAuth) {
      // Redirect authorized users to home if they are on pending screen
      const destination = user.role === 'client' ? '/(tabs)/home' : '/(tabs)/dashboard';
      router.replace(destination as any);
    }
  }, [isAuthenticated, user?.status, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#111827' }, // Gray-900 parity
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="pending-auth" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
    </>
  );
}
