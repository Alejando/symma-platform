package com.symma.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.data.local.entity.SessionItemWithExerciseName
import kotlinx.coroutines.flow.Flow

@Dao
interface SessionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSession(session: SessionEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSessionItems(items: List<SessionItemEntity>)

    @Transaction
    suspend fun insertSessionWithItems(session: SessionEntity, items: List<SessionItemEntity>) {
        insertSession(session)
        insertSessionItems(items)
    }

    @Query("UPDATE sessions SET sync_status = 'PENDING' WHERE sync_status = 'ERROR'")
    suspend fun requeueFailedSessions(): Int

    @Query("SELECT * FROM sessions WHERE sync_status = 'PENDING'")
    suspend fun getPendingSessions(): List<SessionEntity>

    @Query("SELECT * FROM session_items WHERE session_id = :sessionId")
    suspend fun getItemsForSession(sessionId: String): List<SessionItemEntity>

    @Query(
        "SELECT session_items.exercise_id, exercises.name AS exercise_name, " +
            "session_items.reps_completed, session_items.average_accuracy, " +
            "session_items.symmetry_score, session_items.average_hold_seconds " +
            "FROM session_items LEFT JOIN exercises ON exercises.id = session_items.exercise_id " +
            "WHERE session_items.session_id = :sessionId ORDER BY session_items.rowid"
    )
    fun observeItemsWithExerciseName(sessionId: String): Flow<List<SessionItemWithExerciseName>>

    @Query("UPDATE session_items SET snapshot_key = :snapshotKey, snapshot_path = NULL WHERE id = :itemId")
    suspend fun markSnapshotUploaded(itemId: String, snapshotKey: String)

    @Query("UPDATE session_items SET snapshot_path = NULL WHERE id = :itemId")
    suspend fun clearSnapshotReference(itemId: String)

    @Query("UPDATE session_items SET snapshot_path = NULL WHERE session_id = :sessionId")
    suspend fun clearSnapshotReferences(sessionId: String)

    @Query("SELECT snapshot_path FROM session_items WHERE snapshot_path IS NOT NULL")
    suspend fun getSnapshotReferences(): List<String>

    @Query("UPDATE sessions SET sync_status = :status, synced_at = :syncedAt WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String, syncedAt: Long?)
}
