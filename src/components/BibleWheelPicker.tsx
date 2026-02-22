import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  FlatList,
  Animated,
  ViewToken,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BibleService } from '../services/BibleService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Bible books data
const OLD_TESTAMENT = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
  'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
  '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras',
  'Nehemías', 'Ester', 'Job', 'Salmos', 'Proverbios',
  'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías', 'Lamentaciones',
  'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós',
  'Abdías', 'Jonás', 'Miqueas', 'Nahúm', 'Habacuc',
  'Sofonías', 'Hageo', 'Zacarías', 'Malaquías'
];

const NEW_TESTAMENT = [
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos',
  'Romanos', '1 Corintios', '2 Corintios', 'Gálatas', 'Efesios',
  'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses',
  '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón', 'Hebreos',
  'Santiago', '1 Pedro', '2 Pedro', '1 Juan', '2 Juan',
  '3 Juan', 'Judas', 'Apocalipsis'
];

const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];

// Chapter counts for each book
const CHAPTER_COUNTS: Record<string, number> = {
  'Génesis': 50, 'Éxodo': 40, 'Levítico': 27, 'Números': 36, 'Deuteronomio': 34,
  'Josué': 24, 'Jueces': 21, 'Rut': 4, '1 Samuel': 31, '2 Samuel': 24,
  '1 Reyes': 22, '2 Reyes': 25, '1 Crónicas': 29, '2 Crónicas': 36, 'Esdras': 10,
  'Nehemías': 13, 'Ester': 10, 'Job': 42, 'Salmos': 150, 'Proverbios': 31,
  'Eclesiastés': 12, 'Cantares': 8, 'Isaías': 66, 'Jeremías': 52, 'Lamentaciones': 5,
  'Ezequiel': 48, 'Daniel': 12, 'Oseas': 14, 'Joel': 3, 'Amós': 9,
  'Abdías': 1, 'Jonás': 4, 'Miqueas': 7, 'Nahúm': 3, 'Habacuc': 3,
  'Sofonías': 3, 'Hageo': 2, 'Zacarías': 14, 'Malaquías': 4,
  'Mateo': 28, 'Marcos': 16, 'Lucas': 24, 'Juan': 21, 'Hechos': 28,
  'Romanos': 16, '1 Corintios': 16, '2 Corintios': 13, 'Gálatas': 6, 'Efesios': 6,
  'Filipenses': 4, 'Colosenses': 4, '1 Tesalonicenses': 5, '2 Tesalonicenses': 3,
  '1 Timoteo': 6, '2 Timoteo': 4, 'Tito': 3, 'Filemón': 1, 'Hebreos': 13,
  'Santiago': 5, '1 Pedro': 5, '2 Pedro': 3, '1 Juan': 5, '2 Juan': 1,
  '3 Juan': 1, 'Judas': 1, 'Apocalipsis': 22
};

interface BibleWheelPickerProps {
  visible: boolean;
  currentBook: string;
  currentChapter: number;
  onSelect: (book: string, chapter: number) => void;
  onClose: () => void;
}

