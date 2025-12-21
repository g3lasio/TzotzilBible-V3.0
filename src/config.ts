import { Platform } from 'react-native';

export const APP_VERSION = '2.1.0';
export const APP_NAME = 'Tzotzil Bible';

export const FONTS = {
  regular: 'Quantico_400Regular',
  bold: 'Quantico_700Bold',
};

export const BACKEND_URL = 'https://bible.chyrris.com';

export const getBackendUrl = (): string => {
  // On native platforms (iOS/Android), always use the production backend URL
  if (Platform.OS !== 'web') {
    console.log('[Config] Native platform detected, using:', BACKEND_URL);
    return BACKEND_URL;
  }
  
  // On web, use the current window location (for development)
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // If we're on localhost with a port, use that for development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      if (port) {
        return `${protocol}//${hostname}:${port}`;
      }
    }
    
    // Otherwise use the current origin
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  }
  
  return BACKEND_URL;
};
