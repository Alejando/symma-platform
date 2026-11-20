// Session contracts — session creation (mobile sync), therapist detail, snapshot upload

export interface SessionCalibration {
  capturedAt: string;              // ISO 8601
  values: Record<string, number>;
}

export interface SessionItemRequest {
  exerciseId: string;              // must reference an existing exercise
  repsCompleted: number;           // int, >= 0
  averageAccuracy?: number;        // float, 0–100 (exercise score against calibrated threshold)
  symmetryScore?: number;          // float, 0–100 (100 = perfectly symmetric left/right)
  averageHoldSeconds?: number;     // float, >= 0
  snapshotKey?: string;            // returned by POST /mobile/snapshots/upload-url
  seriesData?: unknown;            // JSON blob — detailed per-rep data
}

export interface CreateSessionRequest {
  /**
   * Client-generated UUID for idempotency (required).
   * A new session answers 201; a replay of the same id by the same patient answers 200
   * with the existing session.
   */
  id: string;
  routineId: string;
  startTime: string;               // ISO 8601
  endTime: string;                 // ISO 8601, >= startTime
  calibration?: SessionCalibration;
  items: SessionItemRequest[];     // at least one
}

// Note: isSynced and syncedAt are local-only mobile fields and MUST NOT appear in requests

export interface SessionItemResponse {
  id: string;
  sessionId: string;
  exerciseId: string;
  repsCompleted: number;
  averageAccuracy: number | null;      // 0–100
  symmetryScore: number | null;        // 0–100
  averageHoldSeconds: number | null;
  seriesData: unknown | null;
}

export interface SessionItemDetailResponse extends SessionItemResponse {
  exerciseName: string;
  snapshotUrl: string | null;          // short-lived signed GET URL
}

export interface SessionResponse {
  id: string;
  routineId: string;
  date: string;                        // ISO 8601
  durationSeconds: number;             // int
  score: number;                       // 0–100
  calibration: SessionCalibration | null;
  isSynced: boolean;
  createdAt: string;
  items: SessionItemResponse[];
}

export interface SessionDetailResponse {
  id: string;
  routineId: string;
  date: string;
  durationSeconds: number;
  score: number;                       // int, 0–100
  isSynced: boolean;
  createdAt: string;
  calibration: SessionCalibration | null;
  items: SessionItemDetailResponse[];
  navigation: {
    previousSessionId: string | null;
    nextSessionId: string | null;
  };
}

export type SnapshotContentType = 'image/jpeg';

export interface SnapshotUploadUrlRequest {
  sessionId: string;                   // UUID, the client-generated session id
  exerciseId: string;
  contentType: SnapshotContentType;
}

export interface SnapshotUploadUrlResponse {
  uploadUrl: string;                   // PUT the JPEG here with the same content type
  snapshotKey: string;                 // send in SessionItemRequest.snapshotKey
  expiresInSeconds: number;
}
