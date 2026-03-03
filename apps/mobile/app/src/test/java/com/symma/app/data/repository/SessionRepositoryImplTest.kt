package com.symma.app.data.repository

import com.symma.app.core.network.SymmaApiService
import com.symma.app.data.local.dao.SessionDao
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.model.SyncStatus
import io.mockk.Runs
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.just
import io.mockk.mockk
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

    @Before
    fun setup() {
        sessionDao = mockk(relaxed = true)
        apiService = mockk()
        repository = SessionRepositoryImpl(sessionDao, apiService)
    }

    @Test
    fun `saveSession inserts session with PENDING status`() = runBlocking {
        coEvery { sessionDao.insertSession(any()) } just Runs
        coEvery { sessionDao.insertSessionItems(any()) } just Runs

        val items = listOf(
            SessionItemRequest(
                exerciseId = "exercise-1",
                repsCompleted = 10,
                averageAccuracy = 85f
            )
        )

        val result = repository.saveSession(
            routineId = "routine-123",
            startTime = 1000L,
            endTime = 2000L,
            durationSeconds = 1,
            score = 85f,
            items = items
        )

        assertTrue(result.isSuccess)
        coVerify {
            sessionDao.insertSession(match { 
                it.syncStatus == SyncStatus.PENDING.name && it.routineId == "routine-123"
            })
        }
        coVerify { sessionDao.insertSessionItems(any()) }
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
    fun `syncSession marks SYNCED on 409 response`() = runBlocking {
        val sessionEntity = createSessionEntity("session-123", SyncStatus.PENDING.name)
        coEvery { sessionDao.getPendingSessions() } returns listOf(sessionEntity)
        coEvery { sessionDao.getItemsForSession("session-123") } returns emptyList()
        coEvery { apiService.createSession(any()) } returns Response.error(409, "Conflict".toResponseBody())
        coEvery { sessionDao.updateSyncStatus(any(), any(), any()) } just Runs

        val result = repository.syncSession("session-123")

        assertTrue(result.isSuccess)
        coVerify { sessionDao.updateSyncStatus("session-123", SyncStatus.SYNCED.name, any()) }
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
}
