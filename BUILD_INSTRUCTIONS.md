# Tzotzil Bible - Build Instructions

This document explains how to build the Tzotzil Bible app for Android (APK/AAB) and iOS (IPA).

## Prerequisites

1. **EAS CLI**: Install the Expo Application Services CLI
   ```bash
   npm install -g eas-cli
   ```

2. **Expo Account**: Create an account at https://expo.dev and login
   ```bash
   eas login
   ```

3. **For iOS builds**: Apple Developer account ($99/year)

## Building for Android

### APK (for direct installation/testing)
```bash
eas build --platform android --profile preview
```

This generates a downloadable APK file that can be installed directly on Android devices.

### AAB (for Google Play Store)
```bash
eas build --platform android --profile production
```

This generates an Android App Bundle optimized for Play Store distribution.

## Building for iOS

### Simulator build (for testing)
```bash
eas build --platform ios --profile preview
```

### Production IPA (for App Store)
```bash
eas build --platform ios --profile production
```

**Note**: iOS builds require an Apple Developer account and proper provisioning profiles.

## App Configuration

The app is configured in `app.json`:
- **Package ID**: com.chyrris.tzotzilbible
- **Version**: 2.1.0
- **Android Version Code**: 23

## Nevin AI Configuration

Nevin AI requires an Anthropic API key to function. Users can:
1. Go to Settings in the app
2. Tap "Clave API de Anthropic"
3. Enter their API key from console.anthropic.com

The Bible works completely offline without any API key.

## Troubleshooting

### Build fails with asset errors
Ensure all assets exist in the `assets/` folder:
- icon.png
- splash-icon.png
- adaptive-icon.png
- bible.db

### EAS project not configured
Run:
```bash
eas init
```

### Database not loading
The SQLite database (bible.db) must be in the assets folder and will be automatically copied to the device on first launch.
