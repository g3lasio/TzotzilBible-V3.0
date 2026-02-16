import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlanType,
  ReadingPlan,
  UserReadingPlan,
  DayProgress,
  ReadingPlanStats,
  DayReading,
} from '../types/readingPlan';
import NotificationService from './NotificationService';
import { translateBookName } from '../constants/bookNameMapping';

// Storage keys
const STORAGE_KEY_USER_PLAN = 'user_reading_plan';
const STORAGE_KEY_COMPLETED_DAYS = 'reading_plan_completed_days';
const STORAGE_KEY_READING_STATUS = 'reading_plan_reading_status';

class ReadingPlanService {
  private chronologicalPlan: ReadingPlan | null = null;
  private canonicalPlan: ReadingPlan | null = null;

  /**
   * Load reading plans from JSON files
   */
  async loadPlans(): Promise<void> {
    try {
      const chronological = require('../../assets/reading_plans/chronological_plan.json');
      const canonical = require('../../assets/reading_plans/canonical_plan.json');
      
      this.chronologicalPlan = chronological;
      this.canonicalPlan = canonical;
    } catch (error) {
      console.error('Error loading reading plans:', error);
      throw new Error('Failed to load reading plans');
    }
  }

  /**
   * Get a specific reading plan by type
   */
  getPlan(planType: PlanType): ReadingPlan | null {
    if (planType === 'chronological') {
      return this.chronologicalPlan;
    } else if (planType === 'canonical') {
      return this.canonicalPlan;
    }
    return null;
  }

  /**
   * Get all available plans
   */
  getAllPlans(): ReadingPlan[] {
    const plans: ReadingPlan[] = [];
    if (this.chronologicalPlan) plans.push(this.chronologicalPlan);
    if (this.canonicalPlan) plans.push(this.canonicalPlan);
    return plans;
  }

  /**
   * Initialize a new reading plan for the user
   */
  async initializeUserPlan(planType: PlanType, reminderTime: string = '07:00'): Promise<UserReadingPlan> {
    const existingPlan = await this.getUserPlan();
    
    // Check if plan is already locked
    if (existingPlan && existingPlan.isLocked) {
      throw new Error('Cannot change plan once started. Current plan is locked.');
    }

    const userPlan: UserReadingPlan = {
      id: Date.now().toString(),
      planType,
      startDate: new Date().toISOString(),
      currentDay: 1,
      completedDays: [],
      isLocked: true, // Lock immediately upon creation
      reminderEnabled: false,
      reminderTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY_USER_PLAN, JSON.stringify(userPlan));
    await AsyncStorage.setItem(STORAGE_KEY_COMPLETED_DAYS, JSON.stringify([]));

    return userPlan;
  }

  /**
   * Mark that user has started reading for a specific day
   */
  async markReadingStarted(day: number): Promise<void> {
    try {
      const statusJson = await AsyncStorage.getItem(STORAGE_KEY_READING_STATUS);
      const status = statusJson ? JSON.parse(statusJson) : {};
      status[day] = { 
        hasVisitedBible: true, 
        timestamp: new Date().toISOString(),
        chaptersRead: [] // Track which chapters have been read
      };
      await AsyncStorage.setItem(STORAGE_KEY_READING_STATUS, JSON.stringify(status));
    } catch (error) {
      console.error('Error marking reading started:', error);
    }
  }

  /**
   * Mark a specific chapter as read for a day
   */
  async markChapterRead(day: number, book: string, chapter: number): Promise<void> {
    try {
      const statusJson = await AsyncStorage.getItem(STORAGE_KEY_READING_STATUS);
      const status = statusJson ? JSON.parse(statusJson) : {};
      
      if (!status[day]) {
        status[day] = { 
          hasVisitedBible: true, 
          timestamp: new Date().toISOString(),
          chaptersRead: []
        };
      }
      
      const chapterKey = `${book}:${chapter}`;
      if (!status[day].chaptersRead) {
        status[day].chaptersRead = [];
      }
      
      if (!status[day].chaptersRead.includes(chapterKey)) {
        status[day].chaptersRead.push(chapterKey);
      }
      
      await AsyncStorage.setItem(STORAGE_KEY_READING_STATUS, JSON.stringify(status));
    } catch (error) {
      console.error('Error marking chapter read:', error);
    }
  }

