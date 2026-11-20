package com.symma.app.domain.model

data class ExerciseResult(
    val exerciseId: String,
    val repsCompleted: Int,
    val averageAccuracy: Float? = null,
    val symmetryScore: Float? = null,
    val averageHoldSeconds: Float? = null,
    val snapshotReference: String? = null
)
