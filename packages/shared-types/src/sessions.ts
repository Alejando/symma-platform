// Session contracts — session creation (mobile sync)

export interface SessionItemRequest {
  exerciseId: string;
  repsCompleted: number;          // int
  difficulty?: number;            // int, default 0
  averageAccuracy?: number;       // float, 0–100 (symmetry score)
  seriesData?: unknown;           // JSON blob — detailed per-rep data
}

export interface CreateSessionRequest {
  routineId: string;
  startTime: string;              // ISO 8601
  endTime: string;                // ISO 8601
  items: SessionItemRequest[];
}

// Note: isSynced and syncedAt are local-only mobile fields and MUST NOT appear in requests

export interface SessionItemResponse {
  id: string;
  sessionId: string;
  exerciseId: string;
  repsCompleted: number;
  difficulty: number;
  averageAccuracy: number | null;
  seriesData: unknown | null;
}

export interface SessionResponse {
  id: string;
  routineId: string;
  date: string;                   // ISO 8601
  durationSeconds: number;        // int
  score: number;                  // int, 0–100
  createdAt: string;
  items?: SessionItemResponse[];
}
