import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tzotzilbible.app',
  appName: 'Tzotzil Bible',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'large',
      spinnerColor: '#00f3ff'
    },
    StatusBar: {
      backgroundColor: '#0f3460',
      style: 'DARK'
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#1a1a2e'
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a2e',
    scrollEnabled: true
  }
};

export default config;
