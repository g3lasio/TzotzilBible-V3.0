# Overview

Tzotzil Bible is a bilingual Bible mobile application (Spanish/Tzotzil) with an AI assistant called "Nevin" powered by Claude (Anthropic). This is a **pure Expo/React Native mobile application** designed for iOS, Android, and Web platforms. The Bible works completely offline using an embedded SQLite database, while Nevin AI requires internet connectivity.

# System Architecture

## Mobile Application (Expo)
- **Framework**: React Native 0.81.5 with Expo SDK 54
- **React**: React 19.1.0
- **Navigation**: React Navigation v7
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
- Copies database from assets to device on first launch using expo-asset
- Validates database integrity (66 books, 31,000+ verses) before use
- Auto-recovery: if database is corrupted or incomplete, re-copies from assets
- Detailed logging for production debugging: [DatabaseService] prefix
- Provides methods for books, chapters, verses, search, and promises
- Handles platform differences (native SQLite vs web fallback)

## BibleService (`src/services/BibleService.ts`)
- High-level Bible data access layer
- Prioritizes offline SQLite data on native platforms
- Falls back to API/AsyncStorage cache on web

## NevinAIService (`src/services/NevinAIService.ts`)
- Direct integration with Anthropic Claude API via Node.js backend
- Processes user queries with theological context
- Verse commentary generation
- Clickable Bible verse references in responses (navigate to exact verse)
- Automatic EGW (Elena G. de White) quotes integration

## EGWService (`src/services/EGWService.ts`)
- Backend search across 20 Ellen G. White books (5.5MB JSON)
- Keyword-based relevance scoring
- Quotes automatically included in Nevin's context

## ClickableVerseText (`src/components/ClickableVerseText.tsx`)
- Parses Bible references in text (Juan 3:16, Génesis 1:1-3)
- Platform-specific rendering (web uses HTML spans)
- Navigates to exact verse when clicked

## MomentsService (`src/services/MomentsService.ts`)
- Reflective conversation storage system ("Momentos")
- Stores conversations as thematic moments with semantic titles
- AI-generated titles like "Sobre el perdón" or "Una duda sobre Génesis"
- Local-only storage using AsyncStorage (no authentication required)
- Automatic migration from legacy chat history

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
1. Backend Flask server handles Anthropic API integration
2. Conversations stored locally as "Momentos" (reflective moments)
3. Each moment has semantic title, themes, and summary generated by AI
4. No authentication required - all data is private and local

# Changelog

- December 21, 2025. **PRODUCTION HARDENING**: Fixed production-only bugs: (1) Verse card infinite scroll bug fixed by changing from height:100% to flex-based layout for dividers, (2) JSON parse error in Nevin fixed by validating response content-type before parsing, (3) Added Platform.OS detection to always use production backend URL on native. Added DatabaseService retry limits (max 3 attempts), cleanup of journal/WAL/SHM files on recovery. Added fetch timeouts with AbortController to server.js (60s chat, 30s titles, 90s commentary). Added structured logging prefixes for production debugging.
- December 21, 2025. **IMPROVED OFFLINE DATABASE RELIABILITY**: Added expo-asset plugin for explicit database bundling in APK/AAB. Enhanced DatabaseService with database integrity validation, auto-recovery for corrupted databases, detailed logging for production debugging. Reduced Nevin response length (max 1500 tokens) and limited EGW context to 1 short quote.
- December 21, 2025. **CLICKABLE VERSES & EGW INTEGRATION**: Bible verse references in Nevin's responses are now clickable and navigate to the exact verse. Added EGW (Elena G. de White) integration with 91 books - relevant quotes automatically included in Nevin's context.
- December 19, 2025. **MOMENTS FEATURE**: Implemented reflective conversation history called "Momentos". Conversations now stored as thematic moments with AI-generated semantic titles (e.g., "Sobre el perdón", "La fe en tiempos difíciles"). Local-only storage with no authentication required. Includes MomentsScreen for browsing and NevinScreen integration.
- December 17, 2025. **UPGRADED TO SDK 54**: Updated to Expo SDK 54, React 19.1.0, React Native 0.81.5, and React Navigation v7
- December 17, 2025. **COMPLETE CONVERSION TO EXPO**: Removed all Flask backend code, converted to pure Expo mobile app, implemented direct Anthropic API integration for Nevin AI, configured EAS for APK/IPA builds
- September 18, 2025. Revolutionary Nevin AI v2.0 with Claude 4 integration
- June 22, 2025. Initial setup with Flask backend

# User Preferences

Preferred communication style: Simple, everyday language.
