import type { Session, SessionItem } from '@prisma/client';
import type {
  SessionCalibration,
  SessionItemResponse,
  SessionResponse,
} from '@symma/shared-types';

export function toSessionItemResponse(item: SessionItem): SessionItemResponse {
  return {
    id: item.id,
    sessionId: item.sessionId,
    exerciseId: item.exerciseId,
    repsCompleted: item.repsCompleted,
    averageAccuracy: item.averageAccuracy,
    symmetryScore: item.symmetryScore,
    averageHoldSeconds: item.averageHoldSeconds,
    seriesData: item.seriesData,
  };
}

export function toSessionResponse(
  session: Session & { items: SessionItem[] },
): SessionResponse {
  return {
    id: session.id,
    routineId: session.routineId,
    date: session.date.toISOString(),
    durationSeconds: session.durationSeconds,
    score: session.score,
    calibration: toCalibration(session.calibration),
    isSynced: session.isSynced,
    createdAt: session.createdAt.toISOString(),
    items: session.items.map(toSessionItemResponse),
  };
}

export function toCalibration(
  calibration: Session['calibration'],
): SessionCalibration | null {
  return calibration === null
    ? null
    : (calibration as unknown as SessionCalibration);
}
