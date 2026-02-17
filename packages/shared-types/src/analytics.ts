// Analytics contracts — routine stats and history

import type { SessionResponse } from './sessions';

export interface RoutineChartPoint {
  date: string;                  // YYYY-MM-DD
  score: number;                 // int, 0–100
}

export interface RoutineStatsResponse {
  summary: {
    totalSessions: number;       // int
    currentStreak: number;       // int, consecutive days
    avgScore: number;            // int, 0–100
  };
  chartData: RoutineChartPoint[];
}

// RoutineHistoryResponse is an array of SessionResponse
export type RoutineHistoryResponse = SessionResponse[];
