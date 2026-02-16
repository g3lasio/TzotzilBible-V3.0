import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TimelineService from '../services/TimelineService';
import { Era } from '../types/timeline';

const { width } = Dimensions.get('window');

interface TimelineScreenProps {
  navigation: any;
}

const TimelineScreen: React.FC<TimelineScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestament, setSelectedTestament] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [expandedEra, setExpandedEra] = useState<string | null>(null);

  // Get all eras
  const allEras = useMemo(() => TimelineService.getEras(), []);

  // Filter eras by testament
  const filteredEras = useMemo(() => {
    let eras = allEras;
    
    if (selectedTestament !== 'ALL') {
      eras = eras.filter(era => era.testament === selectedTestament);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      eras = eras.filter(era =>
        era.name.toLowerCase().includes(lowerQuery) ||
        era.events.some(event =>
          event.event.toLowerCase().includes(lowerQuery) ||
          event.description.toLowerCase().includes(lowerQuery)
        )
      );
    }

    return eras;
  }, [allEras, selectedTestament, searchQuery]);

  const toggleEra = (eraName: string) => {
    setExpandedEra(expandedEra === eraName ? null : eraName);
  };

  const navigateToEventDetail = (eventId: string) => {
    navigation.navigate('TimelineEventDetail', { eventId });
  };

  const navigateToBibleReference = (reference: string) => {
    // Parse reference like "Génesis 1:1" or "Éxodo 12:1-14"
    try {
      const parts = reference.split(/[:\-]/);
      const bookAndChapter = parts[0].trim();
      const lastSpace = bookAndChapter.lastIndexOf(' ');
      const bookName = bookAndChapter.substring(0, lastSpace).trim();
      const chapter = parseInt(bookAndChapter.substring(lastSpace + 1));
      const verse = parts[1] ? parseInt(parts[1].trim()) : 1;

      // Navigate to Bible screen with the parsed reference
      navigation.navigate('BibleReader', {
        bookName,
        chapter,
        verse,
      });
    } catch (error) {
      console.error('Error parsing Bible reference:', reference, error);
      // Fallback: just navigate to Bible screen
      navigation.navigate('BibleReader');
    }
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: { [key: string]: string } = {
      covenant: '#FFD700',
      miracle: '#00F3FF',
      conflict: '#FF4444',
      birth: '#00FF88',
      prophecy: '#9B59B6',
      death: '#95A5A6',
      revelation: '#F39C12',
      default: '#8B7355',
    };
    return colorMap[category] || colorMap.default;
  };

  const renderEra = (era: Era) => {
    const isExpanded = expandedEra === era.name;
    const dateRange = era.startYear && era.endYear
      ? `${era.startYear} - ${era.endYear} ${era.testament === 'OT' ? 'a.C.' : 'd.C.'}`
      : 'Fecha desconocida';

    return (
      <View key={era.name} style={styles.eraCard}>
        <TouchableOpacity
          style={styles.eraHeader}
          onPress={() => toggleEra(era.name)}
          activeOpacity={0.7}
        >
          <View style={styles.eraHeaderLeft}>
            <Ionicons name="book-outline" size={24} color="#8B4513" />
            <View style={styles.eraHeaderText}>
              <Text style={styles.eraName}>{era.name}</Text>
              <Text style={styles.eraDate}>{dateRange}</Text>
            </View>
          </View>
          <View style={styles.eraHeaderRight}>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>{era.eventCount} eventos</Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color="#8B4513"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.eventsContainer}>
            {era.events.map((event, index) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventItem,
                  index === era.events.length - 1 && styles.eventItemLast,
                ]}
                onPress={() => navigateToEventDetail(event.id)}
                activeOpacity={0.7}
              >
                <View style={styles.eventDateCircle}>
                  <Text style={styles.eventDateYear}>
                    {event.yearBC ? event.yearBC : event.yearAD}
                  </Text>
                  <Text style={styles.eventDateEra}>
                    {event.yearBC ? 'a.C.' : 'd.C.'}
                  </Text>
                </View>

                <View style={styles.eventContent}>
                  <View style={styles.eventTitleRow}>
                    <Text style={styles.eventTitle} numberOfLines={2}>
                      {event.event}
                    </Text>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: getCategoryColor(event.category) },
                      ]}
                    />
                  </View>

                  <View style={styles.eventPersons}>
                    {event.keyPersons.slice(0, 3).map((person, idx) => (
                      <View key={idx} style={styles.personChip}>
                        <Text style={styles.personChipText}>{person}</Text>
                      </View>
                    ))}
                    {event.keyPersons.length > 3 && (
                      <Text style={styles.morePersons}>
                        +{event.keyPersons.length - 3}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity 
                    style={styles.eventReference}
                    onPress={() => navigateToBibleReference(event.reference)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="book" size={14} color="#8B7355" />
                    <Text style={[styles.eventReferenceText, styles.clickableReference]}>{event.reference}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#8B7355" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#5D4E37" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Cronología Bíblica</Text>
          <Text style={styles.headerSubtitle}>
            {TimelineService.getMetadata().timeSpan}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8B7355" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar eventos, personas..."
          placeholderTextColor="#A0826D"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#8B7355" />
          </TouchableOpacity>
        )}
      </View>

      {/* Testament Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedTestament === 'ALL' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedTestament('ALL')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedTestament === 'ALL' && styles.filterButtonTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedTestament === 'OT' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedTestament('OT')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedTestament === 'OT' && styles.filterButtonTextActive,
            ]}
          >
            Antiguo Testamento
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedTestament === 'NT' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedTestament('NT')}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedTestament === 'NT' && styles.filterButtonTextActive,
            ]}
          >
            Nuevo Testamento
          </Text>
        </TouchableOpacity>
      </View>

      {/* Eras List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredEras.length > 0 ? (
          filteredEras.map(era => renderEra(era))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#D4C4B0" />
            <Text style={styles.emptyStateText}>No se encontraron eventos</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EFE7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#E8DCC4',
    borderBottomWidth: 2,
    borderBottomColor: '#C4A57B',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D4E37',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4C4B0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#5D4E37',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C4A57B',
    backgroundColor: '#FFF',
  },
  filterButtonActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  eraCard: {
    backgroundColor: '#FFF9F0',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4C4B0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  eraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  eraHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eraHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  eraName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4E37',
    fontFamily: 'serif',
  },
  eraDate: {
    fontSize: 13,
    color: '#8B7355',
    marginTop: 2,
  },
  eraHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventBadge: {
    backgroundColor: '#E8DCC4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventBadgeText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
  },
  eventsContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#FFF9F0',
  },
  eventItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC4',
  },
  eventItemLast: {
    borderBottomWidth: 0,
  },
  eventDateCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#C4A57B',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDateYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4E37',
  },
  eventDateEra: {
    fontSize: 11,
    color: '#8B7355',
  },
  eventContent: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D4E37',
    flex: 1,
    marginRight: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  eventPersons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  personChip: {
    backgroundColor: '#E8DCC4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  personChipText: {
    fontSize: 11,
    color: '#8B4513',
  },
  morePersons: {
    fontSize: 11,
    color: '#8B7355',
    alignSelf: 'center',
  },
  eventReference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventReferenceText: {
    fontSize: 12,
    color: '#8B7355',
    fontStyle: 'italic',
  },
  clickableReference: {
    textDecorationLine: 'underline',
    color: '#8B4513',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#A0826D',
    marginTop: 16,
  },
});

export default TimelineScreen;
