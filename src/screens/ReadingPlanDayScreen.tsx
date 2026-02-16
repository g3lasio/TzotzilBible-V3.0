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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import ReadingPlanService from '../services/ReadingPlanService';
import { DayReading } from '../types/readingPlan';

const ReadingPlanDayScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { day } = route.params as { day: number };

  const [loading, setLoading] = useState(true);
  const [dayReading, setDayReading] = useState<DayReading | null>(null);
  const [completing, setCompleting] = useState(false);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState({ read: 0, total: 0, chapters: [] as string[] });

  useEffect(() => {
    loadDayReading();
  }, [day]);

  // Check if user returned from Bible reading
  useFocusEffect(
    React.useCallback(() => {
      // Check if user came back from Bible reading
      const checkReadingStatus = async () => {
        const status = await ReadingPlanService.getReadingStatus(day);
        if (status && status.hasVisitedBible) {
          setHasStartedReading(true);
        }
        
        // Update reading progress
        const progress = await ReadingPlanService.getReadingProgress(day);
        setReadingProgress(progress);
      };
      checkReadingStatus();
    }, [day])
  );

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

  const handleStartReading = async () => {
    if (!dayReading || dayReading.readings.length === 0) return;

    // Mark that user has started reading
    await ReadingPlanService.markReadingStarted(day);
    setHasStartedReading(true);

    // Navigate to Bible with the first reading
    const firstReading = dayReading.readings[0];
    
    // Navigate to Verses screen directly with the reading
    navigation.navigate('Verses' as never, {
      book: firstReading.book,
      chapter: firstReading.startChapter,
      fromReadingPlan: true,
      planDay: day,
      totalChapters: firstReading.endChapter - firstReading.startChapter + 1,
    } as never);
  };

  const handleMarkCompleted = async () => {
    if (!hasStartedReading) {
      alert('Por favor, completa la lectura antes de marcar como completado.');
      return;
    }

    // Check if all chapters have been read
    const allChaptersRead = await ReadingPlanService.hasCompletedAllChapters(day);
    if (!allChaptersRead) {
      const progress = await ReadingPlanService.getReadingProgress(day);
      alert(`Debes leer todos los capítulos asignados. Progreso: ${progress.read}/${progress.total} capítulos leídos.`);
      return;
    }

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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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

        {/* Reading Progress Indicator */}
        {hasStartedReading && readingProgress.total > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progreso de Lectura</Text>
              <Text style={styles.progressText}>
                {readingProgress.read}/{readingProgress.total} capítulos
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${(readingProgress.read / readingProgress.total) * 100}%` }
                ]} 
              />
            </View>
            {readingProgress.read === readingProgress.total && (
              <View style={styles.completionBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#00FF88" />
                <Text style={styles.completionText}>¡Todos los capítulos leídos!</Text>
              </View>
            )}
          </View>
        )}

        {/* Start Reading Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartReading}>
          <Text style={styles.startButtonText}>Comenzar Lectura</Text>
          <Ionicons name="arrow-forward" size={20} color="#0A1628" />
        </TouchableOpacity>

        {/* Mark Completed Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            !hasStartedReading && styles.completeButtonDisabled,
          ]}
          onPress={handleMarkCompleted}
          disabled={completing || !hasStartedReading}
        >
          {completing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={hasStartedReading ? "#FFFFFF" : "#666666"} 
              />
              <Text style={[
                styles.completeButtonText,
                !hasStartedReading && styles.completeButtonTextDisabled,
              ]}>
                {hasStartedReading ? 'Marcar como Completado' : 'Completa la lectura primero'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom padding to ensure content is not hidden by tabs */}
        <View style={{ height: 80 }} />
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
  },
  contentContainer: {
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
  progressContainer: {
    backgroundColor: '#1A2638',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A3648',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00F3FF',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#0A1628',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F3FF',
    borderRadius: 4,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 8,
  },
  completionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00FF88',
    marginLeft: 6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F3FF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#00F3FF',
  },
  completeButtonDisabled: {
    borderColor: '#333333',
    opacity: 0.5,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  completeButtonTextDisabled: {
    color: '#666666',
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
