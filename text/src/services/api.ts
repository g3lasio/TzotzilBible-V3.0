import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { BACKEND_URL } from '../config';

// Configuración base de la API según la plataforma
// En producción web, usar el backend URL configurado
// En desarrollo local, usar localhost
const isProduction = typeof window !== 'undefined' && window.location?.hostname !== 'localhost';
const BASE_URL = Platform.select({
  web: isProduction ? BACKEND_URL : '',  // Empty string = relative URLs for same-origin
  default: BACKEND_URL,  // Mobile apps use production backend
});

// Crear instancia de axios con configuración base
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      await SecureStore.deleteItemAsync('user_token');
      await SecureStore.deleteItemAsync('user_data');
      // Aquí podrías disparar un evento para redireccionar al login
      if (typeof window !== 'undefined') { //Check if it is a browser environment
          window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);