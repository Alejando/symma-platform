/*
  Warnings:

  - A unique constraint covering the columns `[access_code_hash]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "access_code_hash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "patients_access_code_hash_key" ON "patients"("access_code_hash");
