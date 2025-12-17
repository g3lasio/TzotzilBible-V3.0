import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Keyboard } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, Surface, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BibleService } from '../services/BibleService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const POPULAR_SEARCHES = ['amor', 'fe', 'esperanza', 'salvación', 'gracia', 'paz'];

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setSearchQuery(searchTerm);
    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);
    
    try {
      const results = await BibleService.searchVerses(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching verses:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToVerse = (book: string, chapter: number, verse: number) => {
    navigation.navigate('Verses', { book, chapter, initialVerse: verse });
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchQuery || !text) return text;
    return text;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={['#1a237e', '#3949ab']}
        style={styles.header}
      >
        <MaterialCommunityIcons name="magnify" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Búsqueda Bíblica</Text>
        <Text style={styles.headerSubtitle}>Encuentra versículos por palabra clave</Text>
      </LinearGradient>

      <Surface style={styles.searchContainer} elevation={4}>
        <TextInput
          mode="outlined"
          placeholder="Escribe una palabra o frase..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch()}
          left={<TextInput.Icon icon="magnify" />}
          right={searchQuery ? (
            <TextInput.Icon 
              icon="close-circle" 
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setHasSearched(false);
              }} 
            />
          ) : undefined}
          outlineColor="#e0e0e0"
          activeOutlineColor="#1a237e"
        />
        <Button 
          mode="contained" 
          onPress={() => handleSearch()}
          style={styles.searchButton}
          buttonColor="#1a237e"
          disabled={loading || !searchQuery.trim()}
        >
          Buscar
        </Button>
      </Surface>

      {!hasSearched && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Búsquedas populares:</Text>
          <View style={styles.chipsContainer}>
            {POPULAR_SEARCHES.map((term) => (
              <Chip
                key={term}
                onPress={() => handleSearch(term)}
                style={styles.suggestionChip}
                icon="magnify"
              >
                {term}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>Buscando versículos...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.resultsContainer}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {hasSearched && searchResults.length > 0 && (
            <Text style={styles.resultsCount}>
              Se encontraron {searchResults.length} resultados para "{searchQuery}"
            </Text>
          )}

          {searchResults.map((result, index) => (
            <Card
              key={index}
              style={styles.resultCard}
              onPress={() => navigateToVerse(result.book_name || result.book, result.chapter, result.verse)}
            >
              <Card.Content>
                <View style={styles.resultHeader}>
                  <View style={styles.referenceBadge}>
                    <MaterialCommunityIcons name="bookmark" size={16} color="#fff" />
                    <Text style={styles.referenceText}>
                      {result.book_name || result.book} {result.chapter}:{result.verse}
                    </Text>
                  </View>
                </View>
                
                {result.text && (
                  <View style={styles.resultTextBlock}>
                    <Text style={styles.languageIndicator}>Español</Text>
                    <Text style={styles.verseText} numberOfLines={3}>
                      {result.text}
                    </Text>
                  </View>
                )}
                
                {result.text_tzotzil && (
                  <View style={styles.resultTextBlock}>
                    <Text style={[styles.languageIndicator, { color: '#4CAF50' }]}>Tzotzil</Text>
                    <Text style={styles.verseText} numberOfLines={2}>
                      {result.text_tzotzil}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))}

          {hasSearched && searchResults.length === 0 && !loading && (
            <Surface style={styles.noResultsCard} elevation={1}>
              <MaterialCommunityIcons name="file-search-outline" size={60} color="#ccc" />
              <Text style={styles.noResultsTitle}>Sin resultados</Text>
              <Text style={styles.noResultsText}>
                No se encontraron versículos para "{searchQuery}"
              </Text>
              <Text style={styles.noResultsHint}>
                Intenta con otras palabras o términos más cortos
              </Text>
            </Surface>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  searchButton: {
    borderRadius: 10,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#e8eaf6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
    paddingTop: 0,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  resultCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  resultHeader: {
    marginBottom: 12,
  },
  referenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a237e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  referenceText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 13,
  },
  resultTextBlock: {
    marginTop: 8,
  },
  languageIndicator: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2196F3',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  noResultsCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginTop: 20,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noResultsText: {
    fontSize: 15,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
});
