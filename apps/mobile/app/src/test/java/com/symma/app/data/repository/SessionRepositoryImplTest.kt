package com.symma.app.data.repository

import com.symma.app.core.network.SymmaApiService
import com.symma.app.data.local.dao.SessionDao
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.data.remote.snapshot.SnapshotUploader
import com.symma.app.domain.model.ExerciseResult
import com.symma.app.domain.repository.LocalSnapshotStore
import com.symma.app.domain.model.RetryableSyncException
import com.symma.app.data.local.calibration.calibrationFromStoredJson
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.SyncStatus
import io.mockk.Runs
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.just
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.runBlocking
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response
import java.io.IOException

class SessionRepositoryImplTest {

    private lateinit var sessionDao: SessionDao
    private lateinit var apiService: SymmaApiService
    private lateinit var repository: SessionRepositoryImpl
    private lateinit var snapshotStore: LocalSnapshotStore
    private lateinit var snapshotUploader: SnapshotUploader

    @Before
    fun setup() {
        sessionDao = mockk(relaxed = true)
        apiService = mockk()
        snapshotStore = mockk(relaxed = true)
        snapshotUploader = mockk()
        repository = SessionRepositoryImpl(sessionDao, apiService, snapshotStore, snapshotUploader)
    }

    @Test
    fun `saveSession inserts session with PENDING status`() = runBlocking {
        coEvery { sessionDao.insertSessionWithItems(any(), any()) } just Runs

        val items = listOf(
            ExerciseResult(
                exerciseId = "exercise-1",
                repsCompleted = 10,
                averageAccuracy = 85f
            )
        )

        val result = repository.saveSession(
            sessionId = "session-123",
            routineId = "routine-123",
            startTime = 1000L,
            endTime = 2000L,
            durationSeconds = 1,
            score = 85f,
            items = items,
            calibration = CalibrationBaseline(mouthSmileMax = 0.6f, capturedAtMillis = 1_000L)
        )

        assertTrue(result.isSuccess)
        coVerify {
            sessionDao.insertSessionWithItems(
                match {
                    it.id == "session-123" && it.syncStatus == SyncStatus.PENDING.name && it.routineId == "routine-123" &&
                        calibrationFromStoredJson(it.calibrationJson)?.mouthSmileMax == 0.6f
                },
                match { it.size == 1 }
            )
        }
    }

    @Test
    fun `syncSession marks SYNCED on 2xx response`() = runBlocking {
        val sessionEntity = createSessionEntity("session-123", SyncStatus.PENDING.name)
        coEvery { sessionDao.getPendingSessions() } returns listOf(sessionEntity)
        coEvery { sessionDao.getItemsForSession("session-123") } returns emptyList()
        coEvery { apiService.createSession(any()) } returns Response.success(Unit)
        coEvery { sessionDao.updateSyncStatus(any(), any(), any()) } just Runs

        val result = repository.syncSession("session-123")

        assertTrue(result.isSuccess)
        coVerify { sessionDao.updateSyncStatus("session-123", SyncStatus.SYNCED.name, any()) }
    }

    @Test
    fun `syncSession keeps the session in ERROR on 409 because the routine is no longer accepting sessions`() = runBlocking {
        val sessionEntity = createSessionEntity("session-123", SyncStatus.PENDING.name)
        coEvery { sessionDao.getPendingSessions() } returns listOf(sessionEntity)
        coEvery { sessionDao.getItemsForSession("session-123") } returns emptyList()
        coEvery { apiService.createSession(any()) } returns Response.error(409, "Conflict".toResponseBody())
        coEvery { sessionDao.updateSyncStatus(any(), any(), any()) } just Runs

        val result = repository.syncSession("session-123")

        assertTrue(result.isFailure)
        coVerify { sessionDao.updateSyncStatus("session-123", SyncStatus.ERROR.name, null) }
        coVerify(exactly = 0) { sessionDao.updateSyncStatus("session-123", SyncStatus.SYNCED.name, any()) }
    }

