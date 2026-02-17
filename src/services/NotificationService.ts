import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // For Android, create notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reading-plan', {
          name: 'Plan de Lectura',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00F3FF',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule daily reading reminder
   * @param hour Hour of the day (0-23)
   * @param minute Minute of the hour (0-59)
   */
  async scheduleDailyReminder(hour: number, minute: number): Promise<string | null> {
    try {
      // Cancel existing reminders first
      await this.cancelAllReminders();

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permission not granted');
      }

      // Schedule daily notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 Lectura Bíblica Diaria',
          body: 'Es hora de leer tu plan de estudio bíblico. ¡No pierdas tu racha!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: 'reading_plan_reminder' },
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      console.log('Daily reminder scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return null;
    }
  }

  /**
   * Cancel daily reading reminder specifically
   */
  async cancelDailyReminder(): Promise<void> {
    try {
      // Get all scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find and cancel reading plan reminders
      for (const notification of scheduled) {
        if (notification.content.data?.type === 'reading_plan_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log('Daily reminder cancelled:', notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error cancelling daily reminder:', error);
    }
  }

  /**
   * Cancel all scheduled reminders
   */
  async cancelAllReminders(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All reminders cancelled');
    } catch (error) {
      console.error('Error cancelling reminders:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Send immediate test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Recordatorio Configurado',
          body: 'Recibirás una notificación diaria a la hora seleccionada',
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

export default new NotificationService();
