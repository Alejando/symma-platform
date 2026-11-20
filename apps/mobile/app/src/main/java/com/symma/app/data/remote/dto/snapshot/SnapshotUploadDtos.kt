package com.symma.app.data.remote.dto.snapshot

import com.google.gson.annotations.SerializedName

data class SnapshotUploadUrlRequest(
    @SerializedName("sessionId") val sessionId: String,
    @SerializedName("exerciseId") val exerciseId: String,
    @SerializedName("contentType") val contentType: String
)

data class SnapshotUploadUrlResponse(
    @SerializedName("uploadUrl") val uploadUrl: String,
    @SerializedName("snapshotKey") val snapshotKey: String,
    @SerializedName("expiresInSeconds") val expiresInSeconds: Int
)
