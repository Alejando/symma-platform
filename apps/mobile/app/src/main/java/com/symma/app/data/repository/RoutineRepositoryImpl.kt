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
import retrofit2.HttpException
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
            val response = apiService.getActiveRoutine()
            if (!response.isSuccessful) {
                Log.w(TAG, "Routine refresh failed with status ${response.code()}, keeping cached routine")
                return Result.failure(HttpException(response))
            }

            val routineDto = response.body()
            if (routineDto == null) {
                Log.d(TAG, "Server confirmed there is no active routine, clearing cached routine")
                clearCachedRoutine()
                return Result.success(Unit)
            }

            routineDao.replaceRoutineWithItems(
                routine = routineDto.toEntity(),
                exercises = routineDto.items.map { it.exercise.toEntity() },
                items = routineDto.items.map { it.toEntity(routineDto.id) }
            )
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to sync routine: ${e.message}", e)
            Result.failure(e)
        }
    }

    private suspend fun clearCachedRoutine() {
        routineDao.deleteAllRoutineItems()
        routineDao.deleteAllExercises()
        routineDao.deleteAllRoutines()
    }

    override fun getRoutineFlow(): Flow<Routine?> {
        return routineDao.getActiveRoutine().map { routineWithItems ->
            routineWithItems?.toDomain()
        }
    }
}
