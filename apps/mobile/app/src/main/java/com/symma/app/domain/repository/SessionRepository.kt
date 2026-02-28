package com.symma.app.domain.repository

import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.model.Session

/**
 * Repository for managing session data and uploads.
 */
interface SessionRepository {
    
    /**
     * Saves a completed session to local storage with PENDING sync status.
     * 
     * @param routineId ID of the routine performed
     * @param startTime Session start timestamp (epoch ms)
     * @param endTime Session end timestamp (epoch ms)
     * @param durationSeconds Total duration of the session in seconds
     * @param score Overall session score
     * @param items List of session item results
     * @return Result containing the local session ID
     */
    suspend fun saveSession(
        routineId: String,
        startTime: Long,
        endTime: Long,
        durationSeconds: Int,
        score: Float,
        items: List<SessionItemRequest>
    ): Result<String>

    /**
     * Gets all sessions with PENDING sync status.
     */
    suspend fun getPendingSessions(): List<Session>

    /**
     * Attempts to sync a session to the server.
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
}
