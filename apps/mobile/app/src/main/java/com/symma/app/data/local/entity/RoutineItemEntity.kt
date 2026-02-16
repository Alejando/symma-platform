package com.symma.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "routine_items",
    foreignKeys = [
        ForeignKey(
            entity = RoutineEntity::class,
            parentColumns = ["id"],
            childColumns = ["routineId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = ExerciseEntity::class,
            parentColumns = ["id"],
            childColumns = ["exerciseId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("routineId"),
        Index("exerciseId")
    ]
)
data class RoutineItemEntity(
    @PrimaryKey
    val id: String,
    val routineId: String,
    val exerciseId: String,
    val orderIndex: Int,
    val targetRepetitions: Int,
    val targetSets: Int,
    val holdTimeSeconds: Int,
    val restBetweenSetsSeconds: Int?,
    val difficultyLevel: Double = 1.0,
    val strictMode: Boolean = false
)
