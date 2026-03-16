package com.symma.app.data.mapper

import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.model.SyncStatus
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionMapperTest {

    @Test
    fun `SessionItemRequest toEntity creates correct entity with generated id`() {
        val request = SessionItemRequest(
            exerciseId = "exercise-1",
            repsCompleted = 10,
            averageAccuracy = 85.5f,
            seriesData = mapOf("reps" to listOf(1, 2, 3))
        )

        val entity = request.toEntity("session-123")

        assertNotNull(entity.id)
        assertEquals("session-123", entity.sessionId)
        assertEquals("exercise-1", entity.exerciseId)
        assertEquals(10, entity.repsCompleted)
        assertEquals(85.5f, entity.averageAccuracy)
        assertNotNull(entity.seriesData)
        assertTrue(entity.seriesData!!.contains("reps"))
    }

    @Test
    fun `SessionItemRequest toEntity handles null seriesData`() {
        val request = SessionItemRequest(
            exerciseId = "exercise-1",
            repsCompleted = 10,
            averageAccuracy = null,
            seriesData = null
        )

        val entity = request.toEntity("session-123")

        assertNull(entity.seriesData)
        assertNull(entity.averageAccuracy)
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
}
