// Session contracts — session creation (mobile sync)

export interface SessionItemRequest {
  exerciseId: string;
  repsCompleted: number;          // int
  averageAccuracy?: number;       // float, 0–100 (symmetry score)
  seriesData?: unknown;           // JSON blob — detailed per-rep data
}

export interface CreateSessionRequest {
  /**
   * Client-generated UUID for idempotency.
   * When provided, the server will check if a session with this ID already exists.
   * If found, returns the existing session (HTTP 200) instead of creating a duplicate.
   * Optional for backward compatibility with clients that don't support offline-first sync.
   */
  id?: string;
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
  averageAccuracy: number | null;
  seriesData: unknown | null;
}

export interface SessionItemDetailResponse extends SessionItemResponse {
  exerciseName: string;
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

export interface SessionDetailResponse {
  id: string;
  routineId: string;
  date: string;
  durationSeconds: number;
  score: number;
  isSynced: boolean;
  createdAt: string;
  items: SessionItemDetailResponse[];
  navigation: {
    previousSessionId: string | null;
    nextSessionId: string | null;
  };
}
