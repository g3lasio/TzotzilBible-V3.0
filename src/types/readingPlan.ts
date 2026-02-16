// Types for Annual Bible Reading Plan

export type PlanType = 'chronological' | 'canonical';

export interface Reading {
  book: string;
  startChapter: number;
  endChapter: number;
}

export interface DayReading {
  day: number;
  readings: Reading[];
}

export interface ReadingPlan {
  planName: string;
  planType: PlanType;
  description: string;
  totalDays: number;
  readings: DayReading[];
}

export interface UserReadingPlan {
  id: string;
  planType: PlanType;
  startDate: string; // ISO date string
  currentDay: number;
  completedDays: number[]; // Array of day numbers that have been completed
  isLocked: boolean; // Once started, plan cannot be changed
  reminderEnabled: boolean;
  reminderTime: string; // HH:MM format (e.g., "07:00")
  createdAt: string;
  updatedAt: string;
}

export interface DayProgress {
  day: number;
  isCompleted: boolean;
  completedAt?: string; // ISO date string
  readings: Reading[];
}

export interface ReadingPlanStats {
  totalDays: number;
  completedDays: number;
  currentDay: number;
  progressPercentage: number;
  currentStreak: number;
  longestStreak: number;
  daysRemaining: number;
  estimatedCompletionDate: string;
}
