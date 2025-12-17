import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, useTheme, Switch, Divider } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BibleService } from '../services/BibleService';
import type { BibleVerse } from '../types/bible';
import type { RootStackParamList } from '../types/navigation';
import type { RouteProp } from '@react-navigation/native';

type VersesRouteProp = RouteProp<RootStackParamList, 'Verses'>;

export default function VersesScreen() {
  const route = useRoute<VersesRouteProp>();
  const theme = useTheme();
  const { book, chapter, initialVerse } = route.params;
  
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTzotzil, setShowTzotzil] = useState(true);
  const [showSpanish, setShowSpanish] = useState(true);

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

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{book} {chapter}</Text>
        <View style={styles.toggleContainer}>
          <View style={styles.toggleRow}>
            <Text>Tzotzil</Text>
            <Switch value={showTzotzil} onValueChange={setShowTzotzil} />
          </View>
          <View style={styles.toggleRow}>
            <Text>Español</Text>
            <Switch value={showSpanish} onValueChange={setShowSpanish} />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {verses.map((verse) => (
          <Card
            key={verse.id || `${verse.chapter}-${verse.verse}`}
            style={[
              styles.verseCard,
              initialVerse === verse.verse && styles.highlightedVerse
            ]}
          >
            <Card.Content>
              <Text style={styles.verseNumber}>{verse.verse}</Text>
              
              {showTzotzil && verse.text_tzotzil && (
                <View style={styles.textBlock}>
                  <Text style={styles.languageLabel}>Tzotzil</Text>
                  <Text style={styles.verseText}>{verse.text_tzotzil}</Text>
                </View>
              )}
              
              {showTzotzil && showSpanish && verse.text_tzotzil && verse.text && (
                <Divider style={styles.divider} />
              )}
              
              {showSpanish && verse.text && (
                <View style={styles.textBlock}>
                  <Text style={styles.languageLabel}>Español</Text>
                  <Text style={styles.verseText}>{verse.text}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ))}
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
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  verseCard: {
    marginBottom: 12,
  },
  highlightedVerse: {
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  verseNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  textBlock: {
    marginVertical: 4,
  },
  languageLabel: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  divider: {
    marginVertical: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});
