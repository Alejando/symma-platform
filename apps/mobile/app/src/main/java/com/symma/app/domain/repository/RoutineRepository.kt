package com.symma.app.domain.repository

import com.symma.app.domain.model.Routine
import kotlinx.coroutines.flow.Flow

/**
 * Repository for managing routine data with offline-first strategy.
 * The UI should always observe [getRoutineFlow] for data, never the API directly.
 */
interface RoutineRepository {

    /**
     * Fetches the latest routine from the network and persists to local database.
     * Fails silently if network is unavailable (app relies on cached data).
     * @return Result.success if sync was successful, Result.failure otherwise.
     */
    suspend fun refreshRoutine(): Result<Unit>

    /**
     * Returns a Flow of the active routine from local database.
     * This is the single source of truth for UI consumption.
     */
    fun getRoutineFlow(): Flow<Routine?>
}
