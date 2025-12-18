export const APP_VERSION = '2.1.0';
export const APP_NAME = 'Tzotzil Bible';

export const FONTS = {
  regular: 'Quantico_400Regular',
  bold: 'Quantico_700Bold',
};

export const getBackendUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8000`;
  }
  return 'http://localhost:8000';
};
