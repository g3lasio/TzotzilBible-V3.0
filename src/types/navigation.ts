import { NavigatorScreenParams } from '@react-navigation/native';

export type BibleStackParamList = {
  BibleList: undefined;
  Chapter: { book: string };
  Verses: { book: string; chapter: number; initialVerse?: number };
  VerseCommentary: { 
    book: string; 
    chapter: number; 
    verse: number; 
    textTzotzil?: string; 
    textSpanish?: string; 
  };
};

export type TabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  BibleTab: NavigatorScreenParams<BibleStackParamList>;
  NevinTab: { 
    initialQuestion?: string;
    verseContext?: {
      book: string;
      chapter: number;
      verse: number;
      textTzotzil?: string;
      textSpanish?: string;
    };
    momentId?: string;
  } | undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Moments: undefined;
  About: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  LegalDisclaimer: undefined;
  ContactSupport: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
