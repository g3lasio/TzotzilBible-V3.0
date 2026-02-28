// BUILD NUMBER — Fixed for this release (7.1.0 / build 2602281000)
// Format: YYMMDDHHMM — always unique and always increasing.
//
// IMPORTANT: Increment BUILD_NUMBER and VERSION_CODE before each new build
// to avoid rejection by Apple App Store or Google Play.
//
// Current values set for: 2026-02-28 10:00 UTC
// iOS buildNumber: "2602281000"
// Android versionCode: 26022810 (YYMMDDHH format — max allowed by Google Play is 2,100,000,000)

const BUILD_NUMBER = "2602281000";
const VERSION_CODE = 26022810;

export default {
  expo: {
    name: "Tzotzil Bible",
    slug: "tzotzil-bible",
    version: "7.1.0",
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
      requireFullScreen: false,
      bundleIdentifier: "com.chyrris.tzotzilbible",
      buildNumber: BUILD_NUMBER,
      infoPlist: {
        CFBundleDisplayName: "Tzotzil Bible",
        UIBackgroundModes: [],
        UIDeviceFamily: [1, 2], // 1 = iPhone, 2 = iPad
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
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#00f3ff",
          defaultChannel: "reading-plan",
        },
      ],
      [
        "expo-secure-store",
        {
          configureAndroidBackup: true,
          faceIDPermission: "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
        },
      ],
      // expo-clipboard does NOT have an app.plugin.js — no plugin entry needed.
    ],
    updates: {
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
  },
};