  /**
   * Get chapters read for a specific day
   */
  async getChaptersReadForDay(day: number): Promise<string[]> {
    try {
      const statusJson = await AsyncStorage.getItem(STORAGE_KEY_READING_STATUS);
      if (!statusJson) return [];
      
      const status = JSON.parse(statusJson);
      const dayStatus = status[day];
      
      if (!dayStatus || !dayStatus.chaptersRead) return [];
      
      return dayStatus.chaptersRead;
    } catch (error) {
      console.error('Error getting chapters read:', error);
      return [];
    }
  }

  /**
   * Check if all required chapters for a day have been read
   */
  async hasCompletedAllChapters(day: number): Promise<boolean> {
    try {
      const dayReading = await this.getDayReading(day);
      if (!dayReading) return false;

      const statusJson = await AsyncStorage.getItem(STORAGE_KEY_READING_STATUS);
      if (!statusJson) return false;
      
      const status = JSON.parse(statusJson);
      const dayStatus = status[day];
      
      if (!dayStatus || !dayStatus.chaptersRead) return false;

      // Build list of required chapters
      const requiredChapters: string[] = [];
      dayReading.readings.forEach(reading => {
        const bookNameSpanish = translateBookName(reading.book);
        for (let ch = reading.startChapter; ch <= reading.endChapter; ch++) {
          requiredChapters.push(`${bookNameSpanish}:${ch}`);
        }
      });

      // Check if all required chapters have been read
      return requiredChapters.every(chapter => dayStatus.chaptersRead.includes(chapter));
    } catch (error) {
      console.error('Error checking chapters completion:', error);
      return false;
    }
  }

  /**
   * Get reading progress for a specific day (how many chapters read vs required)
   */
  async getReadingProgress(day: number): Promise<{ read: number; total: number; chapters: string[] }> {
    try {
      const dayReading = await this.getDayReading(day);
      if (!dayReading) return { read: 0, total: 0, chapters: [] };

      const statusJson = await AsyncStorage.getItem(STORAGE_KEY_READING_STATUS);
      const status = statusJson ? JSON.parse(statusJson) : {};
      const dayStatus = status[day];

      // Build list of required chapters
      const requiredChapters: string[] = [];
      dayReading.readings.forEach(reading => {
        const bookNameSpanish = translateBookName(reading.book);
        for (let ch = reading.startChapter; ch <= reading.endChapter; ch++) {
          requiredChapters.push(`${bookNameSpanish}:${ch}`);
        }
      });

      const chaptersRead = dayStatus?.chaptersRead || [];
      const readCount = requiredChapters.filter(ch => chaptersRead.includes(ch)).length;

      return {
        read: readCount,
        total: requiredChapters.length,
        chapters: requiredChapters
      };
    } catch (error) {
      console.error('Error getting reading progress:', error);
      return { read: 0, total: 0, chapters: [] };
    }
  }

  /**
   * Get reading status for a specific day
   */
  async getReadingStatus(day: number): Promise<{ hasVisitedBible: boolean; timestamp?: string } | null> {
    try {
      const statusJson = await AsyncStorage.getItem(STORAGE_KEY_READING_STATUS);
      if (!statusJson) return null;
      const status = JSON.parse(statusJson);
      return status[day] || null;
    } catch (error) {
      console.error('Error getting reading status:', error);
      return null;
    }
  }

  /**
   * Get the user's current reading plan
   */
  async getUserPlan(): Promise<UserReadingPlan | null> {
    try {
      const planJson = await AsyncStorage.getItem(STORAGE_KEY_USER_PLAN);
      if (!planJson) return null;
      return JSON.parse(planJson);
    } catch (error) {
      console.error('Error getting user plan:', error);
      return null;
    }
  }

  /**
   * Get reading for a specific day
   */
  async getDayReading(day: number): Promise<DayReading | null> {
    const userPlan = await this.getUserPlan();
    if (!userPlan) return null;

    const plan = this.getPlan(userPlan.planType);
    if (!plan) return null;

    const dayReading = plan.readings.find(r => r.day === day);
    return dayReading || null;
  }

  /**
   * Get current day's reading
   */
  async getCurrentDayReading(): Promise<DayReading | null> {
    const userPlan = await this.getUserPlan();
    if (!userPlan) return null;

    return this.getDayReading(userPlan.currentDay);
  }

