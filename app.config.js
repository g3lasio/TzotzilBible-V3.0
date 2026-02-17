// Auto-increment build numbers based on timestamp
// This ensures unique build numbers for every build without manual intervention
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hour = String(now.getHours()).padStart(2, '0');
const minute = String(now.getMinutes()).padStart(2, '0');

// Format: YYYYMMDDHHMM (e.g., 202602170320 for Feb 17, 2026 03:20)
// This creates a unique, always-increasing number
const BUILD_NUMBER = `${year}${month}${day}${hour}${minute}`;

// Android versionCode must be an integer (max 2100000000)
// Using format: YYMMDDHHMM (e.g., 2602170320)
const VERSION_CODE = parseInt(`${String(year).slice(2)}${month}${day}${hour}${minute}`);

console.log(`🔨 Build Configuration:`);
console.log(`   iOS buildNumber: ${BUILD_NUMBER}`);
console.log(`   Android versionCode: ${VERSION_CODE}`);
console.log(`   Generated at: ${now.toISOString()}`);

export default {
  expo: {
    name: "Tzotzil Bible",
    slug: "tzotzil-bible",
    version: "4.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a0e14",
    },
    assetBundlePatterns: ["**/*"],
    platforms: ["ios", "android", "web"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.chyrris.tzotzilbible",
      buildNumber: BUILD_NUMBER,
      infoPlist: {
        CFBundleDisplayName: "Tzotzil Bible",
        UIBackgroundModes: [],
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0e14",
      },
      package: "com.chyrris.tzotzilbible",
      versionCode: VERSION_CODE,
      permissions: ["android.permission.INTERNET"],
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      minSdkVersion: 21,
      blockedPermissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "single",
    },
    extra: {
      eas: {
        projectId: "df16967f-65d9-4e6f-857a-ee208dfad9d8",
      },
    },
    plugins: [
      "expo-font",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#0a0e14",
          image: "./assets/splash-icon.png",
          dark: {
            backgroundColor: "#0a0e14",
            image: "./assets/splash-icon.png",
          },
          imageWidth: 200,
        },
      ],
      [
        "expo-asset",
        {
          assets: ["./assets/bible.db"],
        },
      ],
    ],
    updates: {
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
  },
};
