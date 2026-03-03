/*
  Warnings:

  - The values [AR_TRACKING] on the enum `ExerciseType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `address` on the `clinics` table. All the data in the column will be lost.
  - You are about to drop the column `billing_info` on the `clinics` table. All the data in the column will be lost.
  - You are about to drop the column `contact_phone` on the `clinics` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `exercises` table. All the data in the column will be lost.
  - You are about to drop the column `default_config` on the `exercises` table. All the data in the column will be lost.
  - You are about to drop the column `auth_pin_hash` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_url` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `hold_time_seconds` on the `routine_items` table. All the data in the column will be lost.
  - You are about to drop the column `rest_between_sets_seconds` on the `routine_items` table. All the data in the column will be lost.
  - You are about to drop the column `success_threshold` on the `routine_items` table. All the data in the column will be lost.
  - You are about to drop the column `target_repetitions` on the `routine_items` table. All the data in the column will be lost.
  - You are about to drop the column `target_sets` on the `routine_items` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MobileModule" AS ENUM ('EYES', 'EYES_INVERSE', 'BROWS', 'JAW', 'SMILE', 'KISS');

-- AlterEnum
BEGIN;
CREATE TYPE "ExerciseType_new" AS ENUM ('ISOTONIC', 'ISOMETRIC', 'MANUAL', 'RELAXATION');
ALTER TABLE "exercises" ALTER COLUMN "type" TYPE "ExerciseType_new" USING ("type"::text::"ExerciseType_new");
ALTER TYPE "ExerciseType" RENAME TO "ExerciseType_old";
ALTER TYPE "ExerciseType_new" RENAME TO "ExerciseType";
DROP TYPE "public"."ExerciseType_old";
COMMIT;

-- AlterTable
ALTER TABLE "clinics" DROP COLUMN "address",
DROP COLUMN "billing_info",
DROP COLUMN "contact_phone";

-- AlterTable
ALTER TABLE "exercises" DROP COLUMN "category",
DROP COLUMN "default_config",
ADD COLUMN     "mobile_module" "MobileModule";

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "auth_pin_hash",
DROP COLUMN "avatar_url";

-- AlterTable
ALTER TABLE "routine_items" DROP COLUMN "hold_time_seconds",
DROP COLUMN "rest_between_sets_seconds",
DROP COLUMN "success_threshold",
DROP COLUMN "target_repetitions",
DROP COLUMN "target_sets",
ADD COLUMN     "allow_skip" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "difficulty_level" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "reps_per_set" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "rest_between_sets" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "sets" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "strict_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "target_hold_seconds" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "ExerciseCategory";

-- CreateTable
CREATE TABLE "session_items" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "reps_completed" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 0,
    "average_accuracy" DOUBLE PRECISION,
    "series_data" JSONB,

    CONSTRAINT "session_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "session_items" ADD CONSTRAINT "session_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_items" ADD CONSTRAINT "session_items_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
