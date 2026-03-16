package com.symma.app.core.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.BackoffPolicy
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.symma.app.domain.repository.SessionRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.io.IOException
import java.util.concurrent.TimeUnit

private const val TAG = "SyncSessionsWorker"

@HiltWorker
class SyncSessionsWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val sessionRepository: SessionRepository
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting sync work")

        val pendingSessions = sessionRepository.getPendingSessions()

        if (pendingSessions.isEmpty()) {
            Log.d(TAG, "No pending sessions to sync")
            return Result.success()
        }

        Log.d(TAG, "Found ${pendingSessions.size} pending sessions")

        var hasNetworkError = false

        for (session in pendingSessions) {
            try {
                val syncResult = sessionRepository.syncSession(session.id)

                if (syncResult.isFailure) {
                    val exception = syncResult.exceptionOrNull()
                    if (exception is IOException) {
                        Log.w(TAG, "Network error syncing session ${session.id}, will retry")
                        hasNetworkError = true
                    } else {
                        Log.e(TAG, "Permanent error syncing session ${session.id}: ${exception?.message}")
                    }
                } else {
                    Log.d(TAG, "Successfully synced session ${session.id}")
                }
            } catch (e: IOException) {
                Log.w(TAG, "Network exception syncing session ${session.id}", e)
                hasNetworkError = true
            } catch (e: Exception) {
                Log.e(TAG, "Unexpected exception syncing session ${session.id}", e)
            }
        }

        return if (hasNetworkError) {
            Log.d(TAG, "Sync work completed with network errors, scheduling retry")
            Result.retry()
        } else {
            Log.d(TAG, "Sync work completed successfully")
            Result.success()
        }
    }

    companion object {
        const val WORK_NAME = "sync_sessions_work"
        val BACKOFF_DELAY = 30L
        val BACKOFF_DELAY_UNIT = TimeUnit.SECONDS
    }
}
