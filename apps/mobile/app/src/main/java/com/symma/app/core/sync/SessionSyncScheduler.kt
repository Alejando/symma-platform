package com.symma.app.core.sync

import androidx.work.ExistingWorkPolicy
import androidx.work.WorkManager
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SessionSyncScheduler @Inject constructor(
    private val workManager: WorkManager
) {

    /** Leaves a sync that is already scheduled, including one waiting out its backoff, untouched. */
    fun enqueue() {
        workManager.enqueueUniqueWork(SyncSessionsWorker.WORK_NAME, ExistingWorkPolicy.KEEP, SyncSessionsWorker.buildRequest())
    }

    /** Starts a fresh run now, which also gives sessions that ended in ERROR a new set of attempts. */
    fun syncNow() {
        workManager.enqueueUniqueWork(SyncSessionsWorker.WORK_NAME, ExistingWorkPolicy.REPLACE, SyncSessionsWorker.buildRequest())
    }
}
