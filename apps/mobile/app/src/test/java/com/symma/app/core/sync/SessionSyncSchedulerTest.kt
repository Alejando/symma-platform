package com.symma.app.core.sync

import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test

class SessionSyncSchedulerTest {

    private val workManager = mockk<WorkManager>(relaxed = true)
    private val scheduler = SessionSyncScheduler(workManager)

    @Test
    fun `routine scheduling keeps a sync that is waiting out its backoff`() {
        scheduler.enqueue()

        verify { workManager.enqueueUniqueWork(SyncSessionsWorker.WORK_NAME, ExistingWorkPolicy.KEEP, any<OneTimeWorkRequest>()) }
    }

    @Test
    fun `syncing now replaces any waiting run so it starts with fresh attempts`() {
        scheduler.syncNow()

        verify { workManager.enqueueUniqueWork(SyncSessionsWorker.WORK_NAME, ExistingWorkPolicy.REPLACE, any<OneTimeWorkRequest>()) }
    }
}
