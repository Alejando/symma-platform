package com.symma.app.data.remote.dto.session

import com.google.gson.annotations.SerializedName

data class CreateSessionRequest(
    @SerializedName("id")
    val id: String,
    
    @SerializedName("routineId")
    val routineId: String,
    
    @SerializedName("startTime")
    val startTime: String, // ISO-8601
    
    @SerializedName("endTime")
    val endTime: String, // ISO-8601

    @SerializedName("calibration")
    val calibration: CalibrationRequest? = null,

    @SerializedName("items")
    val items: List<SessionItemRequest>
)

data class CalibrationRequest(
    @SerializedName("capturedAt")
    val capturedAt: String,

    @SerializedName("values")
    val values: Map<String, Float>
)

data class SessionItemRequest(
    @SerializedName("exerciseId")
    val exerciseId: String,
    
    @SerializedName("repsCompleted")
    val repsCompleted: Int,

    @SerializedName("averageAccuracy")
    val averageAccuracy: Float? = null,

    @SerializedName("symmetryScore")
    val symmetryScore: Float? = null,

    @SerializedName("averageHoldSeconds")
    val averageHoldSeconds: Float? = null,

    @SerializedName("snapshotKey")
    val snapshotKey: String? = null,

    @SerializedName("seriesData")
    val seriesData: Any? = null
)
