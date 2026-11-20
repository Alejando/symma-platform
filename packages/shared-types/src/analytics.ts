// Analytics contracts — routine stats, routine history and patient stats

import type { PaginatedResponse, PaginationQuery } from './common';

export interface RoutineChartPoint {
  date: string;                  // YYYY-MM-DD
  score: number;                 // int, 0–100
  symmetry: number | null;       // int, 0–100; null when no item reported symmetry
}

export interface RoutineStatsResponse {
  summary: {
    totalSessions: number;       // int
    currentStreak: number;       // int, consecutive calendar days (UTC)
    avgScore: number;            // int, 0–100
  };
  averageSymmetry: number | null; // int, 0–100
  chartData: RoutineChartPoint[]; // oldest first
}

export interface HistoryItemSummary {
  exerciseId: string;
  exerciseName: string;
  repsCompleted: number;
  averageAccuracy: number | null;      // 0–100
  symmetryScore: number | null;        // 0–100
  averageHoldSeconds: number | null;
}

export interface RoutineHistoryItem {
  id: string;
  date: string;                  // ISO 8601
  durationSeconds: number;
  score: number;                 // int, 0–100
  isSynced: boolean;
  items: HistoryItemSummary[];
}

export type RoutineHistoryQuery = Pick<PaginationQuery, 'page' | 'limit'>;

/** Newest first. */
export type RoutineHistoryResponse = PaginatedResponse<RoutineHistoryItem>;

export interface PatientStatsResponse {
  adherencePercent: number | null;     // int, 0–100; null when no ACTIVE routine
  sessionsCompleted: number;           // int, across all routines
  lastSessionAt: string | null;        // ISO 8601
}
