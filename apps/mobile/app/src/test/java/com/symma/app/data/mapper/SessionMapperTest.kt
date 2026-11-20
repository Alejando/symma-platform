package com.symma.app.data.mapper

import com.symma.app.data.local.calibration.toStoredJson
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.domain.model.ExerciseResult
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.SyncStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionMapperTest {

    @Test
    fun `ExerciseResult toEntity creates an entity with a generated id`() {
        val result = ExerciseResult(
            exerciseId = "exercise-1",
            repsCompleted = 10,
            averageAccuracy = 85.5f,
            symmetryScore = 92f,
            averageHoldSeconds = 3.2f,
            snapshotReference = "snapshot.jpg.enc"
        )

        val entity = result.toEntity("session-123")

        assertNotNull(entity.id)
        assertEquals("session-123", entity.sessionId)
        assertEquals("exercise-1", entity.exerciseId)
        assertEquals(10, entity.repsCompleted)
        assertEquals(85.5f, entity.averageAccuracy)
        assertEquals(92f, entity.symmetryScore)
        assertEquals(3.2f, entity.averageHoldSeconds)
        assertEquals("snapshot.jpg.enc", entity.snapshotReference)
        assertNull(entity.snapshotKey)
    }

    @Test
    fun `stored series data is still sent as JSON`() {
        val entity = SessionItemEntity(
            id = "item-1", sessionId = "s", exerciseId = "e", repsCompleted = 1, seriesData = """{"reps":[1,2,3]}"""
        )

        assertTrue(entity.toSessionItemRequest().seriesData.toString().contains("reps"))
    }

    @Test
    fun `the uploaded snapshot key is sent but the local reference never is`() {
        val entity = SessionItemEntity(
            id = "item-1", sessionId = "s", exerciseId = "e", repsCompleted = 1,
            snapshotReference = "local.jpg.enc", snapshotKey = "sessions/s/e.jpg"
        )

        val json = com.google.gson.Gson().toJson(entity.toSessionItemRequest())

        assertTrue(json.contains("\"snapshotKey\":\"sessions/s/e.jpg\""))
        assertFalse(json.contains("local.jpg.enc"))
    }

    @Test
    fun `SessionEntity toCreateRequest creates correct request with ISO-8601 timestamps`() {
        val startTime = 1708603200000L // 2024-02-22T12:00:00.000Z
        val endTime = 1708604100000L   // 2024-02-22T12:15:00.000Z

        val session = SessionEntity(
            id = "session-123",
            routineId = "routine-456",
            startTime = startTime,
            endTime = endTime,
            durationSeconds = 900,
            score = 85f,
            syncStatus = "PENDING"
        )

        val items = listOf(
            SessionItemEntity(
                id = "item-1",
                sessionId = "session-123",
                exerciseId = "exercise-1",
                repsCompleted = 10,
                averageAccuracy = 85f,
                seriesData = """{"reps":[1,2,3]}"""
            )
        )

        val request = session.toCreateRequest(items)

        assertEquals("session-123", request.id)
        assertEquals("routine-456", request.routineId)
        assertTrue(request.startTime.matches(Regex("""\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z""")))
        assertTrue(request.endTime.matches(Regex("""\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z""")))
        assertEquals(1, request.items.size)
        assertEquals("exercise-1", request.items[0].exerciseId)
    }

    @Test
    fun `SessionEntity toDomain creates correct domain model`() {
        val session = SessionEntity(
            id = "session-123",
            routineId = "routine-456",
            startTime = 1708603200000L,
            endTime = 1708604100000L,
            durationSeconds = 900,
            score = 85f,
            syncStatus = "PENDING"
        )

        val items = listOf(
            SessionItemEntity(
                id = "item-1",
                sessionId = "session-123",
                exerciseId = "exercise-1",
                repsCompleted = 10,
                averageAccuracy = 85f,
                seriesData = null
            )
        )

        val domain = session.toDomain(items)

        assertEquals("session-123", domain.id)
        assertEquals("routine-456", domain.routineId)
        assertEquals(1708603200000L, domain.startTime)
        assertEquals(1708604100000L, domain.endTime)
        assertEquals(900, domain.durationSeconds)
        assertEquals(85f, domain.score)
        assertEquals(SyncStatus.PENDING, domain.syncStatus)
        assertEquals(1, domain.items.size)
        assertEquals("exercise-1", domain.items[0].exerciseId)
    }

    @Test
    fun `SessionItemEntity toDomain creates correct domain model`() {
        val entity = SessionItemEntity(
            id = "item-1",
            sessionId = "session-123",
            exerciseId = "exercise-1",
            repsCompleted = 10,
            averageAccuracy = 92.5f,
            seriesData = null
        )

        val domain = entity.toDomain()

        assertEquals("item-1", domain.id)
        assertEquals("exercise-1", domain.exerciseId)
        assertEquals(10, domain.repsCompleted)
        assertEquals(92.5f, domain.averageAccuracy)
    }

    @Test
    fun `accuracy outside 0 to 100 is never sent`() {
        val itemWithAccuracy = { accuracy: Float ->
            SessionItemEntity(id = "item-1", sessionId = "s", exerciseId = "e", repsCompleted = 1, averageAccuracy = accuracy)
        }

        assertEquals(87.5f, itemWithAccuracy(87.5f).toSessionItemRequest().averageAccuracy)
        assertNull(itemWithAccuracy(120f).toSessionItemRequest().averageAccuracy)
        assertNull(itemWithAccuracy(-3f).toSessionItemRequest().averageAccuracy)
        assertNull(itemWithAccuracy(Float.NaN).toSessionItemRequest().averageAccuracy)
    }

    @Test
    fun `symmetry and hold survive the round trip through Room`() {
        val request = ExerciseResult(
            exerciseId = "exercise-1",
            repsCompleted = 3,
            averageAccuracy = 80f,
            symmetryScore = 91.5f,
            averageHoldSeconds = 2.4f
        )

        val sent = request.toEntity("session-1").toSessionItemRequest()

        assertEquals(91.5f, sent.symmetryScore)
        assertEquals(2.4f, sent.averageHoldSeconds)
    }

    @Test
    fun `invalid symmetry and hold values are never sent`() {
        val entity = SessionItemEntity(
            id = "item-1", sessionId = "s", exerciseId = "e", repsCompleted = 1,
            symmetryScore = 101f, averageHoldSeconds = -1f
        )

        val sent = entity.toSessionItemRequest()

        assertNull(sent.symmetryScore)
        assertNull(sent.averageHoldSeconds)
    }

    @Test
    fun `the session request carries the calibration with its capture time and flat values`() {
        val calibration = CalibrationBaseline(
            mouthSmileMax = 0.6f,
            neutralOffsets = mapOf("smile" to 0.05f),
            capturedAtMillis = 1708603200000L
        )
        val session = SessionEntity(
            id = "session-1", routineId = "routine-1", startTime = 1L, endTime = 2L, durationSeconds = 1,
            calibrationJson = calibration.toStoredJson()
        )

        val sent = session.toCreateRequest(emptyList()).calibration!!

        assertEquals("2024-02-22T12:00:00.000Z", sent.capturedAt)
        assertEquals(0.6f, sent.values.getValue("smileMax"))
        assertEquals(0.05f, sent.values.getValue("smileNeutralOffset"))
        assertEquals(
            setOf("jawOpenMax", "smileMax", "browRaiseMax", "kissMax", "eyesClosedMax", "eyesWideMax", "smileNeutralOffset"),
            sent.values.keys
        )
    }

    @Test
    fun `a session without calibration or without its capture time sends none`() {
        val withoutCalibration = SessionEntity(id = "s", routineId = "r", startTime = 1L, endTime = 2L, durationSeconds = 1)
        val withoutCaptureTime = withoutCalibration.copy(
            calibrationJson = CalibrationBaseline().toStoredJson()
        )

        assertNull(withoutCalibration.toCreateRequest(emptyList()).calibration)
        assertNull(withoutCaptureTime.toCreateRequest(emptyList()).calibration)
    }
}
