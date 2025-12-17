import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Share, Dimensions, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import type { RootStackParamList } from '../types/navigation';
import MainLayout from '../components/MainLayout';
import { theme, glassStyle } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [dailyPromise, setDailyPromise] = useState('');
  const [promiseReference, setPromiseReference] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyPromise();
  }, []);

  const loadDailyPromise = async () => {
    try {
      const promise = await BibleService.getRandomPromise();
      const parts = promise.split(' - ');
      if (parts.length > 1) {
        setDailyPromise(parts[0]);
        setPromiseReference(parts[1]);
      } else {
        setDailyPromise(promise);
        setPromiseReference('Salmo 23:1');
      }
    } catch (error) {
      console.error('Error loading daily promise:', error);
      setDailyPromise('El Señor es mi pastor; nada me faltará.');
      setPromiseReference('Salmo 23:1');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${dailyPromise}\n\n${promiseReference}\n\n- Tzotzil Bible`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <MainLayout>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.promiseCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.promiseGradient}
          >
            <View style={styles.promiseHeader}>
              <MaterialCommunityIcons name="star-four-points" size={20} color="#00ff88" />
              <Text style={styles.promiseTitle}>Promesa del día</Text>
            </View>
            
            <View style={styles.referenceBadge}>
              <Text style={styles.referenceText}>{promiseReference}</Text>
            </View>
            
            {loading ? (
              <ActivityIndicator size="small" color="#00f3ff" style={styles.loader} />
            ) : (
              <Text style={styles.promiseText}>{dailyPromise}</Text>
            )}
            
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={18} color="#0a0e14" />
              <Text style={styles.shareButtonText}>Compartir</Text>
            </TouchableOpacity>
            
            <Text style={styles.byLine}>by Tzotzil Bible</Text>
          </LinearGradient>
          <View style={styles.cardGlow} />
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => navigation.navigate('Bible')}
            >
              <View style={styles.actionCardInner}>
                <MaterialCommunityIcons name="book-open-page-variant" size={32} color="#00f3ff" />
                <Text style={styles.actionTitle}>Leer</Text>
                <Text style={styles.actionSubtitle}>Explorar la Biblia</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => navigation.navigate('Search')}
            >
              <View style={styles.actionCardInner}>
                <MaterialCommunityIcons name="magnify" size={32} color="#00f3ff" />
                <Text style={styles.actionTitle}>Buscar</Text>
                <Text style={styles.actionSubtitle}>Encontrar versículos</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => navigation.navigate('Nevin')}
            >
              <View style={styles.actionCardInner}>
                <MaterialCommunityIcons name="robot" size={32} color="#00ff88" />
                <Text style={styles.actionTitle}>Nevin</Text>
                <Text style={styles.actionSubtitle}>Asistente bíblico</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard} 
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={styles.actionCardInner}>
                <MaterialCommunityIcons name="cog" size={32} color="#00f3ff" />
                <Text style={styles.actionTitle}>Ajustes</Text>
                <Text style={styles.actionSubtitle}>Personalizar</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.7)', 'rgba(15, 25, 40, 0.8)']}
            style={styles.statsGradient}
          >
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>66</Text>
                <Text style={styles.statLabel}>Libros</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Versiones</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>∞</Text>
                <Text style={styles.statLabel}>Offline</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  promiseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.4)',
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    pointerEvents: 'none',
  },
  promiseGradient: {
    padding: 24,
    alignItems: 'center',
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  promiseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff88',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  referenceBadge: {
    backgroundColor: 'rgba(0, 243, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.4)',
    marginBottom: 20,
  },
  referenceText: {
    color: '#00f3ff',
    fontWeight: '600',
    fontSize: 14,
  },
  promiseText: {
    fontSize: 20,
    lineHeight: 32,
    color: '#e6f3ff',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  loader: {
    marginVertical: 40,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#0a0e14',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  byLine: {
    color: '#6b7c93',
    fontSize: 12,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7c93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
    backgroundColor: 'rgba(20, 30, 45, 0.6)',
  },
  actionCardInner: {
    padding: 20,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e6f3ff',
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7c93',
    marginTop: 4,
  },
  statsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  statsGradient: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00f3ff',
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7c93',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0, 243, 255, 0.2)',
  },
});
