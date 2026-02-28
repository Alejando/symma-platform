package com.symma.app.domain.usecase

import android.util.Log
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.symma.app.core.sync.SyncSessionsWorker
import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.repository.SessionRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val TAG = "SaveAndSyncSession"
private const val SYNC_WORK_NAME = "sync_sessions_work"

class SaveAndSyncSessionUseCase @Inject constructor(
    private val sessionRepository: SessionRepository,
    private val workManager: WorkManager
) {

    suspend operator fun invoke(
        routineId: String,
        startTime: Long,
        endTime: Long,
        durationSeconds: Int,
        score: Float,
        items: List<SessionItemRequest>
    ): Result<String> {
        val saveResult = sessionRepository.saveSession(
            routineId = routineId,
            startTime = startTime,
            endTime = endTime,
            durationSeconds = durationSeconds,
            score = score,
            items = items
        )

        if (saveResult.isFailure) {
            Log.e(TAG, "Failed to save session locally")
            return saveResult
        }

        val sessionId = saveResult.getOrThrow()
        Log.d(TAG, "Session saved locally: $sessionId")

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val syncResult = sessionRepository.syncSession(sessionId)
                if (syncResult.isSuccess) {
                    Log.d(TAG, "Immediate sync successful for session: $sessionId")
                } else {
                    Log.d(TAG, "Immediate sync failed, WorkManager will retry: $sessionId")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Immediate sync exception: ${e.message}")
            }
        }

        enqueueSyncWorker()

        return Result.success(sessionId)
    }

    private fun enqueueSyncWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = OneTimeWorkRequestBuilder<SyncSessionsWorker>()
            .setConstraints(constraints)
            .build()

        workManager.enqueueUniqueWork(
            SYNC_WORK_NAME,
            ExistingWorkPolicy.KEEP,
            syncRequest
        )

        Log.d(TAG, "SyncSessionsWorker enqueued with CONNECTED constraint")
    }
}
