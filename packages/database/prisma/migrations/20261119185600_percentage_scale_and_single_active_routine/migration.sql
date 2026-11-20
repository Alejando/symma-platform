-- averageAccuracy and the session score move from the 0–1 scale to 0–100.
-- Rows already on the 0–100 scale (values above 1) are left untouched, so the migration is safe to replay.
UPDATE "session_items" SET "average_accuracy" = "average_accuracy" * 100 WHERE "average_accuracy" <= 1;
UPDATE "sessions" SET "score" = "score" * 100 WHERE "score" <= 1;

-- A patient may have at most one ACTIVE routine: keep the one the mobile app was already serving
-- (latest start date, then latest creation) and archive the rest.
UPDATE "routines" AS r
SET "status" = 'ARCHIVED', "updated_at" = CURRENT_TIMESTAMP
WHERE r."status" = 'ACTIVE'
  AND EXISTS (
    SELECT 1
    FROM "routines" AS newer
    WHERE newer."patient_id" = r."patient_id"
      AND newer."status" = 'ACTIVE'
      AND (newer."start_date", newer."created_at", newer."id") > (r."start_date", r."created_at", r."id")
  );

-- Not expressible in schema.prisma; enforced here and by RoutinesService.
CREATE UNIQUE INDEX "routines_one_active_per_patient" ON "routines" ("patient_id") WHERE "status" = 'ACTIVE';
