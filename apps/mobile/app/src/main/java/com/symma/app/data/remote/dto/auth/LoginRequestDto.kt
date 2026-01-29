package com.symma.app.data.remote.dto.auth

import com.google.gson.annotations.SerializedName

data class LoginRequestDto(
    @SerializedName("accessCode") val accessCode: String
)
