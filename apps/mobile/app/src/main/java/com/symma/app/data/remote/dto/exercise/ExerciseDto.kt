package com.symma.app.data.remote.dto.exercise

import com.google.gson.annotations.SerializedName

data class ExerciseDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("keyName") val keyName: String,
    @SerializedName("description") val description: String?,
    @SerializedName("type") val type: String,
    @SerializedName("category") val category: String,
    @SerializedName("mobileModule") val mobileModule: String? = null,
    @SerializedName("assetAnimationUrl") val assetAnimationUrl: String?,
    @SerializedName("assetTutorialVideoUrl") val assetTutorialVideoUrl: String?
)