    @Test
    fun `syncSession marks ERROR on 400 response`() = runBlocking {
        val sessionEntity = createSessionEntity("session-123", SyncStatus.PENDING.name)
        coEvery { sessionDao.getPendingSessions() } returns listOf(sessionEntity)
        coEvery { sessionDao.getItemsForSession("session-123") } returns emptyList()
        coEvery { apiService.createSession(any()) } returns Response.error(400, "Bad Request".toResponseBody())
        coEvery { sessionDao.updateSyncStatus(any(), any(), any()) } just Runs

        val result = repository.syncSession("session-123")

        assertTrue(result.isFailure)
        coVerify { sessionDao.updateSyncStatus("session-123", SyncStatus.ERROR.name, null) }
    }

    @Test
    fun `syncSession returns failure and stays PENDING on IOException`() = runBlocking {
        val sessionEntity = createSessionEntity("session-123", SyncStatus.PENDING.name)
        coEvery { sessionDao.getPendingSessions() } returns listOf(sessionEntity)
        coEvery { sessionDao.getItemsForSession("session-123") } returns emptyList()
        coEvery { apiService.createSession(any()) } throws IOException("Network error")

        val result = repository.syncSession("session-123")

        assertTrue(result.isFailure)
        coVerify(exactly = 0) { sessionDao.updateSyncStatus(any(), any(), any()) }
    }

    @Test
    fun `syncSession keeps the session PENDING and retryable on 5xx`() = runBlocking {
        givenPendingSessionAnswering(503)

        val result = repository.syncSession("session-123")

        assertTrue(result.exceptionOrNull() is RetryableSyncException)
        coVerify(exactly = 0) { sessionDao.updateSyncStatus(any(), any(), any()) }
    }

    @Test
    fun `syncSession keeps the session PENDING and retryable on 401`() = runBlocking {
        givenPendingSessionAnswering(401)

        val result = repository.syncSession("session-123")

        assertTrue(result.exceptionOrNull() is RetryableSyncException)
        coVerify(exactly = 0) { sessionDao.updateSyncStatus(any(), any(), any()) }
    }

    @Test
    fun `requeueFailedSessions moves ERROR sessions back to PENDING`() = runBlocking {
        coEvery { sessionDao.requeueFailedSessions() } returns 2

        repository.requeueFailedSessions()

        coVerify { sessionDao.requeueFailedSessions() }
    }

    private fun givenPendingSessionAnswering(statusCode: Int) {
        coEvery { sessionDao.getPendingSessions() } returns listOf(createSessionEntity("session-123", SyncStatus.PENDING.name))
        coEvery { sessionDao.getItemsForSession("session-123") } returns emptyList()
        coEvery { apiService.createSession(any()) } returns Response.error(statusCode, "error".toResponseBody())
    }

    @Test
    fun `markSynced sets non-null syncedAt`() = runBlocking {
        coEvery { sessionDao.updateSyncStatus(any(), any(), any()) } just Runs

        repository.markSynced("session-123")

        coVerify { 
            sessionDao.updateSyncStatus("session-123", SyncStatus.SYNCED.name, match { it != null }) 
        }
    }

    @Test
    fun `markError leaves syncedAt null`() = runBlocking {
        coEvery { sessionDao.updateSyncStatus(any(), any(), any()) } just Runs

        repository.markError("session-123")

        coVerify { sessionDao.updateSyncStatus("session-123", SyncStatus.ERROR.name, null) }
    }

    private fun createSessionEntity(id: String, syncStatus: String): SessionEntity {
        return SessionEntity(
            id = id,
            routineId = "routine-1",
            startTime = System.currentTimeMillis(),
            endTime = System.currentTimeMillis() + 900000,
            durationSeconds = 900,
            score = 85f,
            syncStatus = syncStatus,
            syncedAt = null,
            createdAt = System.currentTimeMillis()
        )
    }

    // ==================== Best-attempt snapshots ====================

    private val pendingSession = SessionEntity(
        id = "session-1", routineId = "routine-1", startTime = 1L, endTime = 2L, durationSeconds = 1, syncStatus = "PENDING"
    )
    private val itemWithSnapshot = SessionItemEntity(
        id = "item-1", sessionId = "session-1", exerciseId = "exercise-1", repsCompleted = 3, snapshotReference = "best.jpg.enc"
    )

