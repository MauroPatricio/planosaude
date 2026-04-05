import { Platform } from 'react-native';

/**
 * Configure o endereço do seu servidor aqui.
 * - 10.0.2.2:5000 é o padrão para o emulador Android 
 * - localhost:5000 é para o simulador iOS 
 * - Use o seu IP real (ex: 192.168.1.10) para testar em dispositivos físicos
 */
const DEV_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
const PROD_URL = 'https://sua-api.planosaude.co.mz'; // Exemplo futuro

export const API_URL = __DEV__ ? `${DEV_URL}/api` : `${PROD_URL}/api`;

export default {
  API_URL,
};
