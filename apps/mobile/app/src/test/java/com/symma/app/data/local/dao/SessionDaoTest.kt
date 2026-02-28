package com.symma.app.data.local.dao

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.symma.app.core.di.SymmaDatabase
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class SessionDaoTest {

    private lateinit var database: SymmaDatabase
    private lateinit var sessionDao: SessionDao

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, SymmaDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        sessionDao = database.sessionDao()
    }

    @After
    fun teardown() {
        database.close()
    }

    @Test
    fun `insertSession and getPendingSessions returns only PENDING sessions`() = runBlocking {
        val pendingSession = createSessionEntity("session-1", "PENDING")
        val syncedSession = createSessionEntity("session-2", "SYNCED")
        val errorSession = createSessionEntity("session-3", "ERROR")

        sessionDao.insertSession(pendingSession)
        sessionDao.insertSession(syncedSession)
        sessionDao.insertSession(errorSession)

        val pendingSessions = sessionDao.getPendingSessions()

        assertEquals(1, pendingSessions.size)
        assertEquals("session-1", pendingSessions[0].id)
        assertEquals("PENDING", pendingSessions[0].syncStatus)
    }

    @Test
    fun `insertSessionItems and getItemsForSession returns correct items`() = runBlocking {
        val session = createSessionEntity("session-1", "PENDING")
        sessionDao.insertSession(session)

        val items = listOf(
            createSessionItemEntity("item-1", "session-1", "exercise-1"),
            createSessionItemEntity("item-2", "session-1", "exercise-2")
        )
        sessionDao.insertSessionItems(items)

        val retrievedItems = sessionDao.getItemsForSession("session-1")

        assertEquals(2, retrievedItems.size)
        assertEquals("exercise-1", retrievedItems[0].exerciseId)
        assertEquals("exercise-2", retrievedItems[1].exerciseId)
    }

    @Test
    fun `updateSyncStatus transitions PENDING to SYNCED with syncedAt`() = runBlocking {
        val session = createSessionEntity("session-1", "PENDING")
        sessionDao.insertSession(session)

        val syncedAt = System.currentTimeMillis()
        sessionDao.updateSyncStatus("session-1", "SYNCED", syncedAt)

        val pendingSessions = sessionDao.getPendingSessions()
        assertEquals(0, pendingSessions.size)
    }

    @Test
    fun `updateSyncStatus transitions PENDING to ERROR with null syncedAt`() = runBlocking {
        val session = createSessionEntity("session-1", "PENDING")
        sessionDao.insertSession(session)

        sessionDao.updateSyncStatus("session-1", "ERROR", null)

        val pendingSessions = sessionDao.getPendingSessions()
        assertEquals(0, pendingSessions.size)
    }

    @Test
    fun `getItemsForSession returns empty list for non-existent session`() = runBlocking {
        val items = sessionDao.getItemsForSession("non-existent")
        assertEquals(0, items.size)
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
            syncedAt = if (syncStatus == "SYNCED") System.currentTimeMillis() else null,
            createdAt = System.currentTimeMillis()
        )
    }

    private fun createSessionItemEntity(id: String, sessionId: String, exerciseId: String): SessionItemEntity {
        return SessionItemEntity(
            id = id,
            sessionId = sessionId,
            exerciseId = exerciseId,
            repsCompleted = 10,
            difficulty = 1,
            averageAccuracy = 85f,
            seriesData = null
        )
    }
}
