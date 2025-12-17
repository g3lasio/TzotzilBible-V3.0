import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, ActivityIndicator, Surface } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

type ChapterRouteProp = RouteProp<RootStackParamList, 'Chapter'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 64) / 5;

export default function ChapterScreen() {
  const route = useRoute<ChapterRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { book } = route.params;
  
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const chapterData = await BibleService.getChapters(book);
      setChapters(chapterData);
      setError(null);
    } catch (err) {
      console.error('Error loading chapters:', err);
      setError('Error cargando capítulos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChapters();
    setRefreshing(false);
  };

  useEffect(() => {
    loadChapters();
  }, [book]);

  const handleChapterPress = (chapterNum: number) => {
    navigation.navigate('Verses', { book, chapter: chapterNum });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Cargando capítulos...</Text>
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
        <MaterialCommunityIcons name="book-open-variant" size={32} color="#fff" />
        <Text style={styles.headerTitle}>{book}</Text>
        <Text style={styles.headerSubtitle}>{chapters.length} capítulos</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Surface style={styles.infoCard} elevation={2}>
          <MaterialCommunityIcons name="information" size={20} color="#1a237e" />
          <Text style={styles.infoText}>
            Selecciona un capítulo para comenzar a leer
          </Text>
        </Surface>

        <View style={styles.chaptersGrid}>
          {chapters.map((chapter) => (
            <Card
              key={chapter}
              style={styles.chapterCard}
              onPress={() => handleChapterPress(chapter)}
            >
              <LinearGradient
                colors={['#5c6bc0', '#3949ab']}
                style={styles.chapterCardGradient}
              >
                <Text style={styles.chapterNumber}>{chapter}</Text>
              </LinearGradient>
            </Card>
          ))}
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
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#e8eaf6',
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 12,
    color: '#1a237e',
    fontSize: 14,
    flex: 1,
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  chapterCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chapterCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});
