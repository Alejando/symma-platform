package com.symma.app.data.remote.dto.auth

import com.google.gson.annotations.SerializedName

data class LoginResponseDto(
    @SerializedName("accessToken") val accessToken: String
)
