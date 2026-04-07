import { Platform } from 'react-native';

/**
 * Configure o endereço do seu servidor aqui.
 * - 10.0.2.2:5000 é o padrão para o emulador Android 
 * - localhost:5000 é para o simulador iOS 
 * - Use o seu IP real (ex: 192.168.1.10) para testar em dispositivos físicos
 */
const DEV_URL = Platform.OS === 'android' ? 'http://192.168.0.6:5000' : 'http://localhost:5000';
const PROD_URL = 'https://planosaude.nhiquelaservicos.com'; // Exemplo futuro

export const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;
export const API_URL = `${BASE_URL}/api`;
export const UPLOADS_URL = `${BASE_URL}/uploads`;

export default {
  BASE_URL,
  API_URL,
  UPLOADS_URL
};
