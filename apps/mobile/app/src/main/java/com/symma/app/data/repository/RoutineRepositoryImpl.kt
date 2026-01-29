package com.symma.app.data.repository

import android.util.Log
import com.symma.app.core.network.SymmaApiService
import com.symma.app.data.local.dao.RoutineDao
import com.symma.app.data.mapper.toEntity
import com.symma.app.data.mapper.toDomain
import com.symma.app.domain.model.Routine
import com.symma.app.domain.repository.RoutineRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RoutineRepositoryImpl @Inject constructor(
    private val apiService: SymmaApiService,
    private val routineDao: RoutineDao
) : RoutineRepository {

    companion object {
        private const val TAG = "RoutineRepository"
    }

    override suspend fun refreshRoutine(): Result<Unit> {
        return try {
            Log.d(TAG, "Fetching routine from API...")
            val response = apiService.getActiveRoutine()
            
            // Handle empty response or null body (no active routine)
            if (!response.isSuccessful || response.body() == null) {
                Log.d(TAG, "No active routine found for patient (status: ${response.code()}), clearing local data")
                routineDao.deleteAllRoutineItems()
                routineDao.deleteAllExercises()
                routineDao.deleteAllRoutines()
                return Result.success(Unit)
            }
            
            val routineDto = response.body()!!
            Log.d(TAG, "Received routine: ${routineDto.name} with ${routineDto.items.size} items")

            // Map DTO to entities
            val routineEntity = routineDto.toEntity()
            val exerciseEntities = routineDto.items.map { it.exercise.toEntity() }
            val routineItemEntities = routineDto.items.map { it.toEntity(routineDto.id) }

            // Atomically replace all data
            routineDao.replaceRoutineWithItems(
                routine = routineEntity,
                exercises = exerciseEntities,
                items = routineItemEntities
            )

            Log.d(TAG, "Routine synced successfully to local database")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to sync routine: ${e.message}", e)
            Result.failure(e)
        }
    }

    override fun getRoutineFlow(): Flow<Routine?> {
        return routineDao.getActiveRoutine().map { routineWithItems ->
            routineWithItems?.toDomain()
        }
    }
}
