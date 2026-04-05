import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Falha ao obter permissão para notificações!');
      return;
    }
    
    // Get the token
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Mobile Push Token:', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export const registerTokenWithBackend = async (token: string, userToken: string) => {
  try {
    await axios.post('http://10.0.2.2:5000/api/users/push-token', 
      { token }, 
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
  } catch (err) {
    console.error('Error registering token with backend:', err);
  }
};
