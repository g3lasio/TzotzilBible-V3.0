import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share as RNShare,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TimelineService from '../services/TimelineService';
import { TimelineEvent } from '../types/timeline';

interface TimelineEventDetailScreenProps {
  navigation: any;
  route: {
    params: {
      eventId: string;
    };
  };
}

const TimelineEventDetailScreen: React.FC<TimelineEventDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { eventId } = route.params;

  const event = useMemo(() => TimelineService.getEventById(eventId), [eventId]);
  const relatedEvents = useMemo(
    () => TimelineService.getRelatedEvents(eventId, 5),
    [eventId]
  );

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#2A3648" />
          <Text style={styles.errorText}>Evento no encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      const message = `${event.event}\n\n${event.description}\n\nFecha: ${event.dateDisplay}\nReferencia: ${event.reference}`;
      await RNShare.share({
        message,
        title: event.event,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const handleVersePress = (verseRef: string) => {
    // Navigate to Bible screen with verse reference
    // TODO: Parse verse reference and navigate
    console.log('Navigate to verse:', verseRef);
  };

  const getCertaintyLabel = (level: string): string => {
    const labels: { [key: string]: string } = {
      tradicional: 'Cronología Tradicional',
      histórico: 'Histórico',
      arqueológico: 'Arqueológico',
    };
    return labels[level] || level;
  };

  const getCertaintyColor = (level: string): string => {
    const colors: { [key: string]: string } = {
      tradicional: '#9B59B6',
      histórico: '#3498DB',
      arqueológico: '#27AE60',
    };
    return colors[level] || '#95A5A6';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#E0E6ED" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Evento Bíblico
        </Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#E0E6ED" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Date Badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{event.dateDisplay}</Text>
        </View>

        {/* Event Title */}
        <Text style={styles.eventTitle}>{event.event}</Text>

        {/* Era and Testament */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color="#A0A8B0" />
            <Text style={styles.metaText}>{event.era}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="book-outline" size={16} color="#A0A8B0" />
            <Text style={styles.metaText}>
              {event.testament === 'OT' ? 'Antiguo Testamento' : 'Nuevo Testamento'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Key Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Clave</Text>

          {/* Persons */}
          {event.keyPersons.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Personas:</Text>
              <View style={styles.personsList}>
                {event.keyPersons.map((person, idx) => (
                  <View key={idx} style={styles.personChip}>
                    <Ionicons name="person" size={12} color="#00F3FF" />
                    <Text style={styles.personChipText}>{person}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Location */}
          {event.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ubicación:</Text>
              <View style={styles.locationChip}>
                <Ionicons name="location" size={14} color="#00F3FF" />
                <Text style={styles.locationText}>{event.location}</Text>
              </View>
            </View>
          )}

          {/* Certainty Level */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Certeza:</Text>
            <View
              style={[
                styles.certaintyBadge,
                { backgroundColor: getCertaintyColor(event.certaintyLevel) },
              ]}
            >
              <Text style={styles.certaintyText}>
                {getCertaintyLabel(event.certaintyLevel)}
              </Text>
            </View>
          </View>
        </View>

        {/* Significance */}
        {event.significance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Significado</Text>
            <Text style={styles.significance}>{event.significance}</Text>
          </View>
        )}

        {/* Biblical References */}
        {event.relatedVerses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referencias Bíblicas</Text>
            {event.relatedVerses.map((verse, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.verseItem}
                onPress={() => handleVersePress(verse)}
              >
                <Ionicons name="book" size={16} color="#00F3FF" />
                <Text style={styles.verseText}>{verse}</Text>
                <Ionicons name="chevron-forward" size={16} color="#2A3648" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eventos Relacionados</Text>
            {relatedEvents.map((relatedEvent) => (
              <TouchableOpacity
                key={relatedEvent.id}
                style={styles.relatedEventItem}
                onPress={() => {
                  navigation.push('TimelineEventDetail', { eventId: relatedEvent.id });
                }}
              >
                <View style={styles.relatedEventDate}>
                  <Text style={styles.relatedEventDateText}>
                    {relatedEvent.dateDisplay}
                  </Text>
                </View>
                <View style={styles.relatedEventContent}>
                  <Text style={styles.relatedEventTitle} numberOfLines={2}>
                    {relatedEvent.event}
                  </Text>
                  <Text style={styles.relatedEventEra}>{relatedEvent.era}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#2A3648" />
              </TouchableOpacity>
            ))}
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
    backgroundColor: '#0A1628',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1A2638',
    borderBottomWidth: 2,
    borderBottomColor: '#2A3648',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E6ED',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  scrollView: {
    flex: 1,
  },
  dateBadge: {
    alignSelf: 'center',
    backgroundColor: '#00F3FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  dateBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2638',
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E0E6ED',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    fontFamily: 'serif',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#A0A8B0',
  },
  section: {
    backgroundColor: '#1A2638',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3648',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E6ED',
    marginBottom: 12,
    fontFamily: 'serif',
  },
  description: {
    fontSize: 15,
    color: '#E0E6ED',
    lineHeight: 24,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A0A8B0',
    marginBottom: 6,
  },
  personsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2638',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  personChipText: {
    fontSize: 13,
    color: '#00F3FF',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#E0E6ED',
  },
  certaintyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  certaintyText: {
    fontSize: 13,
    color: '#1A2638',
    fontWeight: '600',
  },
  significance: {
    fontSize: 15,
    color: '#E0E6ED',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  verseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#1A2638',
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  verseText: {
    flex: 1,
    fontSize: 14,
    color: '#00F3FF',
    fontWeight: '500',
  },
  relatedEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1A2638',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  relatedEventDate: {
    backgroundColor: '#1A2638',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relatedEventDateText: {
    fontSize: 11,
    color: '#00F3FF',
    fontWeight: '600',
  },
  relatedEventContent: {
    flex: 1,
  },
  relatedEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E6ED',
    marginBottom: 2,
  },
  relatedEventEra: {
    fontSize: 12,
    color: '#A0A8B0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#A0826D',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#00F3FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1A2638',
    fontWeight: '600',
  },
});

export default TimelineEventDetailScreen;
