export const SNAPSHOT_CONTENT_TYPE = 'image/jpeg';

export function snapshotKeyFor(
  patientId: string,
  sessionId: string,
  exerciseId: string,
): string {
  return `snapshots/${patientId}/${sessionId}/${exerciseId}.jpg`;
}
