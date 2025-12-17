import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Share, Animated } from 'react-native';
import { Text, Card, ActivityIndicator, Switch, Divider, Surface, IconButton, Chip, Menu } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import type { BibleVerse } from '../types/bible';
import type { RootStackParamList } from '../types/navigation';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type VersesRouteProp = RouteProp<RootStackParamList, 'Verses'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
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
        message: `${text}\n\n- Biblia Tzotzil`,
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Cargando versículos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle" size={60} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={['#1a237e', '#3949ab']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{book} {chapter}</Text>
        <Text style={styles.headerSubtitle}>{verses.length} versículos</Text>
      </LinearGradient>

      <Surface style={styles.controls} elevation={2}>
        <View style={styles.languageToggles}>
          <Chip
            selected={showTzotzil}
            onPress={() => setShowTzotzil(!showTzotzil)}
            style={styles.languageChip}
            selectedColor="#4CAF50"
          >
            Tzotzil
          </Chip>
          <Chip
            selected={showSpanish}
            onPress={() => setShowSpanish(!showSpanish)}
            style={styles.languageChip}
            selectedColor="#2196F3"
          >
            Español
          </Chip>
        </View>
        <View style={styles.navButtons}>
          <IconButton
            icon="chevron-left"
            size={24}
            onPress={() => navigateChapter('prev')}
            disabled={chapter <= 1}
          />
          <IconButton
            icon="chevron-right"
            size={24}
            onPress={() => navigateChapter('next')}
          />
        </View>
      </Surface>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {!showTzotzil && !showSpanish && (
          <Surface style={styles.warningCard} elevation={1}>
            <MaterialCommunityIcons name="alert" size={24} color="#f57c00" />
            <Text style={styles.warningText}>
              Selecciona al menos un idioma para ver los versículos
            </Text>
          </Surface>
        )}

        {verses.map((verse) => (
          <Card
            key={verse.id || `${verse.chapter}-${verse.verse}`}
            style={[
              styles.verseCard,
              initialVerse === verse.verse && styles.highlightedVerse
            ]}
            onLongPress={() => handleShare(verse)}
          >
            <Card.Content>
              <View style={styles.verseHeader}>
                <View style={styles.verseNumberBadge}>
                  <Text style={styles.verseNumber}>{verse.verse}</Text>
                </View>
                <IconButton
                  icon="share-variant"
                  size={18}
                  onPress={() => handleShare(verse)}
                  style={styles.shareIcon}
                />
              </View>
              
              {showTzotzil && verse.text_tzotzil && (
                <View style={styles.textBlock}>
                  <View style={styles.languageHeader}>
                    <MaterialCommunityIcons name="translate" size={14} color="#4CAF50" />
                    <Text style={[styles.languageLabel, { color: '#4CAF50' }]}>Tzotzil</Text>
                  </View>
                  <Text style={styles.verseText}>{verse.text_tzotzil}</Text>
                </View>
              )}
              
              {showTzotzil && showSpanish && verse.text_tzotzil && verse.text && (
                <Divider style={styles.divider} />
              )}
              
              {showSpanish && verse.text && (
                <View style={styles.textBlock}>
                  <View style={styles.languageHeader}>
                    <MaterialCommunityIcons name="translate" size={14} color="#2196F3" />
                    <Text style={[styles.languageLabel, { color: '#2196F3' }]}>Español</Text>
                  </View>
                  <Text style={styles.verseText}>{verse.text}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
        
        <View style={styles.bottomNav}>
          <Card
            style={[styles.navCard, chapter <= 1 && styles.navCardDisabled]}
            onPress={() => chapter > 1 && navigateChapter('prev')}
          >
            <Card.Content style={styles.navCardContent}>
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={chapter <= 1 ? '#ccc' : '#1a237e'} 
              />
              <Text style={[styles.navCardText, chapter <= 1 && styles.navCardTextDisabled]}>
                Capítulo anterior
              </Text>
            </Card.Content>
          </Card>
          
          <Card
            style={styles.navCard}
            onPress={() => navigateChapter('next')}
          >
            <Card.Content style={styles.navCardContent}>
              <Text style={styles.navCardText}>Siguiente capítulo</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#1a237e" />
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  languageToggles: {
    flexDirection: 'row',
    gap: 8,
  },
  languageChip: {
    backgroundColor: '#f5f5f5',
  },
  navButtons: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff3e0',
    marginBottom: 16,
  },
  warningText: {
    marginLeft: 12,
    color: '#e65100',
    flex: 1,
  },
  verseCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  highlightedVerse: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
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
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  shareIcon: {
    margin: 0,
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
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
  },
  divider: {
    marginVertical: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  navCard: {
    flex: 1,
    borderRadius: 12,
  },
  navCardDisabled: {
    opacity: 0.5,
  },
  navCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCardText: {
    fontSize: 13,
    color: '#1a237e',
    fontWeight: '500',
  },
  navCardTextDisabled: {
    color: '#ccc',
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});
