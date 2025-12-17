import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import BibleScreen from '../screens/BibleScreen';
import ChapterScreen from '../screens/ChapterScreen';
import VersesScreen from '../screens/VersesScreen';
import SearchScreen from '../screens/SearchScreen';
import NevinScreen from '../screens/NevinScreen';
import SettingsScreen from '../screens/SettingsScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      contentStyle: { backgroundColor: '#0a0e14' },
    }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Bible" component={BibleScreen} />
      <Stack.Screen name="Chapter" component={ChapterScreen} />
      <Stack.Screen name="Verses" component={VersesScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Nevin" component={NevinScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
