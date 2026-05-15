import { Platform } from 'react-native';

export const APP_VERSION = '7.1.0';
export const APP_NAME = 'Tzotzil Bible';

export const FONTS = {
  regular: 'Quantico_400Regular',
  bold: 'Quantico_700Bold',
};

// ============================================================
// REMOTE CONFIG
// The base URL is hardcoded as fallback only.
// On app start, fetchRemoteConfig() reads /api/config from the
// server and updates BACKEND_URL dynamically — so future URL
// changes only require a server-side update, no rebuild needed.
// ============================================================

// Fallback URL — used if remote config fetch fails
const FALLBACK_BACKEND_URL = 'https://bible.chyrris.com';

let _backendUrl: string = FALLBACK_BACKEND_URL;
let _remoteConfigLoaded = false;

export interface RemoteConfig {
  backend_url: string;
  nevin_model: string;
  app_min_version: string;
  features: {
    nevin_enabled: boolean;
    egw_enabled: boolean;
    versions_bundled: boolean;
  };
  updated_at: string;
}

let _remoteConfig: RemoteConfig | null = null;

/**
 * Called once at app startup (in App.tsx).
 * Fetches /api/config and updates the backend URL in memory.
 * Falls back to FALLBACK_BACKEND_URL if the request fails.
 */
export const fetchRemoteConfig = async (): Promise<void> => {
  if (_remoteConfigLoaded) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const response = await fetch(`${FALLBACK_BACKEND_URL}/api/config`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok) {
      const config: RemoteConfig = await response.json();
      if (config.backend_url) {
        _backendUrl = config.backend_url;
      }
      _remoteConfig = config;
      console.log('[Config] Remote config loaded:', config.backend_url);
    }
  } catch (error) {
    console.log('[Config] Remote config fetch failed, using fallback:', FALLBACK_BACKEND_URL);
  } finally {
    _remoteConfigLoaded = true;
  }
};

export const getBackendUrl = (): string => {
  return _backendUrl;
};

export const getRemoteConfig = (): RemoteConfig | null => _remoteConfig;

// Keep BACKEND_URL as a static export for compatibility
export const BACKEND_URL = FALLBACK_BACKEND_URL;
