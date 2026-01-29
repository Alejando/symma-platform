package com.symma.app.data.remote.dto.routine

import com.google.gson.annotations.SerializedName

data class RoutineDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("startDate") val startDate: String,
    @SerializedName("endDate") val endDate: String?,
    @SerializedName("status") val status: String,
    @SerializedName("items") val items: List<RoutineItemDto>
)
