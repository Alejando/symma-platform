package com.symma.app.data.local.entity

import androidx.room.Embedded
import androidx.room.Junction
import androidx.room.Relation

/**
 * Represents a routine item with its associated exercise.
 * Used for intermediate mapping when fetching routine with all items.
 */
data class RoutineItemWithExercise(
    @Embedded
    val routineItem: RoutineItemEntity,

    @Relation(
        parentColumn = "exerciseId",
        entityColumn = "id"
    )
    val exercise: ExerciseEntity
)

/**
 * Represents a complete routine with all its items and their exercises.
 * This is the main data class used to fetch the full routine structure from the database.
 */
data class RoutineWithItemsAndExercises(
    @Embedded
    val routine: RoutineEntity,

    @Relation(
        entity = RoutineItemEntity::class,
        parentColumn = "id",
        entityColumn = "routineId"
    )
    val itemsWithExercises: List<RoutineItemWithExercise>
)
