import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Share, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BibleService } from '../services/BibleService';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';
import type { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

type QuickAction = {
  icon: string;
  label: string;
  color: string;
  onPress: (nav: NativeStackNavigationProp<RootStackParamList>) => void;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: 'creation',
    label: 'Nevin AI',
    color: '#00ff88',
    onPress: (nav) => nav.navigate('MainTabs', { screen: 'NevinTab' } as any),
  },
  {
    icon: 'book-open-page-variant',
    label: 'Explorar',
    color: '#00f3ff',
    onPress: (nav) => nav.navigate('MainTabs', { screen: 'BibleTab' } as any),
  },
  {
    icon: 'book-clock',
    label: 'Plan de Lectura',
    color: '#00f3ff',
    onPress: (nav) => nav.navigate('ReadingPlan'),
  },
  {
    icon: 'timeline-text',
    label: 'Cronología',
    color: '#00ff88',
    onPress: (nav) => nav.navigate('Timeline'),
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
            colors={['rgba(0, 40, 60, 0.95)', 'rgba(5, 20, 35, 0.98)', 'rgba(0, 30, 50, 0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promiseGradient}
          >
            <View style={styles.promiseHeader}>
              <MaterialCommunityIcons name="star-four-points" size={20} color="#00f3ff" />
              <Text style={styles.promiseTitle}>Promesa del día</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#00f3ff" style={styles.loader} />
            ) : (
              <>
                <View style={styles.quoteBox}>
                  <MaterialCommunityIcons
                    name="format-quote-open"
                    size={30}
                    color="rgba(0, 243, 255, 0.6)"
                    style={styles.quoteOpen}
                  />
                  <Text style={styles.promiseText}>{dailyPromise}</Text>
                  <MaterialCommunityIcons
                    name="format-quote-close"
                    size={30}
                    color="rgba(0, 243, 255, 0.6)"
                    style={styles.quoteClose}
                  />
                </View>

                <View style={styles.referenceRow}>
                  <LinearGradient
                    colors={['transparent', 'rgba(0, 243, 255, 0.5)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.refLine}
                  />
                  <View style={styles.refDot} />
                  <Text style={styles.referenceText}>{promiseReference}</Text>
                  <View style={styles.refDot} />
                  <LinearGradient
                    colors={['rgba(0, 243, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.refLine}
                  />
                </View>
              </>
            )}

            <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
              <MaterialCommunityIcons name="share-variant" size={18} color="#00f3ff" />
              <Text style={styles.shareButtonText}>Compartir</Text>
            </TouchableOpacity>
          </LinearGradient>
          <View style={styles.cardGlow} />
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
                <Text style={styles.statNumber}>15</Text>
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

        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickCard}
              activeOpacity={0.8}
              onPress={() => action.onPress(navigation)}
            >
              <View style={[styles.quickIconWrap, { borderColor: action.color }]}>
                <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
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
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#00f3ff',
    position: 'relative',
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(0, 243, 255, 0.5)',
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    pointerEvents: 'none',
  },
  promiseGradient: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(5, 15, 25, 0.95)',
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  promiseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f3ff',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  quoteBox: {
    width: '100%',
    backgroundColor: 'rgba(0, 243, 255, 0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.12)',
    paddingHorizontal: 28,
    paddingVertical: 24,
    marginBottom: 22,
    position: 'relative',
  },
  quoteOpen: {
    position: 'absolute',
    top: 10,
    left: 12,
  },
  quoteClose: {
    position: 'absolute',
    bottom: 10,
    right: 12,
  },
  promiseText: {
    fontSize: 19,
    lineHeight: 30,
    color: '#e6f3ff',
    textAlign: 'center',
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  refLine: {
    flex: 1,
    height: 1,
  },
  refDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 243, 255, 0.7)',
    marginHorizontal: 8,
  },
  referenceText: {
    color: '#9fdfff',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  loader: {
    marginVertical: 40,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 243, 255, 0.6)',
  },
  shareButtonText: {
    color: '#00f3ff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  statsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7c93',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 14,
    marginLeft: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '48%',
    backgroundColor: 'rgba(15, 25, 40, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.15)',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 243, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e6f3ff',
    textAlign: 'center',
  },
});
