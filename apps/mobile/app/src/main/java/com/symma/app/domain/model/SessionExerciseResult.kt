package com.symma.app.domain.model

data class SessionExerciseResult(
    val exerciseId: String,
    val exerciseName: String?,
    val repsCompleted: Int,
    val averageAccuracy: Float?
)
