package com.symma.app.domain.usecase

import android.util.Log
import androidx.work.ExistingWorkPolicy
import androidx.work.WorkManager
import com.symma.app.core.sync.SyncSessionsWorker
import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.repository.SessionRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val TAG = "SaveAndSyncSession"

class SaveAndSyncSessionUseCase @Inject constructor(
    private val sessionRepository: SessionRepository,
    private val workManager: WorkManager
) {

    suspend operator fun invoke(
        sessionId: String,
        routineId: String,
        startTime: Long,
        endTime: Long,
        durationSeconds: Int,
        score: Float,
        items: List<SessionItemRequest>
    ): Result<String> {
        val saveResult = sessionRepository.saveSession(
            sessionId = sessionId,
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
        workManager.enqueueUniqueWork(
            SyncSessionsWorker.WORK_NAME,
            ExistingWorkPolicy.KEEP,
            SyncSessionsWorker.buildRequest()
        )
    }
}
