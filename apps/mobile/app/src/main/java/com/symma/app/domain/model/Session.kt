package com.symma.app.domain.model

data class Session(
    val id: String,
    val routineId: String,
    val startTime: Long,
    val endTime: Long,
    val durationSeconds: Int,
    val score: Float,
    val syncStatus: SyncStatus,
    val items: List<SessionItem>
)
