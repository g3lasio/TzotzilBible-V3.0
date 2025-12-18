import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface MainLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
}

type MenuItem = {
  name: string;
  icon: string;
  label: string;
  route: keyof TabParamList;
  isTab: boolean;
};

const menuItems: MenuItem[] = [
  { name: 'Home', icon: 'home', label: 'Inicio', route: 'HomeTab', isTab: true },
  { name: 'Bible', icon: 'book-open-page-variant', label: 'Explorar la Biblia', route: 'BibleTab', isTab: true },
  { name: 'Search', icon: 'magnify', label: 'Buscar', route: 'SearchTab', isTab: true },
  { name: 'Nevin', icon: 'creation', label: 'Nevin AI', route: 'NevinTab', isTab: true },
  { name: 'Settings', icon: 'cog', label: 'Ajustes', route: 'SettingsTab', isTab: true },
];

export default function MainLayout({ children, showBackButton = false, title }: MainLayoutProps) {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const [menuVisible, setMenuVisible] = useState(false);

  const currentRoute = route.name;

  const handleNavigate = (item: MenuItem) => {
    setMenuVisible(false);
    navigation.navigate('MainTabs', { screen: item.route } as any);
  };

  const isActive = (item: MenuItem) => {
    const tabRouteMap: Record<string, string[]> = {
      'HomeTab': ['HomeTab', 'Home'],
      'BibleTab': ['BibleList', 'Bible', 'Chapter', 'Verses', 'BibleTab'],
      'SearchTab': ['Search', 'SearchTab'],
      'NevinTab': ['Nevin', 'NevinTab'],
      'SettingsTab': ['Settings', 'SettingsTab'],
    };
    return tabRouteMap[item.route]?.includes(currentRoute) || false;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0e14', '#1a2332']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {showBackButton ? (
                <IconButton
                  icon="arrow-left"
                  iconColor="#00f3ff"
                  size={24}
                  onPress={() => navigation.goBack()}
                />
              ) : (
                <View style={styles.logoContainer}>
                  <MaterialCommunityIcons name="book-cross" size={28} color="#00ff88" />
                </View>
              )}
              <Text style={styles.headerTitle}>{title || 'Tzotzil Bible'}</Text>
            </View>
            <IconButton
              icon="menu"
              iconColor="#00f3ff"
              size={28}
              onPress={() => setMenuVisible(true)}
            />
          </View>

          <View style={styles.content}>
            {children}
          </View>
        </SafeAreaView>

        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <LinearGradient
                colors={['rgba(10, 14, 20, 0.98)', 'rgba(26, 35, 50, 0.98)']}
                style={styles.menuGradient}
              >
                <View style={styles.menuHeader}>
                  <MaterialCommunityIcons name="book-cross" size={40} color="#00ff88" />
                  <Text style={styles.menuTitle}>Tzotzil Bible</Text>
                </View>
                <View style={styles.menuDivider} />
                {menuItems.map((item) => {
                  const active = isActive(item);
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.menuItem, active && styles.menuItemActive]}
                      onPress={() => handleNavigate(item)}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={active ? '#00ff88' : '#00f3ff'}
                      />
                      <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={styles.menuFooter}>
                  <Text style={styles.menuFooterText}>by Tzotzil Bible</Text>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  logoContainer: {
    marginLeft: 12,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e6f3ff',
    marginLeft: 4,
    flexShrink: 1,
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  menuGradient: {
    padding: 24,
  },
  menuHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginTop: 12,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 243, 255, 0.3)',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  menuItemText: {
    fontSize: 18,
    color: '#e6f3ff',
    marginLeft: 16,
  },
  menuItemTextActive: {
    color: '#00ff88',
    fontWeight: 'bold',
  },
  menuFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  menuFooterText: {
    fontSize: 12,
    color: '#6b7c93',
  },
});
