// FIXED BUILD NUMBERS - Increment manually for each release
// iOS buildNumber must be a string
const now = new Date();
const year = now.getFullYear().toString().slice(-2);
const month = (now.getMonth() + 1).toString().padStart(2, '0');
const day = now.getDate().toString().padStart(2, '0');
const hours = now.getHours().toString().padStart(2, '0');
const minutes = now.getMinutes().toString().padStart(2, '0');

const BUILD_NUMBER = `${year}${month}${day}${hours}${minutes}`;
const VERSION_CODE = parseInt(BUILD_NUMBER);

export default {
  expo: {
    name: "Tzotzil Bible",
    slug: "tzotzil-bible",
    version: "7.0.0",
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
          faceIDPermission: "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
        },
      ],
      // expo-clipboard does NOT have an app.plugin.js — no plugin entry needed,
      // it works via autolinking on native and the AsyncClipboard API on web.
    ],
    updates: {
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
  },
};
