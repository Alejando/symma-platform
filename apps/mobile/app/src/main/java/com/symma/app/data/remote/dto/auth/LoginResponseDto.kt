package com.symma.app.data.remote.dto.auth

import com.google.gson.annotations.SerializedName

data class LoginResponseDto(
    @SerializedName("access_token") val accessToken: String
)
