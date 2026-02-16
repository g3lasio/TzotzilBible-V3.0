import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ReadingPlanService from '../services/ReadingPlanService';
import { DayReading } from '../types/readingPlan';

const ReadingPlanDayScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { day } = route.params as { day: number };

  const [loading, setLoading] = useState(true);
  const [dayReading, setDayReading] = useState<DayReading | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadDayReading();
  }, [day]);

  const loadDayReading = async () => {
    try {
      setLoading(true);
      const reading = await ReadingPlanService.getDayReading(day);
      setDayReading(reading);
    } catch (error) {
      console.error('Error loading day reading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReading = () => {
    if (!dayReading || dayReading.readings.length === 0) return;

    // Navigate to BibleReader with the first reading
    const firstReading = dayReading.readings[0];
    navigation.navigate('BibleReader' as never, {
      book: firstReading.book,
      chapter: firstReading.startChapter,
      fromReadingPlan: true,
      planDay: day,
    } as never);
  };

  const handleMarkCompleted = async () => {
    try {
      setCompleting(true);
      await ReadingPlanService.markDayCompleted(day);
      
      // Show success message
      alert('¡Día completado! 🎉');
      
      // Go back to plan screen
      navigation.goBack();
    } catch (error: any) {
      alert(error.message || 'Error al marcar como completado');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F3FF" />
      </View>
    );
  }

  if (!dayReading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Día {day}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró la lectura para este día</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Día {day}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Lectura del Día</Text>

        {/* Readings List */}
        {dayReading.readings.map((reading, index) => (
          <View key={index} style={styles.readingCard}>
            <View style={styles.readingIconContainer}>
              <Ionicons name="book" size={24} color="#00F3FF" />
            </View>
            <View style={styles.readingInfo}>
              <Text style={styles.readingBook}>{reading.book}</Text>
              <Text style={styles.readingChapters}>
                {reading.startChapter === reading.endChapter
                  ? `Capítulo ${reading.startChapter}`
                  : `Capítulos ${reading.startChapter}-${reading.endChapter}`}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.instructionsBox}>
          <Ionicons name="information-circle" size={20} color="#00F3FF" />
          <Text style={styles.instructionsText}>
            Presiona "Comenzar Lectura" para abrir la Biblia. Una vez que termines de leer, regresa aquí y marca el día como completado.
          </Text>
        </View>

        {/* Start Reading Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartReading}>
          <Text style={styles.startButtonText}>Comenzar Lectura</Text>
          <Ionicons name="arrow-forward" size={20} color="#0A1628" />
        </TouchableOpacity>

        {/* Mark Completed Button */}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleMarkCompleted}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Marcar como Completado</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2638',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  readingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2638',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A3648',
  },
  readingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  readingInfo: {
    flex: 1,
  },
  readingBook: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  readingChapters: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F1F35',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  instructionsText: {
    fontSize: 14,
    color: '#B0B0B0',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A1628',
    marginRight: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2638',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#00F3FF',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
  },
});

export default ReadingPlanDayScreen;
