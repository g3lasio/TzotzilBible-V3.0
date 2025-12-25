import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import BibleScreen from '../screens/BibleScreen';
import ChapterScreen from '../screens/ChapterScreen';
import VersesScreen from '../screens/VersesScreen';
import VerseCommentaryScreen from '../screens/VerseCommentaryScreen';
import SearchScreen from '../screens/SearchScreen';
import NevinScreen from '../screens/NevinScreen';
import MomentsScreen from '../screens/MomentsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import LegalDisclaimerScreen from '../screens/LegalDisclaimerScreen';
import ContactSupportScreen from '../screens/ContactSupportScreen';
import type { RootStackParamList, TabParamList, BibleStackParamList } from '../types/navigation';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const BibleStack = createNativeStackNavigator<BibleStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function BibleStackNavigator() {
  return (
    <BibleStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0a0e14' },
      }}
    >
      <BibleStack.Screen name="BibleList" component={BibleScreen} />
      <BibleStack.Screen name="Chapter" component={ChapterScreen} />
      <BibleStack.Screen name="Verses" component={VersesScreen} />
      <BibleStack.Screen name="VerseCommentary" component={VerseCommentaryScreen} />
    </BibleStack.Navigator>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const minAndroidPadding = 8;
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom + minAndroidPadding, minAndroidPadding)
    : Math.max(insets.bottom, 20);

  return (
    <SafeAreaView 
      edges={['bottom']} 
      style={[styles.tabBarContainer, { paddingBottom: Platform.OS === 'android' ? bottomPadding : 0 }]}
    >
      <View style={styles.tabBarLine} />
      <View style={[styles.tabBar, Platform.OS !== 'android' && { paddingBottom: bottomPadding }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const iconName = 
            route.name === 'HomeTab' ? 'home' :
            route.name === 'SearchTab' ? 'magnify' :
            route.name === 'BibleTab' ? 'book-open-page-variant' :
            route.name === 'NevinTab' ? 'creation' :
            route.name === 'SettingsTab' ? 'cog' : 'circle';

          const isNevin = route.name === 'NevinTab';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              <MaterialCommunityIcons
                name={iconName as any}
                size={24}
                color={isFocused ? (isNevin ? '#00ff88' : '#00f3ff') : '#6b7c93'}
                onPress={onPress}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isFocused && (isNevin ? styles.tabLabelActiveNevin : styles.tabLabelActive)
                ]}
                onPress={onPress}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="HomeTab"
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{ tabBarLabel: 'INICIO' }}
      />
      <Tab.Screen 
        name="BibleTab" 
        component={BibleStackNavigator}
        options={{ tabBarLabel: 'LEER' }}
      />
      <Tab.Screen 
        name="NevinTab" 
        component={NevinScreen}
        options={{ tabBarLabel: 'NEVIN' }}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen}
        options={{ tabBarLabel: 'BUSCAR' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'AJUSTES' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0a0e14' },
      }}
    >
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      <RootStack.Screen name="Moments" component={MomentsScreen} />
      <RootStack.Screen name="About" component={AboutScreen} />
      <RootStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <RootStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <RootStack.Screen name="LegalDisclaimer" component={LegalDisclaimerScreen} />
      <RootStack.Screen name="ContactSupport" component={ContactSupportScreen} />
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: 'rgba(10, 14, 20, 0.98)',
  },
  tabBarLine: {
    height: 1,
    backgroundColor: '#00f3ff',
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7c93',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#00f3ff',
  },
  tabLabelActiveNevin: {
    color: '#00ff88',
  },
});
