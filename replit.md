# Overview

Tzotzil Bible is a bilingual Bible mobile application (Spanish/Tzotzil) with an AI assistant called "Nevin" powered by Claude (Anthropic). This is a **pure Expo/React Native mobile application** designed for iOS, Android, and Web platforms. The Bible works completely offline using an embedded SQLite database, while Nevin AI requires internet connectivity.

# System Architecture

## Mobile Application (Expo)
- **Framework**: React Native with Expo SDK 52
- **Navigation**: React Navigation v6
- **UI Library**: React Native Paper for Material Design components
- **State Management**: React Query for server state and async operations
- **Local Storage**: Expo SQLite for offline Bible data (31,105 verses)
- **Platform Support**: iOS, Android, and Web via Expo

## Offline Bible Database
- **Format**: SQLite database embedded in app assets (21.70 MB)
- **Content**: 66 books, 31,105 bilingual verses, 198 promises
- **Tables**: books, verses, promises
- **Languages**: Spanish and Tzotzil side-by-side

## Nevin AI Assistant
- **Provider**: Anthropic Claude Sonnet 4
- **API**: Direct HTTPS calls to Anthropic API from mobile app
- **Features**: Biblical interpretation, theological guidance, Adventist doctrinal principles
- **Storage**: API key stored securely in device storage

# Key Components

## DatabaseService (`src/services/DatabaseService.ts`)
- Manages SQLite database initialization and queries
- Copies database from assets to device on first launch
- Provides methods for books, chapters, verses, search, and promises
- Handles platform differences (native SQLite vs web fallback)

## BibleService (`src/services/BibleService.ts`)
- High-level Bible data access layer
- Prioritizes offline SQLite data on native platforms
- Falls back to API/AsyncStorage cache on web

## NevinAIService (`src/services/NevinAIService.ts`)
- Direct integration with Anthropic Claude API
- Chat history management with AsyncStorage
- User-configurable API key via Settings screen

# File Structure

```
/
├── App.tsx                    # Main app entry point
├── index.ts                   # Expo entry point
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build configuration
├── assets/
│   ├── bible.db               # SQLite database (31,105 verses)
│   ├── icon.png               # App icon
│   ├── splash-icon.png        # Splash screen
│   └── adaptive-icon.png      # Android adaptive icon
├── src/
│   ├── screens/               # App screens
│   ├── components/            # Reusable components
│   ├── services/              # API and database services
│   ├── navigation/            # React Navigation setup
│   ├── types/                 # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks
│   └── config.ts              # App configuration
└── android/                   # Android native files (optional)
```

# Build & Deployment

## Development
```bash
npx expo start --web --port 5000
```

## Build APK (Android)
```bash
eas build --platform android --profile preview
```

## Build AAB for Play Store
```bash
eas build --platform android --profile production
```

## Build IPA (iOS)
```bash
eas build --platform ios --profile production
```

## EAS Configuration
- **Preview**: Generates APK for internal testing
- **Production**: Generates AAB/IPA for app store submission
- **Bundle ID**: com.chyrris.tzotzilbible

# Offline Functionality

The Bible works completely offline:
1. On first launch, the SQLite database is copied from app assets to device storage
2. All Bible reading, searching, and navigation works without internet
3. Database includes all 66 books in both Spanish and Tzotzil

Nevin AI requires internet:
1. User must configure their Anthropic API key in Settings
2. API calls are made directly to Anthropic servers
3. Chat history is stored locally on device

# Changelog

- December 17, 2025. **COMPLETE CONVERSION TO EXPO**: Removed all Flask backend code, converted to pure Expo mobile app, implemented direct Anthropic API integration for Nevin AI, configured EAS for APK/IPA builds
- September 18, 2025. Revolutionary Nevin AI v2.0 with Claude 4 integration
- June 22, 2025. Initial setup with Flask backend

# User Preferences

Preferred communication style: Simple, everyday language.
