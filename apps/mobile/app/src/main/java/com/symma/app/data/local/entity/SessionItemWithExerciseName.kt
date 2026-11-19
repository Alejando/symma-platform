package com.symma.app.data.local.entity

import androidx.room.ColumnInfo

data class SessionItemWithExerciseName(
    @ColumnInfo(name = "exercise_id") val exerciseId: String,
    @ColumnInfo(name = "exercise_name") val exerciseName: String?,
    @ColumnInfo(name = "reps_completed") val repsCompleted: Int,
    @ColumnInfo(name = "average_accuracy") val averageAccuracy: Float?
)
