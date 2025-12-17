export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Bible: undefined;
  Chapter: { book: string };
  Verses: { book: string; chapter: number; initialVerse?: number };
  Search: undefined;
  Nevin: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
