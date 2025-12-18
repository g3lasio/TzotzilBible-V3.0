import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
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

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  const renderBookItem = ({ item }: { item: BookDisplay }) => (
    <TouchableOpacity
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

  const getFilteredByTestament = () => {
    if (selectedTestament === 'old') return oldTestamentBooks.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedTestament === 'new') return newTestamentBooks.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return null;
  };

  return (
    <MainLayout title="Leer">
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Select a Book</Text>
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

        {selectedTestament === 'all' && !searchQuery ? (
          <FlatList
            data={[
              { type: 'header', title: 'OLD TESTAMENT' },
              ...oldTestamentBooks.map(b => ({ type: 'book', ...b })),
              { type: 'header', title: 'NEW TESTAMENT' },
              ...newTestamentBooks.map(b => ({ type: 'book', ...b })),
            ]}
            renderItem={({ item }: any) => {
              if (item.type === 'header') {
                return renderSectionHeader(item.title);
              }
              return renderBookItem({ item });
            }}
            keyExtractor={(item: any, index) => item.type === 'header' ? `header-${item.title}` : String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="book-search" size={60} color="#6b7c93" />
                <Text style={styles.emptyText}>No se encontraron libros</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredBooks}
            renderItem={renderBookItem}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={
              selectedTestament !== 'all' ? 
                renderSectionHeader(selectedTestament === 'old' ? 'OLD TESTAMENT' : 'NEW TESTAMENT') : 
                null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="book-search" size={60} color="#6b7c93" />
                <Text style={styles.emptyText}>No se encontraron libros</Text>
              </View>
            }
          />
        )}
      </View>
    </MainLayout>
  );
}

const cardWidth = (width - 44) / 2;

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
  columnWrapper: {
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
