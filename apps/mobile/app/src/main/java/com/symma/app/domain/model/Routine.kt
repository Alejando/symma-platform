package com.symma.app.domain.model

data class Routine(
    val id: String,
    val name: String,
    val startDate: String,
    val endDate: String?,
    val status: String,
    val items: List<RoutineItem>
)
