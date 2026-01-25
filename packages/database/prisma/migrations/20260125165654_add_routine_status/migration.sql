-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'THERAPIST');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('AR_TRACKING', 'MANUAL', 'RELAXATION');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('WARMUP', 'CORE', 'COOLDOWN');

-- CreateEnum
CREATE TYPE "RoutineStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contact_phone" TEXT,
    "billing_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapists" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'THERAPIST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender",
    "phone_number" TEXT,
    "email" TEXT,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "diagnosis" TEXT,
    "initial_paralysis_degree" INTEGER,
    "clinical_notes" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "auth_pin_hash" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "key_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ExerciseType" NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "asset_animation_url" TEXT,
    "asset_tutorial_video_url" TEXT,
    "default_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "RoutineStatus" NOT NULL DEFAULT 'ACTIVE',
    "therapist_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_items" (
    "id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "target_repetitions" INTEGER NOT NULL,
    "target_sets" INTEGER NOT NULL,
    "hold_time_seconds" INTEGER NOT NULL,
    "success_threshold" DOUBLE PRECISION,
    "rest_between_sets_seconds" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "routine_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "is_synced" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "therapists_email_key" ON "therapists"("email");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_key_name_key" ON "exercises"("key_name");

-- AddForeignKey
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_items" ADD CONSTRAINT "routine_items_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
