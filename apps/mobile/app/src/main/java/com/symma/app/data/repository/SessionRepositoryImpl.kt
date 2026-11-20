package com.symma.app.data.repository

import android.util.Log
import com.symma.app.core.network.SymmaApiService
import com.symma.app.data.local.dao.SessionDao
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.data.mapper.toCreateRequest
import com.symma.app.data.mapper.toDomain
import com.symma.app.data.mapper.toEntity
import com.symma.app.data.remote.snapshot.SnapshotUploader
import com.symma.app.domain.model.ExerciseResult
import com.symma.app.domain.repository.LocalSnapshotStore
import kotlinx.coroutines.CancellationException
import com.symma.app.data.local.calibration.toStoredJson
import com.symma.app.domain.model.CalibrationBaseline
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

/** A session in progress writes its snapshots before it is saved; a day is far longer than any session. */
private const val ORPHAN_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000L

class SessionRepositoryImpl @Inject constructor(
    private val sessionDao: SessionDao,
    private val apiService: SymmaApiService,
    private val snapshotStore: LocalSnapshotStore,
    private val snapshotUploader: SnapshotUploader
) : SessionRepository {

    override suspend fun saveSession(
        sessionId: String,
        routineId: String,
        startTime: Long,
        endTime: Long,
        durationSeconds: Int,
        score: Float,
        items: List<ExerciseResult>,
        calibration: CalibrationBaseline?
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
                createdAt = System.currentTimeMillis(),
                calibrationJson = calibration?.toStoredJson()
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
            
            uploadPendingSnapshots(sessionId)
            val items = sessionDao.getItemsForSession(sessionId)
            val request = sessionEntity.toCreateRequest(items)
            
            Log.d(TAG, "Syncing session: $sessionId")
            
            val response = apiService.createSession(request)
            
            when {
                response.isSuccessful -> {
                    Log.d(TAG, "Session synced successfully: $sessionId")
                    markSynced(sessionId)
                    discardSnapshotsOf(items)
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

    /** The images are optional evidence: any failure leaves them for the next attempt and the session goes ahead. */
    private suspend fun uploadPendingSnapshots(sessionId: String) {
        try {
            sessionDao.getItemsForSession(sessionId)
                .filter { item -> item.snapshotReference != null && item.snapshotKey == null }
                .forEach { item -> uploadSnapshot(sessionId, item) }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TAG, "Skipping snapshots of session $sessionId: ${e.message}")
        }
    }

    private suspend fun uploadSnapshot(sessionId: String, item: SessionItemEntity) {
        val reference = item.snapshotReference ?: return
        try {
            val jpeg = snapshotStore.read(reference)
            if (jpeg == null) {
                sessionDao.clearSnapshotReference(item.id)
                return
            }
            val snapshotKey = snapshotUploader.upload(sessionId, item.exerciseId, jpeg)
            sessionDao.markSnapshotUploaded(item.id, snapshotKey)
            snapshotStore.delete(reference)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TAG, "Snapshot upload failed for item ${item.id}: ${e.message}")
        }
    }

    /** Once the session exists on the server a key can no longer be attached, so leftover images are deleted. */
    private suspend fun discardSnapshotsOf(items: List<SessionItemEntity>) {
        val leftovers = items.mapNotNull { item -> item.snapshotReference }
        if (leftovers.isEmpty()) return
        try {
            leftovers.forEach { reference -> snapshotStore.delete(reference) }
            sessionDao.clearSnapshotReferences(items.first().sessionId)
        } catch (e: Exception) {
            Log.w(TAG, "Could not delete leftover snapshots: ${e.message}")
        }
    }

    override suspend fun discardOrphanSnapshots() {
        try {
            val referenced = sessionDao.getSnapshotReferences().toSet()
            snapshotStore.deleteUnreferencedOlderThan(referenced, System.currentTimeMillis() - ORPHAN_SNAPSHOT_AGE_MS)
        } catch (e: Exception) {
            Log.w(TAG, "Could not delete orphan snapshots: ${e.message}")
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
                    averageAccuracy = row.averageAccuracy,
                    symmetryScore = row.symmetryScore,
                    averageHoldSeconds = row.averageHoldSeconds
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
