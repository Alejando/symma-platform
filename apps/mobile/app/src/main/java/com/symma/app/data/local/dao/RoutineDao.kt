package com.symma.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.symma.app.data.local.entity.ExerciseEntity
import com.symma.app.data.local.entity.RoutineEntity
import com.symma.app.data.local.entity.RoutineItemEntity
import com.symma.app.data.local.entity.RoutineWithItemsAndExercises
import kotlinx.coroutines.flow.Flow

@Dao
interface RoutineDao {

    @Transaction
    @Query("SELECT * FROM routines LIMIT 1")
    fun getActiveRoutine(): Flow<RoutineWithItemsAndExercises?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRoutine(routine: RoutineEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExercises(exercises: List<ExerciseEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRoutineItems(items: List<RoutineItemEntity>)

    @Query("DELETE FROM routines")
    suspend fun deleteAllRoutines()

    @Query("DELETE FROM exercises")
    suspend fun deleteAllExercises()

    @Query("DELETE FROM routine_items")
    suspend fun deleteAllRoutineItems()

    /**
     * Atomically replaces all routine data.
     * Clears existing data and inserts new routine with its items and exercises.
     */
    @Transaction
    suspend fun replaceRoutineWithItems(
        routine: RoutineEntity,
        exercises: List<ExerciseEntity>,
        items: List<RoutineItemEntity>
    ) {
        deleteAllRoutineItems()
        deleteAllExercises()
        deleteAllRoutines()
        insertRoutine(routine)
        insertExercises(exercises)
        insertRoutineItems(items)
    }
}
