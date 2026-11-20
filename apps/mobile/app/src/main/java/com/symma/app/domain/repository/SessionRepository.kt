package com.symma.app.domain.repository

import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.ExerciseResult
import com.symma.app.domain.model.Session
import com.symma.app.domain.model.SessionExerciseResult
import kotlinx.coroutines.flow.Flow

/**
 * Repository for managing session data and uploads.
 */
interface SessionRepository {
    
    /**
     * Saves a completed session to local storage with PENDING sync status.
     * 
     * @param sessionId Client-generated id, also used by the server for idempotency
     * @param routineId ID of the routine performed
     * @param startTime Session start timestamp (epoch ms)
     * @param endTime Session end timestamp (epoch ms)
     * @param durationSeconds Total duration of the session in seconds
     * @param score Overall session score
     * @param items List of session item results
     * @param calibration Calibration the session was scored with, sent along with it
     * @return Result containing the local session ID
     */
    suspend fun saveSession(
        sessionId: String,
        routineId: String,
        startTime: Long,
        endTime: Long,
        durationSeconds: Int,
        score: Float,
        items: List<ExerciseResult>,
        calibration: CalibrationBaseline?
    ): Result<String>

    /**
     * Gets all sessions with PENDING sync status.
     */
    suspend fun getPendingSessions(): List<Session>

    /**
     * Attempts to sync a session to the server. Snapshots are uploaded first when possible; a
     * snapshot that cannot be uploaded never prevents the session from being sent.
     * 
     * @param sessionId ID of the session to sync
     * @return Result indicating success or failure
     */
    suspend fun syncSession(sessionId: String): Result<Unit>

    /**
     * Marks a session as successfully synced.
     */
    suspend fun markSynced(sessionId: String)

    /**
     * Marks a session as having a permanent sync error.
     */
    suspend fun markError(sessionId: String)

    /**
     * Moves every session in ERROR back to PENDING so it is sent again.
     */
    suspend fun requeueFailedSessions()

    /** Deletes stored snapshots that no session item refers to, such as those of a session never saved. */
    suspend fun discardOrphanSnapshots()

    /**
     * Emits the per-exercise results of a session as soon as they are stored.
     */
    fun observeExerciseResults(sessionId: String): Flow<List<SessionExerciseResult>>
}
