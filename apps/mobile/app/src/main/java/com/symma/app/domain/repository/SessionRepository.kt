package com.symma.app.domain.repository

/**
 * Repository for managing session data and uploads.
 */
interface SessionRepository {
    
    /**
     * Submits a completed session to the backend.
     * 
     * @param routineId ID of the routine performed
     * @param durationSeconds Total duration of the session in seconds
     * @return Result indicating success or failure
     */
    suspend fun submitSession(routineId: String, durationSeconds: Long): Result<Unit>
}
