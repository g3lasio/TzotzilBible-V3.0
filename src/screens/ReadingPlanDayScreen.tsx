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
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  NavigationProp,
  RouteProp,
} from '@react-navigation/native';
import ReadingPlanService from '../services/ReadingPlanService';
import { DayReading } from '../types/readingPlan';
import { RootStackParamList } from '../types/navigation';
import { translateBookName } from '../constants/bookNameMapping';

const ReadingPlanDayScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ReadingPlanDay'>>();
  const { day } = route.params;

  const [loading, setLoading] = useState(true);
  const [dayReading, setDayReading] = useState<DayReading | null>(null);
  const [completing, setCompleting] = useState(false);
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [readingProgress, setReadingProgress] = useState({
    read: 0,
    total: 0,
    chapters: [] as string[],
  });
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

  useEffect(() => {
    loadDayReading();
  }, [day]);

  // Refresh progress whenever the user returns from the Bible screen
  useFocusEffect(
    React.useCallback(() => {
      const checkStatus = async () => {
        const status = await ReadingPlanService.getReadingStatus(day);
        if (status?.hasVisitedBible) {
          setHasStartedReading(true);
        }
        const progress = await ReadingPlanService.getReadingProgress(day);
        setReadingProgress(progress);

        // Check if this day is already completed
        const userPlan = await ReadingPlanService.getUserPlan();
        if (userPlan) {
          setIsAlreadyCompleted(userPlan.completedDays.includes(day));
        }
      };
      checkStatus();
    }, [day])
  );

  const loadDayReading = async () => {
    try {
      setLoading(true);
      await ReadingPlanService.loadPlans();
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

    await ReadingPlanService.markReadingStarted(day);
    setHasStartedReading(true);

    const firstReading = dayReading.readings[0];
    const bookNameSpanish = translateBookName(firstReading.book);

    navigation.navigate('MainTabs', {
      screen: 'BibleTab',
      params: {
        screen: 'Verses',
        params: {
          book: bookNameSpanish,
          chapter: firstReading.startChapter,
          fromReadingPlan: true,
          planDay: day,
          totalChapters: firstReading.endChapter - firstReading.startChapter + 1,
        },
      },
    });
  };

  const handleMarkCompleted = async () => {
    if (!hasStartedReading) {
      alert('Por favor, comienza la lectura antes de marcar como completado.');
      return;
    }

    const allChaptersRead = await ReadingPlanService.hasCompletedAllChapters(day);
    if (!allChaptersRead) {
      const progress = await ReadingPlanService.getReadingProgress(day);
      alert(
        `Debes leer todos los capítulos asignados.\nProgreso: ${progress.read}/${progress.total} capítulos leídos.`
      );
      return;
    }

    try {
      setCompleting(true);
      await ReadingPlanService.markDayCompleted(day);
      alert('¡Día completado! 🎉');
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

  const progressPercent =
    readingProgress.total > 0
      ? Math.round((readingProgress.read / readingProgress.total) * 100)
      : 0;
  const allRead = readingProgress.read > 0 && readingProgress.read === readingProgress.total;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Día {day}</Text>
        {isAlreadyCompleted ? (
          <View style={styles.completedBadgeHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#00FF88" />
          </View>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>Lectura del Día</Text>

        {/* Already completed notice */}
        {isAlreadyCompleted && (
          <View style={styles.completedNotice}>
            <Ionicons name="checkmark-circle" size={18} color="#00FF88" />
            <Text style={styles.completedNoticeText}>
              Este día ya está completado. Puedes releerlo cuando quieras.
            </Text>
          </View>
        )}

        {/* Reading Cards — show Spanish book names */}
        {dayReading.readings.map((reading, index) => {
          const bookSpanish = translateBookName(reading.book);
          const chapterLabel =
            reading.startChapter === reading.endChapter
              ? `Capítulo ${reading.startChapter}`
              : `Capítulos ${reading.startChapter}–${reading.endChapter}`;
          const chapterCount = reading.endChapter - reading.startChapter + 1;

          return (
            <View key={index} style={styles.readingCard}>
              <View style={styles.readingIconContainer}>
                <Ionicons name="book" size={24} color="#00F3FF" />
              </View>
              <View style={styles.readingInfo}>
                <Text style={styles.readingBook}>{bookSpanish}</Text>
                <Text style={styles.readingChapters}>{chapterLabel}</Text>
                <Text style={styles.readingMeta}>
                  {chapterCount} {chapterCount === 1 ? 'capítulo' : 'capítulos'}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Instructions */}
        {!isAlreadyCompleted && (
          <View style={styles.instructionsBox}>
            <Ionicons name="information-circle" size={20} color="#00F3FF" />
            <Text style={styles.instructionsText}>
              Presiona "Comenzar Lectura" para abrir la Biblia. Cuando termines, regresa aquí
              y marca el día como completado.
            </Text>
          </View>
        )}

        {/* Reading Progress */}
        {hasStartedReading && readingProgress.total > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progreso de Lectura</Text>
              <Text style={styles.progressCount}>
                {readingProgress.read}/{readingProgress.total} cap.
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              />
            </View>
            {allRead && (
              <View style={styles.completionBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#00FF88" />
                <Text style={styles.completionText}>¡Todos los capítulos leídos!</Text>
              </View>
            )}
          </View>
        )}

        {/* Start Reading Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartReading}>
          <Ionicons name="book-outline" size={20} color="#0A1628" />
          <Text style={styles.startButtonText}>
            {hasStartedReading ? 'Continuar Lectura' : 'Comenzar Lectura'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#0A1628" />
        </TouchableOpacity>

        {/* Mark Completed Button */}
        {!isAlreadyCompleted && (
          <TouchableOpacity
            style={[
              styles.completeButton,
              (!hasStartedReading || !allRead) && styles.completeButtonDisabled,
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
                  color={hasStartedReading && allRead ? '#FFFFFF' : '#666666'}
                />
                <Text
                  style={[
                    styles.completeButtonText,
                    (!hasStartedReading || !allRead) && styles.completeButtonTextDisabled,
                  ]}
                >
                  {!hasStartedReading
                    ? 'Completa la lectura primero'
                    : allRead
                    ? 'Marcar como Completado'
                    : `Faltan ${readingProgress.total - readingProgress.read} capítulos`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
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
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedBadgeHeader: { padding: 4 },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 120 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  completedNoticeText: {
    fontSize: 13,
    color: '#00FF88',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
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
  readingInfo: { flex: 1 },
  readingBook: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  readingChapters: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 2,
  },
  readingMeta: {
    fontSize: 12,
    color: '#00F3FF',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F1F35',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 13,
    color: '#B0B0B0',
    marginLeft: 8,
    flex: 1,
    lineHeight: 19,
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
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressCount: {
    fontSize: 13,
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
    backgroundColor: 'rgba(0,255,136,0.1)',
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
    marginBottom: 14,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A1628',
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
    gap: 8,
  },
  completeButtonDisabled: {
    borderColor: '#333333',
    opacity: 0.5,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
