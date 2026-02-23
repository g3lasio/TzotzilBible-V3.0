import { Platform } from 'react-native';

export const APP_VERSION = '7.0.0';
export const APP_NAME = 'Tzotzil Bible';

export const FONTS = {
  regular: 'Quantico_400Regular',
  bold: 'Quantico_700Bold',
};

// Unified backend - all services (Nevin AI, versions, EGW) run from same server
export const BACKEND_URL = 'https://tzotzil.replit.app';

export const getBackendUrl = (): string => {
  console.log('[Config] Using backend:', BACKEND_URL);
  return BACKEND_URL;
};
