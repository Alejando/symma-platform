package com.symma.app.data.remote.dto.routine

import com.google.gson.annotations.SerializedName
import com.symma.app.data.remote.dto.exercise.ExerciseDto

data class RoutineItemDto(
    @SerializedName("id") val id: String,
    @SerializedName("orderIndex") val orderIndex: Int,
    @SerializedName("repsPerSet") val targetRepetitions: Int,
    @SerializedName("sets") val targetSets: Int,
    @SerializedName("targetHoldSeconds") val holdTimeSeconds: Int,
    @SerializedName("restBetweenSets") val restBetweenSetsSeconds: Int?,
    @SerializedName("difficultyLevel") val difficultyLevel: Double = 1.0,
    @SerializedName("strictMode") val strictMode: Boolean = false,
    @SerializedName("exercise") val exercise: ExerciseDto,
    @SerializedName("engageThreshold") val engageThreshold: Float? = null,
    @SerializedName("releaseThreshold") val releaseThreshold: Float? = null
)
