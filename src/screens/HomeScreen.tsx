import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Share, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
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

        <View style={styles.tipCard}>
          <LinearGradient
            colors={['rgba(0, 243, 255, 0.08)', 'rgba(0, 255, 136, 0.05)']}
            style={styles.tipGradient}
          >
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#00f3ff" />
            <Text style={styles.tipText}>
              Usa la barra de navegación para explorar la Biblia, buscar versículos o hablar con Nevin AI.
            </Text>
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
  },
  shareButtonText: {
    color: '#0a0e14',
    fontWeight: 'bold',
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
  tipCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  tipGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7c93',
    marginLeft: 12,
    lineHeight: 20,
  },
});
