package com.symma.app.domain.model

data class RoutineItem(
    val id: String,
    val orderIndex: Int,
    val targetRepetitions: Int,
    val targetSets: Int,
    val holdTimeSeconds: Int,
    val restBetweenSetsSeconds: Int?,
    val exercise: Exercise
)
