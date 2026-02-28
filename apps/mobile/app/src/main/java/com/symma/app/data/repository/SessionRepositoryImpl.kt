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
import com.symma.app.domain.model.Session
import com.symma.app.domain.model.SyncStatus
import com.symma.app.domain.repository.SessionRepository
import java.io.IOException
import java.util.UUID
import javax.inject.Inject

private const val TAG = "SessionRepo"

class SessionRepositoryImpl @Inject constructor(
    private val sessionDao: SessionDao,
    private val apiService: SymmaApiService
) : SessionRepository {

    override suspend fun saveSession(
        routineId: String,
        startTime: Long,
        endTime: Long,
        durationSeconds: Int,
        score: Float,
        items: List<SessionItemRequest>
    ): Result<String> {
        return try {
            val sessionId = UUID.randomUUID().toString()
            
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
            
            sessionDao.insertSession(sessionEntity)
            sessionDao.insertSessionItems(itemEntities)
            
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
                response.code() in 400..499 -> {
                    val errorMsg = "Permanent error syncing session: ${response.code()}"
                    Log.e(TAG, errorMsg)
                    markError(sessionId)
                    Result.failure(Exception(errorMsg))
                }
                else -> {
                    val errorMsg = "Server error syncing session: ${response.code()}"
                    Log.e(TAG, errorMsg)
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
