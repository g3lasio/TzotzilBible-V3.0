import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ReadingPlanService from '../services/ReadingPlanService';
import { DayProgress, ReadingPlanStats, PlanType } from '../types/readingPlan';

const ReadingPlanScreen = () => {
  const navigation = useNavigation();
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
      // Already completed, do nothing or show message
      return;
    }
    
    // Navigate to reading screen for this day
    navigation.navigate('ReadingPlanDay' as never, { day: day.day } as never);
  };

  const handleSettingsPress = () => {
    navigation.navigate('ReadingPlanSettings' as never);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00F3FF" />
      </View>
    );
  }

  // Plan Selection Screen (if no active plan)
  if (!hasActivePlan) {
    return (
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan de Estudio</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.welcomeTitle}>Comienza tu Viaje Bíblico</Text>
          <Text style={styles.welcomeSubtitle}>
            Elige un plan de lectura para leer toda la Biblia en un año
          </Text>

          {/* Plan Options */}
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
                Lee la Biblia de Génesis a Apocalipsis en orden tradicional
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#00F3FF" />
          </TouchableOpacity>

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
                Lee la Biblia en el orden en que los eventos ocurrieron históricamente
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#00F3FF" />
          </TouchableOpacity>

          <View style={styles.warningBox}>
            <Ionicons name="lock-closed" size={20} color="#FFB800" />
            <Text style={styles.warningText}>
              Una vez que inicies un plan, no podrás cambiarlo durante el año
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Active Plan Screen (Proposal 2 Design)
  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plan de Estudio</Text>
        <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#00F3FF" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${stats?.progressPercentage || 0}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {stats?.completedDays || 0}/365 días ({stats?.progressPercentage || 0}%)
        </Text>
      </View>

      {/* Days List */}
      <FlatList
        data={daysProgress}
        keyExtractor={(item) => `day-${item.day}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.dayItem,
              item.day === stats?.currentDay && !item.isCompleted && styles.dayItemCurrent,
            ]}
            onPress={() => handleDayPress(item)}
            disabled={item.isCompleted}
          >
            {/* Checkbox */}
            <View style={[styles.checkbox, item.isCompleted && styles.checkboxCompleted]}>
              {item.isCompleted && <Ionicons name="checkmark" size={18} color="#0A1628" />}
            </View>

            {/* Day Info */}
            <View style={styles.dayInfo}>
              <Text style={[styles.dayText, item.isCompleted && styles.dayTextCompleted]}>
                Día {item.day}: {item.readings.map(r => {
                  if (r.startChapter === r.endChapter) {
                    return `${r.book} ${r.startChapter}`;
                  } else {
                    return `${r.book} ${r.startChapter}-${r.endChapter}`;
                  }
                }).join(', ')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 32,
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
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2410',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#FFB800',
    marginLeft: 8,
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2638',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#1A2638',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00F3FF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingBottom: 100, // Add padding to prevent bottom tabs from hiding content
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2638',
  },
  dayItemCurrent: {
    backgroundColor: '#0F1F35',
    borderWidth: 2,
    borderColor: '#00F3FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#00F3FF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#00F3FF',
    borderColor: '#00F3FF',
  },
  dayInfo: {
    flex: 1,
  },
  dayText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dayTextCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  flatList: {
    flex: 1,
  },
});

export default ReadingPlanScreen;
