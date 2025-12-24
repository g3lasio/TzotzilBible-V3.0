import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Keyboard, TouchableOpacity, Dimensions } from 'react-native';
import { Text, TextInput, ActivityIndicator, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BibleService } from '../services/BibleService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import MainLayout from '../components/MainLayout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

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
    navigation.navigate('MainTabs', { 
      screen: 'BibleTab', 
      params: { 
        screen: 'Verses', 
        params: { book, chapter, initialVerse: verse } 
      } 
    });
  };

  return (
    <MainLayout title="Buscar">
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <MaterialCommunityIcons name="magnify" size={28} color="#00f3ff" />
          <Text style={styles.pageTitle}>Búsqueda Bíblica</Text>
          <Text style={styles.pageSubtitle}>Encuentra versículos por palabra clave o referencia</Text>
        </View>

        <View style={styles.searchContainer}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.searchGradient}
          >
            <TextInput
              mode="outlined"
              placeholder="Escribe una palabra o frase..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch()}
              placeholderTextColor="#6b7c93"
              textColor="#e6f3ff"
              outlineColor="rgba(0, 243, 255, 0.3)"
              activeOutlineColor="#00f3ff"
              left={<TextInput.Icon icon="magnify" color="#00f3ff" />}
              right={searchQuery ? (
                <TextInput.Icon 
                  icon="close-circle" 
                  color="#6b7c93"
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setHasSearched(false);
                  }} 
                />
              ) : undefined}
            />
            <TouchableOpacity 
              style={[styles.searchButton, (!searchQuery.trim() || loading) && styles.searchButtonDisabled]}
              onPress={() => handleSearch()}
              disabled={loading || !searchQuery.trim()}
            >
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {!hasSearched && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Búsquedas populares:</Text>
            <View style={styles.chipsContainer}>
              {POPULAR_SEARCHES.map((term) => (
                <TouchableOpacity
                  key={term}
                  style={styles.suggestionChip}
                  onPress={() => handleSearch(term)}
                >
                  <MaterialCommunityIcons name="magnify" size={14} color="#00f3ff" />
                  <Text style={styles.suggestionText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00f3ff" />
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
              <TouchableOpacity
                key={index}
                style={styles.resultCard}
                onPress={() => navigateToVerse(result.book_name || result.book, result.chapter, result.verse)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
                  style={styles.resultGradient}
                >
                  <View style={styles.resultHeader}>
                    <View style={styles.referenceBadge}>
                      <MaterialCommunityIcons name="bookmark" size={14} color="#0a0e14" />
                      <Text style={styles.referenceText}>
                        {result.book_name || result.book} {result.chapter}:{result.verse}
                      </Text>
                    </View>
                  </View>
                  
                  {result.text && (
                    <View style={styles.resultTextBlock}>
                      <Text style={styles.languageIndicator}>RV1960</Text>
                      <Text style={styles.verseText} numberOfLines={3}>
                        {result.text}
                      </Text>
                    </View>
                  )}
                  
                  {result.text_tzotzil && (
                    <View style={styles.resultTextBlock}>
                      <Text style={[styles.languageIndicator, { color: '#00ff88' }]}>Tzotzil</Text>
                      <Text style={styles.verseText} numberOfLines={2}>
                        {result.text_tzotzil}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}

            {hasSearched && searchResults.length === 0 && !loading && (
              <View style={styles.noResultsCard}>
                <LinearGradient
                  colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
                  style={styles.noResultsGradient}
                >
                  <MaterialCommunityIcons name="file-search-outline" size={60} color="#6b7c93" />
                  <Text style={styles.noResultsTitle}>Sin resultados</Text>
                  <Text style={styles.noResultsText}>
                    No se encontraron versículos para "{searchQuery}"
                  </Text>
                  <Text style={styles.noResultsHint}>
                    Intenta con otras palabras o términos más cortos
                  </Text>
                </LinearGradient>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e6f3ff',
    marginTop: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7c93',
    marginTop: 4,
    textAlign: 'center',
  },
  searchContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  searchGradient: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  searchButton: {
    backgroundColor: '#00f3ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: 'rgba(0, 243, 255, 0.3)',
  },
  searchButtonText: {
    color: '#0a0e14',
    fontWeight: 'bold',
    fontSize: 16,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#6b7c93',
    marginBottom: 12,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestionText: {
    color: '#00f3ff',
    marginLeft: 6,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7c93',
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
    color: '#6b7c93',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  resultCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  resultGradient: {
    padding: 16,
  },
  resultHeader: {
    marginBottom: 12,
  },
  referenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00f3ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  referenceText: {
    color: '#0a0e14',
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
    color: '#00f3ff',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e6f3ff',
  },
  noResultsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
    marginTop: 20,
  },
  noResultsGradient: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e6f3ff',
    marginTop: 16,
  },
  noResultsText: {
    fontSize: 15,
    color: '#6b7c93',
    marginTop: 8,
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: 13,
    color: '#6b7c93',
    marginTop: 8,
    textAlign: 'center',
  },
});
