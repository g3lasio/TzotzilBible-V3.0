import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Share, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ActivityIndicator, Chip, IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import type { BibleVerse } from '../types/bible';
import type { RootStackParamList } from '../types/navigation';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainLayout from '../components/MainLayout';

type VersesRouteProp = RouteProp<RootStackParamList, 'Verses'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function VersesScreen() {
  const route = useRoute<VersesRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { book, chapter, initialVerse } = route.params;
  
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTzotzil, setShowTzotzil] = useState(true);
  const [showSpanish, setShowSpanish] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadVerses = async () => {
    try {
      setLoading(true);
      const verseData = await BibleService.getVerses(book, chapter);
      setVerses(verseData);
      setError(null);
    } catch (err) {
      console.error('Error loading verses:', err);
      setError('Error cargando versículos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVerses();
    setRefreshing(false);
  };

  useEffect(() => {
    loadVerses();
  }, [book, chapter]);

  const handleShare = async (verse: BibleVerse) => {
    try {
      const text = verse.text_tzotzil && verse.text
        ? `${book} ${chapter}:${verse.verse}\n\nTzotzil:\n${verse.text_tzotzil}\n\nEspañol:\n${verse.text}`
        : `${book} ${chapter}:${verse.verse}\n\n${verse.text || verse.text_tzotzil}`;
      
      await Share.share({
        message: `${text}\n\n- Tzotzil Bible`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    const newChapter = direction === 'prev' ? chapter - 1 : chapter + 1;
    if (newChapter >= 1) {
      navigation.replace('Verses', { book, chapter: newChapter });
    }
  };

  if (loading && !refreshing) {
    return (
      <MainLayout title={`${book} ${chapter}`} showBackButton>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00f3ff" />
          <Text style={styles.loadingText}>Cargando versículos...</Text>
        </View>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title={`${book} ${chapter}`} showBackButton>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`${book} ${chapter}`} showBackButton>
      <View style={styles.container}>
        <View style={styles.controls}>
          <View style={styles.languageToggles}>
            <TouchableOpacity
              style={[styles.languageChip, showTzotzil && styles.languageChipActive]}
              onPress={() => setShowTzotzil(!showTzotzil)}
            >
              <Text style={[styles.languageChipText, showTzotzil && styles.languageChipTextActive]}>
                Tzotzil
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageChip, showSpanish && styles.languageChipActiveCyan]}
              onPress={() => setShowSpanish(!showSpanish)}
            >
              <Text style={[styles.languageChipText, showSpanish && styles.languageChipTextActiveCyan]}>
                Español
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.navButton, chapter <= 1 && styles.navButtonDisabled]}
              onPress={() => navigateChapter('prev')}
              disabled={chapter <= 1}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={chapter <= 1 ? '#6b7c93' : '#00f3ff'} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateChapter('next')}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#00f3ff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f3ff" />
          }
          showsVerticalScrollIndicator={false}
        >
          {!showTzotzil && !showSpanish && (
            <View style={styles.warningCard}>
              <LinearGradient
                colors={['rgba(255, 107, 107, 0.15)', 'rgba(255, 107, 107, 0.05)']}
                style={styles.warningGradient}
              >
                <MaterialCommunityIcons name="alert" size={24} color="#ff6b6b" />
                <Text style={styles.warningText}>
                  Selecciona al menos un idioma para ver los versículos
                </Text>
              </LinearGradient>
            </View>
          )}

          {verses.map((verse) => (
            <TouchableOpacity
              key={verse.id || `${verse.chapter}-${verse.verse}`}
              style={[
                styles.verseCard,
                initialVerse === verse.verse && styles.highlightedVerse
              ]}
              onLongPress={() => handleShare(verse)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={initialVerse === verse.verse 
                  ? ['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']
                  : ['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
                style={styles.verseGradient}
              >
                <View style={styles.verseHeader}>
                  <View style={styles.verseNumberBadge}>
                    <Text style={styles.verseNumber}>{verse.verse}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => handleShare(verse)}
                  >
                    <MaterialCommunityIcons name="share-variant" size={18} color="#6b7c93" />
                  </TouchableOpacity>
                </View>
                
                {showTzotzil && verse.text_tzotzil && (
                  <View style={styles.textBlock}>
                    <View style={styles.languageHeader}>
                      <MaterialCommunityIcons name="translate" size={14} color="#00ff88" />
                      <Text style={[styles.languageLabel, { color: '#00ff88' }]}>Tzotzil</Text>
                    </View>
                    <Text style={styles.verseText}>{verse.text_tzotzil}</Text>
                  </View>
                )}
                
                {showTzotzil && showSpanish && verse.text_tzotzil && verse.text && (
                  <View style={styles.divider} />
                )}
                
                {showSpanish && verse.text && (
                  <View style={styles.textBlock}>
                    <View style={styles.languageHeader}>
                      <MaterialCommunityIcons name="translate" size={14} color="#00f3ff" />
                      <Text style={[styles.languageLabel, { color: '#00f3ff' }]}>Español</Text>
                    </View>
                    <Text style={styles.verseText}>{verse.text}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
          
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={[styles.bottomNavCard, chapter <= 1 && styles.bottomNavCardDisabled]}
              onPress={() => chapter > 1 && navigateChapter('prev')}
              disabled={chapter <= 1}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={chapter <= 1 ? '#6b7c93' : '#00f3ff'} 
              />
              <Text style={[styles.bottomNavText, chapter <= 1 && styles.bottomNavTextDisabled]}>
                Capítulo anterior
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.bottomNavCard}
              onPress={() => navigateChapter('next')}
            >
              <Text style={styles.bottomNavText}>Siguiente capítulo</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#00f3ff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7c93',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.2)',
  },
  languageToggles: {
    flexDirection: 'row',
    gap: 8,
  },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
    backgroundColor: 'rgba(20, 30, 45, 0.6)',
  },
  languageChipActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderColor: '#00ff88',
  },
  languageChipActiveCyan: {
    backgroundColor: 'rgba(0, 243, 255, 0.15)',
    borderColor: '#00f3ff',
  },
  languageChipText: {
    color: '#6b7c93',
    fontSize: 13,
    fontWeight: '600',
  },
  languageChipTextActive: {
    color: '#00ff88',
  },
  languageChipTextActiveCyan: {
    color: '#00f3ff',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  warningCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  warningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  warningText: {
    marginLeft: 12,
    color: '#ff6b6b',
    flex: 1,
  },
  verseCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  highlightedVerse: {
    borderColor: 'rgba(0, 255, 136, 0.5)',
  },
  verseGradient: {
    padding: 16,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00f3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a0e14',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(107, 124, 147, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    marginVertical: 8,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  languageLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#e6f3ff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 243, 255, 0.2)',
    marginVertical: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  bottomNavCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 30, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  bottomNavCardDisabled: {
    opacity: 0.5,
  },
  bottomNavText: {
    fontSize: 13,
    color: '#00f3ff',
    fontWeight: '500',
  },
  bottomNavTextDisabled: {
    color: '#6b7c93',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});
