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
  SearchTab: undefined;
  BibleTab: NavigatorScreenParams<BibleStackParamList>;
  NevinTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