// Wheel column component
function WheelColumn({ 
  data, 
  selectedIndex, 
  onSelect, 
  renderLabel,
  columnWidth,
}: { 
  data: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderLabel: (item: any) => string;
  columnWidth: number;
}) {
  const flatListRef = useRef<FlatList>(null);
  const [internalIndex, setInternalIndex] = useState(selectedIndex);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0 && selectedIndex < data.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: true,
        });
      }, 100);
    }
  }, [selectedIndex, data.length]);

  const handleScrollEnd = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    setInternalIndex(clampedIndex);
    onSelect(clampedIndex);
  }, [data.length, onSelect]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  // Padding items for centering
  const paddingCount = Math.floor(VISIBLE_ITEMS / 2);
  const paddedData = [
    ...Array(paddingCount).fill(null),
    ...data,
    ...Array(paddingCount).fill(null),
  ];

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const actualIndex = index - paddingCount;
    const isSelected = actualIndex === internalIndex;
    const isPadding = item === null;

    if (isPadding) {
      return <View style={{ height: ITEM_HEIGHT }} />;
    }

    const distance = Math.abs(actualIndex - internalIndex);
    const opacity = distance === 0 ? 1 : distance === 1 ? 0.5 : 0.25;
    const scale = distance === 0 ? 1 : distance === 1 ? 0.9 : 0.8;

    return (
      <TouchableOpacity
        style={[styles.wheelItem, { height: ITEM_HEIGHT, width: columnWidth }]}
        onPress={() => {
          setInternalIndex(actualIndex);
          onSelect(actualIndex);
          flatListRef.current?.scrollToOffset({
            offset: actualIndex * ITEM_HEIGHT,
            animated: true,
          });
        }}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.wheelItemText,
            isSelected && styles.wheelItemTextSelected,
            { opacity, transform: [{ scale }] },
          ]}
          numberOfLines={1}
        >
          {renderLabel(item)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wheelColumn, { width: columnWidth, height: PICKER_HEIGHT }]}>
      {/* Selection indicator */}
      <View style={styles.selectionIndicator} pointerEvents="none" />
      
      <FlatList
        ref={flatListRef}
        data={paddedData}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={getItemLayout}
        initialScrollIndex={selectedIndex}
        contentContainerStyle={{ paddingVertical: 0 }}
        bounces={true}
      />
    </View>
  );
}

