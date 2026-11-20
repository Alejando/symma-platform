package com.symma.app.data.remote.snapshot

import com.symma.app.core.di.SnapshotUploadClient
import com.symma.app.core.network.SymmaApiService
import com.symma.app.data.remote.dto.snapshot.SnapshotUploadUrlRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import javax.inject.Inject

class SnapshotUploader @Inject constructor(
    private val api: SymmaApiService,
    @SnapshotUploadClient private val uploadClient: OkHttpClient
) {

    /** Returns the object key to send with the session item. */
    suspend fun upload(sessionId: String, exerciseId: String, jpeg: ByteArray): String {
        val response = api.requestSnapshotUploadUrl(SnapshotUploadUrlRequest(sessionId, exerciseId, JPEG_CONTENT_TYPE))
        val uploadTarget = response.body()?.takeIf { response.isSuccessful }
            ?: throw IOException("Snapshot upload URL refused with HTTP ${response.code()}")
        val request = Request.Builder()
            .url(uploadTarget.uploadUrl)
            .put(jpeg.toRequestBody(JPEG_CONTENT_TYPE.toMediaType()))
            .build()
        withContext(Dispatchers.IO) {
            uploadClient.newCall(request).execute().use { upload ->
                if (!upload.isSuccessful) throw IOException("Snapshot upload failed with HTTP ${upload.code}")
            }
        }
        return uploadTarget.snapshotKey
    }

    companion object {
        const val JPEG_CONTENT_TYPE = "image/jpeg"
    }
}
