import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, Platform } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { theme, glassStyle } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface MainLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  title?: string;
  hideBottomNav?: boolean;
}

const menuItems = [
  { name: 'Home', icon: 'home', label: 'Inicio', route: 'Home' as const },
  { name: 'Bible', icon: 'book-open-page-variant', label: 'Explorar la Biblia', route: 'Bible' as const },
  { name: 'Search', icon: 'magnify', label: 'Buscar', route: 'Search' as const },
  { name: 'Nevin', icon: 'robot', label: 'Nevin AI', route: 'Nevin' as const },
  { name: 'Settings', icon: 'cog', label: 'Ajustes', route: 'Settings' as const },
];

const bottomTabs = [
  { icon: 'magnify', label: 'BUSCAR', route: 'Search' as const },
  { icon: 'book-open-page-variant', label: 'LEER', route: 'Bible' as const },
  { icon: 'robot', label: 'NEVIN', route: 'Nevin' as const },
  { icon: 'cog', label: 'AJUSTES', route: 'Settings' as const },
];

export default function MainLayout({ children, showBackButton = false, title, hideBottomNav = false }: MainLayoutProps) {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const [menuVisible, setMenuVisible] = useState(false);

  const currentRoute = route.name;

  const handleNavigate = (routeName: keyof RootStackParamList) => {
    setMenuVisible(false);
    navigation.navigate(routeName as any);
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

        {!hideBottomNav && (
          <View style={styles.bottomNavContainer}>
            <View style={styles.bottomNavLine} />
            <SafeAreaView edges={['bottom']} style={styles.bottomNavSafeArea}>
              <View style={styles.bottomNav}>
                {bottomTabs.map((tab) => {
                  const isActive = currentRoute === tab.route || 
                    (tab.route === 'Bible' && (currentRoute === 'Chapter' || currentRoute === 'Verses'));
                  return (
                    <TouchableOpacity
                      key={tab.route}
                      style={styles.bottomTab}
                      onPress={() => handleNavigate(tab.route)}
                    >
                      <MaterialCommunityIcons
                        name={tab.icon as any}
                        size={24}
                        color={isActive ? '#00f3ff' : '#6b7c93'}
                      />
                      <Text style={[
                        styles.bottomTabLabel,
                        isActive && styles.bottomTabLabelActive
                      ]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SafeAreaView>
          </View>
        )}

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
                  const isActive = currentRoute === item.route;
                  return (
                    <TouchableOpacity
                      key={item.name}
                      style={[styles.menuItem, isActive && styles.menuItemActive]}
                      onPress={() => handleNavigate(item.route)}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={isActive ? '#00ff88' : '#00f3ff'}
                      />
                      <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
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
  },
  content: {
    flex: 1,
  },
  bottomNavContainer: {
    backgroundColor: 'rgba(10, 14, 20, 0.95)',
  },
  bottomNavLine: {
    height: 1,
    backgroundColor: '#00f3ff',
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  bottomNavSafeArea: {
    backgroundColor: 'rgba(10, 14, 20, 0.95)',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bottomTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 70,
  },
  bottomTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7c93',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  bottomTabLabelActive: {
    color: '#00f3ff',
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
