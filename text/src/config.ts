import { Platform } from 'react-native';

export const APP_VERSION = '2.1.0';
export const APP_NAME = 'Tzotzil Bible';

export const FONTS = {
  regular: 'Quantico_400Regular',
  bold: 'Quantico_700Bold',
};

export const BACKEND_URL = 'https://nevin-b.replit.app';

export const getBackendUrl = (): string => {
  console.log('[Config] Using Nevin backend:', BACKEND_URL);
  return BACKEND_URL;
};
