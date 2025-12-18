import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import MainLayout from '../components/MainLayout';

type ChapterRouteProp = RouteProp<RootStackParamList, 'Chapter'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 5;

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
      <MainLayout title={book} showBackButton>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00f3ff" />
          <Text style={styles.loadingText}>Cargando capítulos...</Text>
        </View>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title={book} showBackButton>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={book} showBackButton>
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <MaterialCommunityIcons name="book-open-variant" size={28} color="#00ff88" />
          <Text style={styles.bookTitle}>{book}</Text>
          <Text style={styles.chapterCount}>{chapters.length} capítulos</Text>
        </View>

        <View style={styles.infoCard}>
          <LinearGradient
            colors={['rgba(0, 243, 255, 0.1)', 'rgba(0, 243, 255, 0.05)']}
            style={styles.infoGradient}
          >
            <MaterialCommunityIcons name="information" size={20} color="#00f3ff" />
            <Text style={styles.infoText}>
              Selecciona un capítulo para comenzar a leer
            </Text>
          </LinearGradient>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f3ff" />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chaptersGrid}>
            {chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter}
                style={styles.chapterCard}
                onPress={() => handleChapterPress(chapter)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(20, 30, 45, 0.9)', 'rgba(15, 25, 40, 0.95)']}
                  style={styles.chapterCardGradient}
                >
                  <Text style={styles.chapterNumber}>{chapter}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bookTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e6f3ff',
    marginTop: 12,
  },
  chapterCount: {
    fontSize: 14,
    color: '#6b7c93',
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  infoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoText: {
    marginLeft: 12,
    color: '#00f3ff',
    fontSize: 14,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.4)',
  },
  chapterCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00f3ff',
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});
