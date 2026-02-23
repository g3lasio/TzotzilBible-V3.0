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

// Both plans always have exactly 365 days of content.
// We use the plan's own totalDays field as the authoritative source.
const PLAN_TOTAL_DAYS = 365;

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
   * Initialize a new reading plan for the user.
   * The plan always starts from Day 1 regardless of the calendar date —
   * this is a sequential 365-day journey, not a calendar-locked plan.
   * Users can start at any time of year.
   */
  async initializeUserPlan(
    planType: PlanType,
    reminderTime: string = '07:00'
  ): Promise<UserReadingPlan> {
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
      // Preserve existing chaptersRead if the entry already exists
      const existing = status[day] || {};
      status[day] = {
        hasVisitedBible: true,
        timestamp: existing.timestamp || new Date().toISOString(),
        chaptersRead: existing.chaptersRead || [],
      };
      await AsyncStorage.setItem(STORAGE_KEY_READING_STATUS, JSON.stringify(status));
    } catch (error) {
      console.error('Error marking reading started:', error);
    }
  }

  /**
   * Mark a specific chapter as read for a day.
   * The chapterKey uses the ENGLISH book name (as stored in the plan JSON)
   * to avoid translation mismatches.
   */
  async markChapterRead(day: number, book: string, chapter: number): Promise<void> {
    try {
      const statusJson = await AsyncStorage.getItem(STORAGE_KEY_READING_STATUS);
      const status = statusJson ? JSON.parse(statusJson) : {};

      if (!status[day]) {
        status[day] = {
          hasVisitedBible: true,
          timestamp: new Date().toISOString(),
          chaptersRead: [],
        };
      }

      // Use English book name as the canonical key to avoid translation issues
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
   * Check if all required chapters for a day have been read.
   * Uses English book names as keys (consistent with markChapterRead).
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

      // Build required chapters using English book names (same as markChapterRead)
      const requiredChapters: string[] = [];
      dayReading.readings.forEach(reading => {
        for (let ch = reading.startChapter; ch <= reading.endChapter; ch++) {
          requiredChapters.push(`${reading.book}:${ch}`);
        }
      });

      return requiredChapters.every(chapter => dayStatus.chaptersRead.includes(chapter));
    } catch (error) {
      console.error('Error checking chapters completion:', error);
      return false;
    }
  }

  /**
   * Get reading progress for a specific day (how many chapters read vs required).
   * Uses English book names as keys (consistent with markChapterRead).
   */
  async getReadingProgress(
    day: number
  ): Promise<{ read: number; total: number; chapters: string[] }> {
    try {
      const dayReading = await this.getDayReading(day);
      if (!dayReading) return { read: 0, total: 0, chapters: [] };

      const statusJson = await AsyncStorage.getItem(STORAGE_KEY_READING_STATUS);
      const status = statusJson ? JSON.parse(statusJson) : {};
      const dayStatus = status[day];

      // Build required chapters using English book names
      const requiredChapters: string[] = [];
      dayReading.readings.forEach(reading => {
        for (let ch = reading.startChapter; ch <= reading.endChapter; ch++) {
          requiredChapters.push(`${reading.book}:${ch}`);
        }
      });

      const chaptersRead: string[] = dayStatus?.chaptersRead || [];
      const readCount = requiredChapters.filter(ch => chaptersRead.includes(ch)).length;

      return {
        read: readCount,
        total: requiredChapters.length,
        chapters: requiredChapters,
      };
    } catch (error) {
      console.error('Error getting reading progress:', error);
      return { read: 0, total: 0, chapters: [] };
    }
  }

  /**
   * Get reading status for a specific day
   */
  async getReadingStatus(
    day: number
  ): Promise<{ hasVisitedBible: boolean; timestamp?: string } | null> {
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
   * Mark a day as completed.
   * After completion, currentDay advances to the next uncompleted day.
   * Skipped days are allowed — the user can skip a day and come back later;
   * the plan will not block on skipped days.
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

    // Advance currentDay to the next uncompleted day
    const totalDays = this.getPlan(userPlan.planType)?.totalDays ?? PLAN_TOTAL_DAYS;
    const nextDay = this.findNextUncompletedDay(userPlan.completedDays, totalDays);
    userPlan.currentDay = nextDay;
    userPlan.updatedAt = new Date().toISOString();

    // Save updated plan
    await AsyncStorage.setItem(STORAGE_KEY_USER_PLAN, JSON.stringify(userPlan));
    await AsyncStorage.setItem(
      STORAGE_KEY_COMPLETED_DAYS,
      JSON.stringify(userPlan.completedDays)
    );
  }

  /**
   * Find the next uncompleted day starting from day 1.
   * This ensures skipped days are always surfaced as the "current" day,
   * so the user can go back and complete them without the plan getting stuck.
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
   * Get reading plan statistics.
   * - totalDays comes from the plan JSON (always 365).
   * - estimatedCompletionDate is calculated from startDate + 365 days,
   *   correctly handling leap years via Date arithmetic.
   */
  async getStats(): Promise<ReadingPlanStats | null> {
    const userPlan = await this.getUserPlan();
    if (!userPlan) return null;

    const plan = this.getPlan(userPlan.planType);
    const totalDays = plan?.totalDays ?? PLAN_TOTAL_DAYS;
    const completedCount = userPlan.completedDays.length;
    const progressPercentage = Math.round((completedCount / totalDays) * 100);
    const daysRemaining = Math.max(0, totalDays - completedCount);

    // Calculate current streak
    const currentStreak = this.calculateCurrentStreak(userPlan.completedDays);
    const longestStreak = this.calculateLongestStreak(userPlan.completedDays);

    // Calculate estimated completion date.
    // Using Date.setDate() correctly handles month/year rollovers AND leap years.
    const startDate = new Date(userPlan.startDate);
    const estimatedCompletionDate = new Date(startDate);
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + totalDays);

    return {
      totalDays,
      completedDays: completedCount,
      currentDay: userPlan.currentDay,
      progressPercentage,
      currentStreak,
      longestStreak,
      daysRemaining,
      estimatedCompletionDate: estimatedCompletionDate.toISOString(),
    };
  }

  /**
   * Calculate current streak (consecutive completed days ending at the highest completed day).
   * A "streak" counts consecutive day numbers, not calendar dates.
   */
  private calculateCurrentStreak(completedDays: number[]): number {
    if (completedDays.length === 0) return 0;

    const sorted = [...completedDays].sort((a, b) => b - a); // Descending
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
   * Calculate longest streak of consecutive completed days
   */
  private calculateLongestStreak(completedDays: number[]): number {
    if (completedDays.length === 0) return 0;

    const sorted = [...completedDays].sort((a, b) => a - b); // Ascending
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
      await NotificationService.scheduleDailyReminder(
        parseInt(hours, 10),
        parseInt(minutes, 10)
      );
    } else {
      await NotificationService.cancelAllReminders();
    }
  }

  /**
   * Reset reading plan (for starting over).
   * WARNING: This will delete all progress.
   */
  async resetPlan(): Promise<void> {
    // Cancel any scheduled notifications first
    await NotificationService.cancelDailyReminder();

    // Clear ALL reading plan data
    await AsyncStorage.removeItem(STORAGE_KEY_USER_PLAN);
    await AsyncStorage.removeItem(STORAGE_KEY_COMPLETED_DAYS);
    await AsyncStorage.removeItem(STORAGE_KEY_READING_STATUS);

    console.log('Reading plan reset successfully - all data cleared');
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
