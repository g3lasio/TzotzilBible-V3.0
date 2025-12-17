import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, useTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

interface BookDisplay {
  id: number;
  name: string;
  chapters: number;
  testament: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Bible'>;

const { width } = Dimensions.get('window');

export default function BibleScreen({ navigation }: Props) {
  const [books, setBooks] = useState<BookDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTestament, setSelectedTestament] = useState<'all' | 'old' | 'new'>('all');
  const theme = useTheme();

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

  const oldTestamentBooks = books.filter(b => b.testament === 'old').length;
  const newTestamentBooks = books.filter(b => b.testament === 'new').length;

  const renderBookItem = ({ item, index }: { item: BookDisplay; index: number }) => (
    <Card
      style={[styles.bookCard, { backgroundColor: item.testament === 'old' ? '#e8f5e9' : '#e3f2fd' }]}
      onPress={() => navigation.navigate('Chapter', { book: item.name })}
    >
      <View style={styles.bookCardContent}>
        <View style={styles.bookNumber}>
          <Text style={styles.bookNumberText}>{item.id}</Text>
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookName}>{item.name}</Text>
          <Text style={styles.bookChapters}>{item.chapters} capítulos</Text>
        </View>
        <MaterialCommunityIcons 
          name="chevron-right" 
          size={24} 
          color="#666" 
        />
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Cargando libros...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={['#1a237e', '#3949ab']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Biblia Tzotzil</Text>
        <Text style={styles.headerSubtitle}>{books.length} libros disponibles</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar libro..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          iconColor="#1a237e"
        />
      </View>

      <View style={styles.filterContainer}>
        <Chip
          selected={selectedTestament === 'all'}
          onPress={() => setSelectedTestament('all')}
          style={styles.filterChip}
          selectedColor="#1a237e"
        >
          Todos ({books.length})
        </Chip>
        <Chip
          selected={selectedTestament === 'old'}
          onPress={() => setSelectedTestament('old')}
          style={styles.filterChip}
          selectedColor="#4CAF50"
        >
          AT ({oldTestamentBooks})
        </Chip>
        <Chip
          selected={selectedTestament === 'new'}
          onPress={() => setSelectedTestament('new')}
          style={styles.filterChip}
          selectedColor="#2196F3"
        >
          NT ({newTestamentBooks})
        </Chip>
      </View>

      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-search" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No se encontraron libros</Text>
          </View>
        }
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    elevation: 4,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  bookCard: {
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  bookCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  bookNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookNumberText: {
    fontWeight: 'bold',
    color: '#333',
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookChapters: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#999',
    fontSize: 16,
  },
});