  /**
   * Mark a day as completed (AUTO-CHECKBOX)
   * This should only be called when user finishes reading and clicks "Mark as Completed"
   */
  async markDayCompleted(day: number): Promise<void> {
    const userPlan = await this.getUserPlan();
    if (!userPlan) {
      throw new Error('No active reading plan found');
    }

    // Check if already completed
    if (userPlan.completedDays.includes(day)) {
      return; // Already completed, do nothing
    }

    // Add to completed days
    userPlan.completedDays.push(day);
    userPlan.completedDays.sort((a, b) => a - b); // Keep sorted

    // Update current day to next uncompleted day
    const nextDay = this.findNextUncompletedDay(userPlan.completedDays, 365);
    userPlan.currentDay = nextDay;
    userPlan.updatedAt = new Date().toISOString();

    // Save updated plan
    await AsyncStorage.setItem(STORAGE_KEY_USER_PLAN, JSON.stringify(userPlan));
    await AsyncStorage.setItem(STORAGE_KEY_COMPLETED_DAYS, JSON.stringify(userPlan.completedDays));
  }

  /**
   * Find the next uncompleted day
   */
  private findNextUncompletedDay(completedDays: number[], totalDays: number): number {
    for (let day = 1; day <= totalDays; day++) {
      if (!completedDays.includes(day)) {
        return day;
      }
    }
    return totalDays; // All days completed
  }

  /**
   * Get progress for all days
   */
  async getAllDaysProgress(): Promise<DayProgress[]> {
    const userPlan = await this.getUserPlan();
    if (!userPlan) return [];

    const plan = this.getPlan(userPlan.planType);
    if (!plan) return [];

    return plan.readings.map(dayReading => ({
      day: dayReading.day,
      isCompleted: userPlan.completedDays.includes(dayReading.day),
      readings: dayReading.readings,
    }));
  }

  /**
   * Get reading plan statistics
   */
  async getStats(): Promise<ReadingPlanStats | null> {
    const userPlan = await this.getUserPlan();
    if (!userPlan) return null;

    const totalDays = 365;
    const completedDays = userPlan.completedDays.length;
    const progressPercentage = Math.round((completedDays / totalDays) * 100);
    const daysRemaining = totalDays - completedDays;

    // Calculate current streak
    const currentStreak = this.calculateCurrentStreak(userPlan.completedDays);
    const longestStreak = this.calculateLongestStreak(userPlan.completedDays);

    // Calculate estimated completion date
    const startDate = new Date(userPlan.startDate);
    const estimatedCompletionDate = new Date(startDate);
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + 365);

    return {
      totalDays,
      completedDays,
      currentDay: userPlan.currentDay,
      progressPercentage,
      currentStreak,
      longestStreak,
      daysRemaining,
      estimatedCompletionDate: estimatedCompletionDate.toISOString(),
    };
  }

  /**
   * Calculate current streak (consecutive days from most recent)
   */
  private calculateCurrentStreak(completedDays: number[]): number {
    if (completedDays.length === 0) return 0;

    const sorted = [...completedDays].sort((a, b) => b - a); // Descending order
    let streak = 1;

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i] - sorted[i + 1] === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Calculate longest streak
   */
  private calculateLongestStreak(completedDays: number[]): number {
    if (completedDays.length === 0) return 0;

    const sorted = [...completedDays].sort((a, b) => a - b); // Ascending order
    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  /**
   * Update reminder settings
   */
  async updateReminderSettings(enabled: boolean, time: string): Promise<void> {
    const userPlan = await this.getUserPlan();
    if (!userPlan) {
      throw new Error('No active reading plan found');
    }

    userPlan.reminderEnabled = enabled;
    userPlan.reminderTime = time;
    userPlan.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(STORAGE_KEY_USER_PLAN, JSON.stringify(userPlan));

    // Schedule or cancel notifications based on enabled status
    if (enabled) {
      const [hours, minutes] = time.split(':');
      await NotificationService.scheduleDailyReminder(parseInt(hours, 10), parseInt(minutes, 10));
    } else {
      await NotificationService.cancelAllReminders();
    }
  }

  /**
   * Reset reading plan (for testing or starting over)
   * WARNING: This will delete all progress
   */
  async resetPlan(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_USER_PLAN);
    await AsyncStorage.removeItem(STORAGE_KEY_COMPLETED_DAYS);
  }

  /**
   * Check if user has an active plan
   */
  async hasActivePlan(): Promise<boolean> {
    const plan = await this.getUserPlan();
    return plan !== null;
  }

  /**
   * Get plan lock status
   */
  async isPlanLocked(): Promise<boolean> {
    const plan = await this.getUserPlan();
    return plan?.isLocked ?? false;
  }
}

export default new ReadingPlanService();
