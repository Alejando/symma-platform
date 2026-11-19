package com.symma.app.data.repository

import android.util.Log
import com.symma.app.core.network.SymmaApiService
import com.symma.app.data.local.dao.SessionDao
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.data.mapper.toCreateRequest
import com.symma.app.data.mapper.toDomain
import com.symma.app.data.mapper.toEntity
import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.model.RetryableSyncException
import com.symma.app.domain.model.Session
import com.symma.app.domain.model.SessionExerciseResult
import com.symma.app.domain.model.SyncStatus
import com.symma.app.domain.repository.SessionRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.io.IOException
import javax.inject.Inject

private const val TAG = "SessionRepo"

class SessionRepositoryImpl @Inject constructor(
    private val sessionDao: SessionDao,
    private val apiService: SymmaApiService
) : SessionRepository {

    override suspend fun saveSession(
        sessionId: String,
        routineId: String,
        startTime: Long,
        endTime: Long,
        durationSeconds: Int,
        score: Float,
        items: List<SessionItemRequest>
    ): Result<String> {
        return try {
            val sessionEntity = SessionEntity(
                id = sessionId,
                routineId = routineId,
                startTime = startTime,
                endTime = endTime,
                durationSeconds = durationSeconds,
                score = score,
                syncStatus = SyncStatus.PENDING.name,
                syncedAt = null,
                createdAt = System.currentTimeMillis()
            )
            
            val itemEntities = items.map { it.toEntity(sessionId) }
            
            sessionDao.insertSessionWithItems(sessionEntity, itemEntities)
            
            Log.d(TAG, "Session saved locally with id: $sessionId")
            Result.success(sessionId)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save session locally: ${e.message}", e)
            Result.failure(e)
        }
    }

    override suspend fun getPendingSessions(): List<Session> {
        return try {
            val pendingEntities = sessionDao.getPendingSessions()
            pendingEntities.map { entity ->
                val items = sessionDao.getItemsForSession(entity.id)
                entity.toDomain(items)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get pending sessions: ${e.message}", e)
            emptyList()
        }
    }

    override suspend fun syncSession(sessionId: String): Result<Unit> {
        return try {
            val sessionEntities = sessionDao.getPendingSessions()
            val sessionEntity = sessionEntities.find { it.id == sessionId }
                ?: return Result.failure(Exception("Session not found: $sessionId"))
            
            val items = sessionDao.getItemsForSession(sessionId)
            val request = sessionEntity.toCreateRequest(items)
            
            Log.d(TAG, "Syncing session: $sessionId")
            
            val response = apiService.createSession(request)
            
            when {
                response.isSuccessful -> {
                    Log.d(TAG, "Session synced successfully: $sessionId")
                    markSynced(sessionId)
                    Result.success(Unit)
                }
                response.code() == 409 -> {
                    Log.d(TAG, "Session already exists on server (409): $sessionId")
                    markSynced(sessionId)
                    Result.success(Unit)
                }
                response.code().isRetryableStatus() -> {
                    val errorMsg = "Retryable error syncing session: ${response.code()}"
                    Log.w(TAG, errorMsg)
                    Result.failure(RetryableSyncException(errorMsg))
                }
                else -> {
                    val errorMsg = "Permanent error syncing session: ${response.code()}"
                    Log.e(TAG, errorMsg)
                    markError(sessionId)
                    Result.failure(Exception(errorMsg))
                }
            }
        } catch (e: IOException) {
            Log.e(TAG, "Network error syncing session: ${e.message}", e)
            Result.failure(e)
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error syncing session: ${e.message}", e)
            Result.failure(e)
        }
    }

    /** 401 is retryable because the patient can log in again; the session itself is still valid. */
    private fun Int.isRetryableStatus() = this == 401 || this == 408 || this == 429 || this >= 500

    override suspend fun requeueFailedSessions() {
        try {
            val requeued = sessionDao.requeueFailedSessions()
            if (requeued > 0) Log.d(TAG, "Requeued $requeued sessions in ERROR")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to requeue sessions in ERROR: ${e.message}", e)
        }
    }

    override fun observeExerciseResults(sessionId: String): Flow<List<SessionExerciseResult>> =
        sessionDao.observeItemsWithExerciseName(sessionId).map { rows ->
            rows.map { row ->
                SessionExerciseResult(
                    exerciseId = row.exerciseId,
                    exerciseName = row.exerciseName,
                    repsCompleted = row.repsCompleted,
                    averageAccuracy = row.averageAccuracy
                )
            }
        }

    override suspend fun markSynced(sessionId: String) {
        try {
            sessionDao.updateSyncStatus(sessionId, SyncStatus.SYNCED.name, System.currentTimeMillis())
            Log.d(TAG, "Session marked as SYNCED: $sessionId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to mark session as synced: ${e.message}", e)
        }
    }

    override suspend fun markError(sessionId: String) {
        try {
            sessionDao.updateSyncStatus(sessionId, SyncStatus.ERROR.name, null)
            Log.d(TAG, "Session marked as ERROR: $sessionId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to mark session as error: ${e.message}", e)
        }
    }
}
