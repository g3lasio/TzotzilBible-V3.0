export default {
  expo: {
    name: "Tzotzil Bible",
    slug: "tzotzil-bible",
    version: "2.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0a0e14"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.chyrris.tzotzilbible",
      buildNumber: "23",
      infoPlist: {
        CFBundleDisplayName: "Tzotzil Bible",
        UIBackgroundModes: []
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0e14"
      },
      package: "com.chyrris.tzotzilbible",
      versionCode: 23,
      permissions: [
        "android.permission.INTERNET"
      ],
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      minSdkVersion: 21,
      blockedPermissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    extra: {
      eas: {
        projectId: ""
      }
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
            image: "./assets/splash-icon.png"
          },
          imageWidth: 200
        }
      ]
    ],
    updates: {
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};
