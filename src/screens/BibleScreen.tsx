import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BibleService } from '../services/BibleService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import type { Book } from '../types/bible';

interface BookDisplay {
  id: number;
  name: string;
  chapters: number;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Bible'>;

export default function BibleScreen({ navigation }: Props) {
  const [books, setBooks] = useState<BookDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const data = await BibleService.getBooks();
      const displayBooks: BookDisplay[] = data.map((book: any) => ({
        id: book.id || book.book_number || 0,
        name: book.name,
        chapters: book.chapters || book.chapters_count || 0
      }));
      setBooks(displayBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBookItem = ({ item }: { item: BookDisplay }) => (
    <Card
      style={styles.bookCard}
      onPress={() => navigation.navigate('Chapter', { book: item.name })}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.bookName}>{item.name}</Text>
        <Text variant="bodyMedium">{item.chapters} capítulos</Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Searchbar
        placeholder="Buscar libro..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
      />
      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    margin: 16,
    elevation: 4,
  },
  listContent: {
    padding: 16,
  },
  bookCard: {
    marginBottom: 12,
  },
  bookName: {
    fontWeight: 'bold',
  },
});
