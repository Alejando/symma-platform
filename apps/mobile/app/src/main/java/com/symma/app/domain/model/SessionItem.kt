package com.symma.app.domain.model

data class SessionItem(
    val id: String,
    val exerciseId: String,
    val repsCompleted: Int,
    val averageAccuracy: Float?
)
