package com.symma.app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.ExistingWorkPolicy
import androidx.work.WorkManager
import com.symma.app.core.sync.SyncSessionsWorker
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class SymmaApp : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()
        
        // Enqueue sync worker on app startup to handle any pending sessions
        enqueueSyncWorkerOnStartup()
    }

    private fun enqueueSyncWorkerOnStartup() {
        WorkManager.getInstance(this).enqueueUniqueWork(
            SyncSessionsWorker.WORK_NAME,
            ExistingWorkPolicy.KEEP,
            SyncSessionsWorker.buildRequest()
        )
    }
}
