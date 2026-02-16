import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ReadingPlanService from '../services/ReadingPlanService';
import { UserReadingPlan, ReadingPlanStats } from '../types/readingPlan';

const ReadingPlanSettingsScreen = () => {
  const navigation = useNavigation();
  const [userPlan, setUserPlan] = useState<UserReadingPlan | null>(null);
  const [stats, setStats] = useState<ReadingPlanStats | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const plan = await ReadingPlanService.getUserPlan();
      const statistics = await ReadingPlanService.getStats();
      
      if (plan) {
        setUserPlan(plan);
        setReminderEnabled(plan.reminderEnabled);
        
        // Parse reminder time
        const [hours, minutes] = plan.reminderTime.split(':');
        const time = new Date();
        time.setHours(parseInt(hours, 10));
        time.setMinutes(parseInt(minutes, 10));
        setReminderTime(time);
      }
      
      setStats(statistics);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    try {
      setReminderEnabled(value);
      const timeString = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;
      await ReadingPlanService.updateReminderSettings(value, timeString);
    } catch (error: any) {
      alert(error.message || 'Error al actualizar recordatorio');
    }
  };

  const handleTimeChange = async (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      setReminderTime(selectedTime);
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      
      try {
        await ReadingPlanService.updateReminderSettings(reminderEnabled, timeString);
      } catch (error: any) {
        alert(error.message || 'Error al actualizar hora');
      }
    }
  };

  const handleResetPlan = () => {
    Alert.alert(
      'Reiniciar Plan',
      '¿Estás seguro de que quieres reiniciar tu plan de lectura? Perderás todo tu progreso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ReadingPlanService.resetPlan();
              navigation.goBack();
            } catch (error: any) {
              alert(error.message || 'Error al reiniciar plan');
            }
          },
        },
      ]
    );
  };

  const getPlanTypeName = (planType: string) => {
    return planType === 'chronological' ? 'Cronológico' : 'Canónico';
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Plan Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Actual</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo de Plan:</Text>
              <Text style={styles.infoValue}>
                {userPlan ? getPlanTypeName(userPlan.planType) : '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Progreso:</Text>
              <Text style={styles.infoValue}>
                {stats?.completedDays || 0}/365 días ({stats?.progressPercentage || 0}%)
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Racha Actual:</Text>
              <Text style={styles.infoValue}>{stats?.currentStreak || 0} días</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Racha Más Larga:</Text>
              <Text style={styles.infoValue}>{stats?.longestStreak || 0} días</Text>
            </View>
          </View>

          {userPlan?.isLocked && (
            <View style={styles.lockedBanner}>
              <Ionicons name="lock-closed" size={16} color="#FFB800" />
              <Text style={styles.lockedText}>
                Plan bloqueado. No puedes cambiar de plan durante el año.
              </Text>
            </View>
          )}
        </View>

        {/* Reminder Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recordatorio Diario</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Activar Recordatorio</Text>
              <Text style={styles.settingDescription}>
                Recibe una notificación diaria para leer la Biblia
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: '#1A2638', true: '#00F3FF' }}
              thumbColor={reminderEnabled ? '#FFFFFF' : '#B0B0B0'}
            />
          </View>

          {reminderEnabled && (
            <TouchableOpacity
              style={styles.timeSelector}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={24} color="#00F3FF" />
              <Text style={styles.timeText}>
                {reminderTime.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
            </TouchableOpacity>
          )}

          {showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zona de Peligro</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleResetPlan}>
            <Ionicons name="refresh" size={20} color="#FF4444" />
            <Text style={styles.dangerButtonText}>Reiniciar Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#1A2638',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3648',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3648',
  },
  infoLabel: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2410',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  lockedText: {
    fontSize: 12,
    color: '#FFB800',
    marginLeft: 8,
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A2638',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3648',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2638',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2A3648',
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A1616',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4444',
    marginLeft: 8,
  },
});

export default ReadingPlanSettingsScreen;
