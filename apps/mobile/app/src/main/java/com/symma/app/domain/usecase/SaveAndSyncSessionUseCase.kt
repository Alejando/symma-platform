package com.symma.app.domain.usecase

import android.util.Log
import com.symma.app.core.sync.SessionSyncScheduler
import com.symma.app.domain.model.ExerciseResult
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.repository.SessionRepository
import javax.inject.Inject

private const val TAG = "SaveAndSyncSession"

/** Saves the session locally and leaves every upload attempt to the worker, so the RF-060 cap of three attempts holds. */
class SaveAndSyncSessionUseCase @Inject constructor(
    private val sessionRepository: SessionRepository,
    private val sessionSyncScheduler: SessionSyncScheduler
) {

    suspend operator fun invoke(
        sessionId: String,
        routineId: String,
        startTime: Long,
        endTime: Long,
        durationSeconds: Int,
        score: Float,
        items: List<ExerciseResult>,
        calibration: CalibrationBaseline?
    ): Result<String> {
        val saveResult = sessionRepository.saveSession(
            sessionId = sessionId,
            routineId = routineId,
            startTime = startTime,
            endTime = endTime,
            durationSeconds = durationSeconds,
            score = score,
            items = items,
            calibration = calibration
        )

        if (saveResult.isFailure) {
            Log.e(TAG, "Failed to save session locally")
            return saveResult
        }

        Log.d(TAG, "Session saved locally: $sessionId")
        sessionSyncScheduler.enqueue()

        return Result.success(sessionId)
    }
}