export default function BibleWheelPicker({ 
  visible, 
  currentBook, 
  currentChapter, 
  onSelect, 
  onClose 
}: BibleWheelPickerProps) {
  const [selectedTestament, setSelectedTestament] = useState<'old' | 'new'>(
    OLD_TESTAMENT.includes(currentBook) ? 'old' : 'new'
  );
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(currentChapter - 1);
  const [books, setBooks] = useState<string[]>(OLD_TESTAMENT);
  const [chapters, setChapters] = useState<number[]>([]);

  useEffect(() => {
    if (visible) {
      const isOT = OLD_TESTAMENT.includes(currentBook);
      setSelectedTestament(isOT ? 'old' : 'new');
      const bookList = isOT ? OLD_TESTAMENT : NEW_TESTAMENT;
      setBooks(bookList);
      const bookIdx = bookList.indexOf(currentBook);
      setSelectedBookIndex(bookIdx >= 0 ? bookIdx : 0);
      setSelectedChapterIndex(currentChapter - 1);
      updateChapters(currentBook);
    }
  }, [visible, currentBook, currentChapter]);

  const updateChapters = (bookName: string) => {
    const count = CHAPTER_COUNTS[bookName] || 1;
    setChapters(Array.from({ length: count }, (_, i) => i + 1));
  };

  const handleTestamentChange = (testament: 'old' | 'new') => {
    setSelectedTestament(testament);
    const bookList = testament === 'old' ? OLD_TESTAMENT : NEW_TESTAMENT;
    setBooks(bookList);
    setSelectedBookIndex(0);
    const firstBook = bookList[0];
    updateChapters(firstBook);
    setSelectedChapterIndex(0);
  };

  const handleBookSelect = (index: number) => {
    setSelectedBookIndex(index);
    const bookName = books[index];
    updateChapters(bookName);
    // Reset chapter to 1 when book changes
    setSelectedChapterIndex(0);
  };

  const handleChapterSelect = (index: number) => {
    setSelectedChapterIndex(index);
  };

  const handleConfirm = () => {
    const selectedBook = books[selectedBookIndex];
    const selectedChapter = chapters[selectedChapterIndex] || 1;
    onSelect(selectedBook, selectedChapter);
    onClose();
  };

  const selectedBook = books[selectedBookIndex] || currentBook;
  const selectedChapter = chapters[selectedChapterIndex] || 1;

  const pickerWidth = Math.min(SCREEN_WIDTH - 40, 380);
  const bookColumnWidth = pickerWidth * 0.6;
  const chapterColumnWidth = pickerWidth * 0.35;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { width: pickerWidth + 20 }]}>
          {/* Header */}
          <LinearGradient
            colors={['#141c28', '#1a2332']}
            style={styles.header}
          >
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Ir a...</Text>
              <Text style={styles.headerPreview}>
                {selectedBook} {selectedChapter}
              </Text>
            </View>
            <TouchableOpacity onPress={handleConfirm} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, styles.headerBtnConfirm]}>Ir</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Testament Toggle */}
          <View style={styles.testamentToggle}>
            <TouchableOpacity
              style={[
                styles.testamentBtn,
                selectedTestament === 'old' && styles.testamentBtnActive,
              ]}
              onPress={() => handleTestamentChange('old')}
            >
              <Text style={[
                styles.testamentBtnText,
                selectedTestament === 'old' && styles.testamentBtnTextActive,
              ]}>
                Antiguo Testamento
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.testamentBtn,
                selectedTestament === 'new' && styles.testamentBtnActive,
              ]}
              onPress={() => handleTestamentChange('new')}
            >
              <Text style={[
                styles.testamentBtnText,
                selectedTestament === 'new' && styles.testamentBtnTextActive,
              ]}>
                Nuevo Testamento
              </Text>
            </TouchableOpacity>
          </View>

          {/* Column Labels */}
          <View style={styles.columnLabels}>
            <Text style={[styles.columnLabel, { width: bookColumnWidth }]}>Libro</Text>
            <Text style={[styles.columnLabel, { width: chapterColumnWidth }]}>Cap.</Text>
          </View>

          {/* Wheel Pickers */}
          <View style={styles.pickersRow}>
            <WheelColumn
              data={books}
              selectedIndex={selectedBookIndex}
              onSelect={handleBookSelect}
              renderLabel={(item: string) => item}
              columnWidth={bookColumnWidth}
            />
            <View style={styles.pickerDivider} />
            <WheelColumn
              data={chapters}
              selectedIndex={selectedChapterIndex}
              onSelect={handleChapterSelect}
              renderLabel={(item: number) => `${item}`}
              columnWidth={chapterColumnWidth}
            />
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            <MaterialCommunityIcons name="book-open-variant" size={14} color="#00f3ff" />
            <Text style={styles.quickInfoText}>
              {selectedBook} · {chapters.length} capítulo{chapters.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a2332',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    maxWidth: 420,
    width: '100%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3442',
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBtnText: {
    color: '#6b7c93',
    fontSize: 15,
  },
  headerBtnConfirm: {
    color: '#00f3ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#e6f3ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerPreview: {
    color: '#00f3ff',
    fontSize: 12,
    marginTop: 2,
  },
  testamentToggle: {
    flexDirection: 'row',
    margin: 12,
    backgroundColor: '#141c28',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#2a3442',
  },
  testamentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  testamentBtnActive: {
    backgroundColor: 'rgba(0, 243, 255, 0.15)',
  },
  testamentBtnText: {
    color: '#6b7c93',
    fontSize: 12,
    fontWeight: '600',
  },
  testamentBtnTextActive: {
    color: '#00f3ff',
  },
  columnLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  columnLabel: {
    color: '#556677',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  pickersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  pickerDivider: {
    width: 1,
    height: PICKER_HEIGHT - 20,
    backgroundColor: '#2a3442',
  },
  wheelColumn: {
    overflow: 'hidden',
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(0, 243, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.25)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  wheelItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  wheelItemText: {
    color: '#6b7c93',
    fontSize: 15,
    textAlign: 'center',
  },
  wheelItemTextSelected: {
    color: '#e6f3ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a3442',
    gap: 6,
  },
  quickInfoText: {
    color: '#556677',
    fontSize: 12,
  },
});
