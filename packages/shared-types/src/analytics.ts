// Analytics contracts — routine stats and history

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

export interface HistoryItemSummary {
  exerciseId: string;
  exerciseName: string;
  repsCompleted: number;
  averageAccuracy: number | null;  // 0–100 or null
}

export interface RoutineHistoryItem {
  id: string;
  date: string;                  // ISO 8601
  durationSeconds: number;
  score: number;                 // int, 0–100
  isSynced: boolean;
  items: HistoryItemSummary[];
}

export type RoutineHistoryResponse = RoutineHistoryItem[];
