import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import ReadingPlanService from '../services/ReadingPlanService';
import { DayProgress, ReadingPlanStats, PlanType } from '../types/readingPlan';
import { RootStackParamList } from '../types/navigation';

const ReadingPlanScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const flatListRef = useRef<FlatList>(null);

  const [loading, setLoading] = useState(true);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [daysProgress, setDaysProgress] = useState<DayProgress[]>([]);
  const [stats, setStats] = useState<ReadingPlanStats | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType>('canonical');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await ReadingPlanService.loadPlans();

      const userPlan = await ReadingPlanService.getUserPlan();
      if (userPlan) {
        setHasActivePlan(true);
        setSelectedPlanType(userPlan.planType);
        const progress = await ReadingPlanService.getAllDaysProgress();
        const statistics = await ReadingPlanService.getStats();
        setDaysProgress(progress);
        setStats(statistics);
      } else {
        setHasActivePlan(false);
      }
    } catch (error) {
      console.error('Error loading reading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlan = async (planType: PlanType) => {
    try {
      await ReadingPlanService.initializeUserPlan(planType, '07:00');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Error al iniciar el plan');
    }
  };

  const handleDayPress = (day: DayProgress) => {
    if (day.isCompleted) {
      navigation.navigate('ReadingPlanDay', { day: day.day });
      return;
    }

    // Future days are locked — user must complete in order
    if (stats && day.day > stats.currentDay) {
      alert(`Este día está bloqueado. Completa el Día ${stats.currentDay} primero.`);
      return;
    }

    navigation.navigate('ReadingPlanDay', { day: day.day });
  };

  const handleSettingsPress = () => {
    navigation.navigate('ReadingPlanSettings');
  };

  const scrollToCurrentDay = () => {
    if (!stats || !flatListRef.current) return;
    const index = daysProgress.findIndex(d => d.day === stats.currentDay);
    if (index >= 0) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    }
  };

  const formatReadings = (readings: DayProgress['readings']) =>
    readings
      .map(r =>
        r.startChapter === r.endChapter
          ? `${r.book} ${r.startChapter}`
          : `${r.book} ${r.startChapter}–${r.endChapter}`
      )
      .join(', ');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F3FF" />
      </View>
    );
  }

  // ─── Plan Selection Screen ────────────────────────────────────────────────
  if (!hasActivePlan) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan de Estudio</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.welcomeIconRow}>
            <Ionicons name="book" size={48} color="#00F3FF" />
          </View>
          <Text style={styles.welcomeTitle}>Comienza tu Viaje Bíblico</Text>
          <Text style={styles.welcomeSubtitle}>
            Elige un plan y lee toda la Biblia — los 1,189 capítulos — en 365 días.
            Puedes empezar en cualquier momento del año.
          </Text>

          {/* Canonical Plan */}
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => handleStartPlan('canonical')}
          >
            <View style={styles.planIconContainer}>
              <Ionicons name="book-outline" size={32} color="#00F3FF" />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>Plan Canónico</Text>
              <Text style={styles.planDescription}>
                Génesis → Apocalipsis en orden tradicional
              </Text>
              <Text style={styles.planMeta}>~3–4 capítulos por día</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#00F3FF" />
          </TouchableOpacity>

          {/* Chronological Plan */}
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => handleStartPlan('chronological')}
          >
            <View style={styles.planIconContainer}>
              <Ionicons name="time-outline" size={32} color="#00F3FF" />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>Plan Cronológico</Text>
              <Text style={styles.planDescription}>
                Lee los eventos en el orden histórico en que ocurrieron
              </Text>
              <Text style={styles.planMeta}>~3–4 capítulos por día</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#00F3FF" />
          </TouchableOpacity>

          <View style={styles.warningBox}>
            <Ionicons name="lock-closed" size={20} color="#FFB800" />
            <Text style={styles.warningText}>
              Una vez que inicies un plan, no podrás cambiarlo. Puedes saltarte días y
              retomar después — el plan nunca se bloquea.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Active Plan Screen ───────────────────────────────────────────────────
  const currentDayData = daysProgress.find(d => d.day === stats?.currentDay);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan de Estudio</Text>
        <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#00F3FF" />
        </TouchableOpacity>
      </View>

      {/* Today's Reading Card — prominent at top */}
      {currentDayData && stats && (
        <TouchableOpacity
          style={styles.todayCard}
          onPress={() => navigation.navigate('ReadingPlanDay', { day: stats.currentDay })}
          activeOpacity={0.85}
        >
          <View style={styles.todayCardLeft}>
            <Text style={styles.todayLabel}>LECTURA DE HOY</Text>
            <Text style={styles.todayDay}>Día {stats.currentDay} de {stats.totalDays}</Text>
            <Text style={styles.todayReadings} numberOfLines={2}>
              {formatReadings(currentDayData.readings)}
            </Text>
          </View>
          <View style={styles.todayCardRight}>
            <View style={styles.todayStartButton}>
              <Ionicons name="play" size={20} color="#0A1628" />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Progress Summary */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${stats?.progressPercentage || 0}%` }]}
          />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {stats?.completedDays || 0}/{stats?.totalDays || 365} días completados
          </Text>
          <Text style={styles.progressPercent}>{stats?.progressPercentage || 0}%</Text>
        </View>
        {(stats?.currentStreak ?? 0) > 1 && (
          <View style={styles.streakRow}>
            <Ionicons name="flame" size={14} color="#FF6B35" />
            <Text style={styles.streakText}>
              {stats?.currentStreak} días seguidos
            </Text>
          </View>
        )}
      </View>

      {/* Scroll-to-today button */}
      <TouchableOpacity style={styles.scrollTodayButton} onPress={scrollToCurrentDay}>
        <Ionicons name="locate" size={14} color="#00F3FF" />
        <Text style={styles.scrollTodayText}>Ir al día actual</Text>
      </TouchableOpacity>

      {/* Days List */}
      <FlatList
        ref={flatListRef}
        data={daysProgress}
        keyExtractor={item => `day-${item.day}`}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => {
          const isCurrent = item.day === stats?.currentDay && !item.isCompleted;
          const isLocked = !!(stats && item.day > stats.currentDay && !item.isCompleted);

          return (
            <TouchableOpacity
              style={[
                styles.dayItem,
                isCurrent && styles.dayItemCurrent,
                isLocked && styles.dayItemLocked,
              ]}
              onPress={() => handleDayPress(item)}
            >
              {/* Checkbox */}
              <View style={[styles.checkbox, item.isCompleted && styles.checkboxCompleted]}>
                {item.isCompleted ? (
                  <Ionicons name="checkmark" size={18} color="#0A1628" />
                ) : isLocked ? (
                  <Ionicons name="lock-closed" size={14} color="#666666" />
                ) : null}
              </View>

              {/* Day Info */}
              <View style={styles.dayInfo}>
                <Text
                  style={[
                    styles.dayText,
                    item.isCompleted && styles.dayTextCompleted,
                    isCurrent && styles.dayTextCurrent,
                  ]}
                >
                  Día {item.day}
                </Text>
                <Text
                  style={[styles.dayReadings, item.isCompleted && styles.dayReadingsCompleted]}
                  numberOfLines={1}
                >
                  {formatReadings(item.readings)}
                </Text>
              </View>

              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>HOY</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        style={styles.flatList}
      />
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
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: { padding: 4 },

  // ── Welcome Screen ──
  content: { flex: 1, padding: 20 },
  welcomeIconRow: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#B0B0B0',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2638',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3648',
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A1628',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: { flex: 1 },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 2,
  },
  planMeta: {
    fontSize: 12,
    color: '#00F3FF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A2410',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#FFB800',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },

  // ── Today Card ──
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F2040',
    borderWidth: 1.5,
    borderColor: '#00F3FF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    padding: 16,
  },
  todayCardLeft: { flex: 1 },
  todayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00F3FF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  todayDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  todayReadings: {
    fontSize: 13,
    color: '#B0C4D8',
    lineHeight: 18,
  },
  todayCardRight: {
    marginLeft: 12,
  },
  todayStartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Progress ──
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#1A2638',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F3FF',
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00F3FF',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  streakText: {
    fontSize: 12,
    color: '#FF6B35',
    marginLeft: 4,
    fontWeight: '600',
  },

  // ── Scroll-to-today ──
  scrollTodayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  scrollTodayText: {
    fontSize: 12,
    color: '#00F3FF',
    marginLeft: 4,
  },

  // ── Day List ──
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  flatList: { flex: 1 },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2638',
  },
  dayItemCurrent: {
    backgroundColor: '#0F1F35',
    borderWidth: 1.5,
    borderColor: '#00F3FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  dayItemLocked: { opacity: 0.35 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#00F3FF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxCompleted: {
    backgroundColor: '#00F3FF',
    borderColor: '#00F3FF',
  },
  dayInfo: { flex: 1 },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  dayTextCompleted: {
    color: '#4A5568',
    textDecorationLine: 'line-through',
  },
  dayTextCurrent: {
    color: '#00F3FF',
  },
  dayReadings: {
    fontSize: 12,
    color: '#8A9BB0',
  },
  dayReadingsCompleted: {
    color: '#3A4558',
  },
  currentBadge: {
    backgroundColor: '#00F3FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A1628',
    letterSpacing: 0.5,
  },
});

export default ReadingPlanScreen;