    @Test
    fun `the snapshot is uploaded before the session and its key is sent with the item`() = runBlocking {
        val sent = slot<com.symma.app.data.remote.dto.session.CreateSessionRequest>()
        coEvery { sessionDao.getPendingSessions() } returns listOf(pendingSession)
        coEvery { sessionDao.getItemsForSession("session-1") } returnsMany listOf(
            listOf(itemWithSnapshot),
            listOf(itemWithSnapshot.copy(snapshotReference = null, snapshotKey = "sessions/session-1/exercise-1.jpg"))
        )
        coEvery { snapshotStore.read("best.jpg.enc") } returns byteArrayOf(1, 2, 3)
        coEvery { snapshotUploader.upload("session-1", "exercise-1", any()) } returns "sessions/session-1/exercise-1.jpg"
        coEvery { apiService.createSession(capture(sent)) } returns Response.success(Unit)

        val result = repository.syncSession("session-1")

        assertTrue(result.isSuccess)
        assertEquals("sessions/session-1/exercise-1.jpg", sent.captured.items.single().snapshotKey)
        coVerify { sessionDao.markSnapshotUploaded("item-1", "sessions/session-1/exercise-1.jpg") }
        coVerify { snapshotStore.delete("best.jpg.enc") }
    }

    @Test
    fun `a failed snapshot upload never stops the session from syncing`() = runBlocking {
        val sent = slot<com.symma.app.data.remote.dto.session.CreateSessionRequest>()
        coEvery { sessionDao.getPendingSessions() } returns listOf(pendingSession)
        coEvery { sessionDao.getItemsForSession("session-1") } returns listOf(itemWithSnapshot)
        coEvery { snapshotStore.read("best.jpg.enc") } returns byteArrayOf(1, 2, 3)
        coEvery { snapshotUploader.upload(any(), any(), any()) } throws IOException("storage unavailable")
        coEvery { apiService.createSession(capture(sent)) } returns Response.success(Unit)

        val result = repository.syncSession("session-1")

        assertTrue(result.isSuccess)
        assertEquals(null, sent.captured.items.single().snapshotKey)
        coVerify { sessionDao.updateSyncStatus("session-1", SyncStatus.SYNCED.name, any()) }
    }

    @Test
    fun `an image that could not be uploaded is deleted once its session is on the server`() = runBlocking {
        coEvery { sessionDao.getPendingSessions() } returns listOf(pendingSession)
        coEvery { sessionDao.getItemsForSession("session-1") } returns listOf(itemWithSnapshot)
        coEvery { snapshotStore.read(any()) } returns byteArrayOf(1)
        coEvery { snapshotUploader.upload(any(), any(), any()) } throws IOException("storage unavailable")
        coEvery { apiService.createSession(any()) } returns Response.success(Unit)

        repository.syncSession("session-1")

        coVerify { snapshotStore.delete("best.jpg.enc") }
        coVerify { sessionDao.clearSnapshotReferences("session-1") }
    }

    @Test
    fun `an image is kept for the next attempt while its session is still pending`() = runBlocking {
        coEvery { sessionDao.getPendingSessions() } returns listOf(pendingSession)
        coEvery { sessionDao.getItemsForSession("session-1") } returns listOf(itemWithSnapshot)
        coEvery { snapshotStore.read(any()) } returns byteArrayOf(1)
        coEvery { snapshotUploader.upload(any(), any(), any()) } throws IOException("offline")
        coEvery { apiService.createSession(any()) } throws IOException("offline")

        repository.syncSession("session-1")

        coVerify(exactly = 0) { snapshotStore.delete(any()) }
        coVerify(exactly = 0) { sessionDao.clearSnapshotReferences(any()) }
    }

    @Test
    fun `orphan snapshots older than a day are purged and referenced ones are kept`() = runBlocking {
        coEvery { sessionDao.getSnapshotReferences() } returns listOf("kept.jpg.enc")
        val before = System.currentTimeMillis()

        repository.discardOrphanSnapshots()

        coVerify {
            snapshotStore.deleteUnreferencedOlderThan(
                setOf("kept.jpg.enc"),
                match { cutoff -> cutoff <= before - 24 * 60 * 60 * 1000L + 1_000 && cutoff >= before - 24 * 60 * 60 * 1000L - 1_000 }
            )
        }
    }
}
