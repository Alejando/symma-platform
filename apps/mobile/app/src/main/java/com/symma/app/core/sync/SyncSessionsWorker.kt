package com.symma.app.core.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkerParameters
import com.symma.app.domain.model.RetryableSyncException
import com.symma.app.domain.model.Session
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
        if (isFreshRun()) {
            sessionRepository.requeueFailedSessions()
            sessionRepository.discardOrphanSnapshots()
        }

        val pendingSessions = sessionRepository.getPendingSessions()
        if (pendingSessions.isEmpty()) return Result.success()

        val sessionsToRetry = pendingSessions.filter { session -> needsRetry(session) }
        return when {
            sessionsToRetry.isEmpty() -> Result.success()
            hasAttemptsLeft() -> {
                Log.d(TAG, "${sessionsToRetry.size} sessions will retry (attempt ${currentAttempt()} of $MAX_ATTEMPTS)")
                Result.retry()
            }
            else -> {
                Log.w(TAG, "Giving up on ${sessionsToRetry.size} sessions after $MAX_ATTEMPTS attempts")
                sessionsToRetry.forEach { session -> sessionRepository.markError(session.id) }
                Result.failure()
            }
        }
    }

    /** Sessions in ERROR get a new chance on every sync run that is not itself a retry. */
    private fun isFreshRun() = runAttemptCount == 0

    private fun currentAttempt() = runAttemptCount + 1

    private fun hasAttemptsLeft() = currentAttempt() < MAX_ATTEMPTS

    private suspend fun needsRetry(session: Session): Boolean {
        val failure = try {
            sessionRepository.syncSession(session.id).exceptionOrNull()
        } catch (e: Exception) {
            e
        } ?: return false
        Log.w(TAG, "Sync failed for session ${session.id}: ${failure.message}")
        return failure.isRetryable()
    }

    private fun Throwable.isRetryable() = this is IOException || this is RetryableSyncException

    companion object {
        const val WORK_NAME = "sync_sessions_work"
        const val MAX_ATTEMPTS = 3
        const val BACKOFF_DELAY = 30L
        val BACKOFF_DELAY_UNIT = TimeUnit.SECONDS

        fun buildRequest(): OneTimeWorkRequest = OneTimeWorkRequestBuilder<SyncSessionsWorker>()
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, BACKOFF_DELAY, BACKOFF_DELAY_UNIT)
            .build()
    }
}
