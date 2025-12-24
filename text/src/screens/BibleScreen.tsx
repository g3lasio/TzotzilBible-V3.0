import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SectionList, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Searchbar, ActivityIndicator, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BibleService } from '../services/BibleService';
import type { BibleStackParamList } from '../types/navigation';
import MainLayout from '../components/MainLayout';

interface BookDisplay {
  id: number;
  name: string;
  chapters: number;
  testament: string;
}

type NavigationProp = NativeStackNavigationProp<BibleStackParamList>;

const { width } = Dimensions.get('window');

export default function BibleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [books, setBooks] = useState<BookDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTestament, setSelectedTestament] = useState<'all' | 'old' | 'new'>('all');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await BibleService.getBooks();
      const displayBooks: BookDisplay[] = data.map((book: any, index: number) => ({
        id: book.id || book.book_number || index + 1,
        name: book.name,
        chapters: book.chapters || book.chapters_count || 0,
        testament: index < 39 ? 'old' : 'new'
      }));
      setBooks(displayBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTestament = selectedTestament === 'all' || 
      (selectedTestament === 'old' && book.testament === 'old') ||
      (selectedTestament === 'new' && book.testament === 'new');
    return matchesSearch && matchesTestament;
  });

  const oldTestamentBooks = books.filter(b => b.testament === 'old');
  const newTestamentBooks = books.filter(b => b.testament === 'new');

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  const renderBookCard = (item: BookDisplay) => (
    <TouchableOpacity
      key={item.id}
      style={styles.bookCard}
      onPress={() => navigation.navigate('Chapter', { book: item.name })}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
        style={styles.bookCardGradient}
      >
        <Text style={styles.bookName}>{item.name}</Text>
        <Text style={styles.bookChapters}>{item.chapters} cap.</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const chunkArray = (arr: BookDisplay[], size: number): BookDisplay[][] => {
    const chunks: BookDisplay[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const renderRow = ({ item }: { item: BookDisplay[] }) => (
    <View style={styles.rowContainer}>
      {item.map(book => renderBookCard(book))}
      {item.length === 1 && <View style={styles.bookCardPlaceholder} />}
    </View>
  );

  if (loading) {
    return (
      <MainLayout title="Leer">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00f3ff" />
          <Text style={styles.loadingText}>Cargando libros...</Text>
        </View>
      </MainLayout>
    );
  }

  const getSections = () => {
    const filteredOld = oldTestamentBooks.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredNew = newTestamentBooks.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedTestament === 'old') {
      return [{ title: 'ANTIGUO TESTAMENTO', data: chunkArray(filteredOld, 2) }];
    }
    if (selectedTestament === 'new') {
      return [{ title: 'NUEVO TESTAMENTO', data: chunkArray(filteredNew, 2) }];
    }
    
    const sections = [];
    if (filteredOld.length > 0) {
      sections.push({ title: 'ANTIGUO TESTAMENTO', data: chunkArray(filteredOld, 2) });
    }
    if (filteredNew.length > 0) {
      sections.push({ title: 'NUEVO TESTAMENTO', data: chunkArray(filteredNew, 2) });
    }
    return sections;
  };

  return (
    <MainLayout title="Leer">
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Selecciona un Libro</Text>
          <Text style={styles.pageSubtitle}>{books.length} libros disponibles</Text>
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar libro..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor="#00f3ff"
            placeholderTextColor="#6b7c93"
          />
        </View>

        <View style={styles.filterContainer}>
          <Chip
            selected={selectedTestament === 'all'}
            onPress={() => setSelectedTestament('all')}
            style={[styles.filterChip, selectedTestament === 'all' && styles.filterChipActive]}
            textStyle={[styles.filterChipText, selectedTestament === 'all' && styles.filterChipTextActive]}
          >
            Todos ({books.length})
          </Chip>
          <Chip
            selected={selectedTestament === 'old'}
            onPress={() => setSelectedTestament('old')}
            style={[styles.filterChip, selectedTestament === 'old' && styles.filterChipActive]}
            textStyle={[styles.filterChipText, selectedTestament === 'old' && styles.filterChipTextActive]}
          >
            AT ({oldTestamentBooks.length})
          </Chip>
          <Chip
            selected={selectedTestament === 'new'}
            onPress={() => setSelectedTestament('new')}
            style={[styles.filterChip, selectedTestament === 'new' && styles.filterChipActive]}
            textStyle={[styles.filterChipText, selectedTestament === 'new' && styles.filterChipTextActive]}
          >
            NT ({newTestamentBooks.length})
          </Chip>
        </View>

        <SectionList
          sections={getSections()}
          renderItem={renderRow}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item, index) => `row-${index}-${item.map(b => b.id).join('-')}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="book-search" size={60} color="#6b7c93" />
              <Text style={styles.emptyText}>No se encontraron libros</Text>
            </View>
          }
        />
      </View>
    </MainLayout>
  );
}

const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;
const cardWidth = (width - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2;

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
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00f3ff',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6b7c93',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    backgroundColor: 'rgba(20, 30, 45, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
    elevation: 0,
  },
  searchInput: {
    color: '#e6f3ff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(20, 30, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 243, 255, 0.15)',
    borderColor: '#00f3ff',
  },
  filterChipText: {
    color: '#6b7c93',
  },
  filterChipTextActive: {
    color: '#00f3ff',
  },
  sectionHeader: {
    width: width - 32,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00f3ff',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  sectionLine: {
    height: 1,
    backgroundColor: 'rgba(0, 243, 255, 0.3)',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookCard: {
    width: cardWidth,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.4)',
  },
  bookCardPlaceholder: {
    width: cardWidth,
  },
  bookCardGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  bookName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e6f3ff',
    textAlign: 'center',
  },
  bookChapters: {
    fontSize: 11,
    color: '#6b7c93',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    width: width - 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#6b7c93',
    fontSize: 16,
  },
});
