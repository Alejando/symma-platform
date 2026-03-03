/*
  Warnings:

  - Added the required column `category` to the `exercises` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('WARMUP', 'CORE', 'COOLDOWN');

-- AlterTable
ALTER TABLE "exercises" ADD COLUMN "category" "ExerciseCategory" NOT NULL DEFAULT 'CORE';
ALTER TABLE "exercises" ALTER COLUMN "category" DROP DEFAULT;
