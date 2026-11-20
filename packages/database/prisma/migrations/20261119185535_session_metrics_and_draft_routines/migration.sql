-- AlterEnum
ALTER TYPE "RoutineStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "session_items" ADD COLUMN     "average_hold_seconds" DOUBLE PRECISION,
ADD COLUMN     "snapshot_key" TEXT,
ADD COLUMN     "symmetry_score" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "calibration" JSONB;
