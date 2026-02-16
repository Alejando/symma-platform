package com.symma.app.data.remote.dto.routine

import com.google.gson.annotations.SerializedName
import com.symma.app.data.remote.dto.exercise.ExerciseDto

data class RoutineItemDto(
    @SerializedName("id") val id: String,
    @SerializedName("orderIndex") val orderIndex: Int,
    @SerializedName("targetRepetitions") val targetRepetitions: Int,
    @SerializedName("targetSets") val targetSets: Int,
    @SerializedName("holdTimeSeconds") val holdTimeSeconds: Int,
    @SerializedName("restBetweenSetsSeconds") val restBetweenSetsSeconds: Int?,
    @SerializedName("difficultyLevel") val difficultyLevel: Double = 1.0,
    @SerializedName("strictMode") val strictMode: Boolean = false,
    @SerializedName("exercise") val exercise: ExerciseDto
)
