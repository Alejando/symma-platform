package com.symma.app.data.remote.dto.session

import com.google.gson.annotations.SerializedName

data class CreateSessionRequest(
    @SerializedName("id")
    val id: String? = null, // Client-generated UUID for idempotency
    
    @SerializedName("routineId")
    val routineId: String,
    
    @SerializedName("startTime")
    val startTime: String, // ISO-8601
    
    @SerializedName("endTime")
    val endTime: String, // ISO-8601
    
    @SerializedName("items")
    val items: List<SessionItemRequest>
)

data class SessionItemRequest(
    @SerializedName("exerciseId")
    val exerciseId: String,
    
    @SerializedName("repsCompleted")
    val repsCompleted: Int,

    @SerializedName("averageAccuracy")
    val averageAccuracy: Float? = null, // RFC-026: AI Metric

    @SerializedName("seriesData")
    val seriesData: Any? = null
)
