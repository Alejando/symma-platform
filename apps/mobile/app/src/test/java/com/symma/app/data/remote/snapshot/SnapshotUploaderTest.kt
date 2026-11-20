package com.symma.app.data.remote.snapshot

import com.symma.app.core.network.SymmaApiService
import com.symma.app.data.remote.dto.snapshot.SnapshotUploadUrlRequest
import com.symma.app.data.remote.dto.snapshot.SnapshotUploadUrlResponse
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okio.Buffer
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.io.IOException

class SnapshotUploaderTest {

    private val api = mockk<SymmaApiService>()
    private val uploadRequests = mutableListOf<Request>()
    private var storageStatus = 200

    private val storageClient = OkHttpClient.Builder()
        .addInterceptor { chain ->
            uploadRequests += chain.request()
            Response.Builder()
                .request(chain.request())
                .protocol(Protocol.HTTP_1_1)
                .code(storageStatus)
                .message("storage")
                .body("".toResponseBody())
                .build()
        }
        .build()

    private val uploader = SnapshotUploader(api, storageClient)
    private val jpeg = byteArrayOf(1, 2, 3)

    private fun givenUploadUrl() {
        coEvery { api.requestSnapshotUploadUrl(any()) } returns retrofit2.Response.success(
            SnapshotUploadUrlResponse(uploadUrl = "https://storage.example/bucket/key?X-Amz-Signature=abc", snapshotKey = "sessions/s-1/e-1.jpg", expiresInSeconds = 300)
        )
    }

    @Test
    fun `the image is PUT to the presigned URL and its key is returned`() = runBlocking {
        givenUploadUrl()

        val key = uploader.upload("s-1", "e-1", jpeg)

        assertEquals("sessions/s-1/e-1.jpg", key)
        coVerify { api.requestSnapshotUploadUrl(SnapshotUploadUrlRequest("s-1", "e-1", "image/jpeg")) }
        val put = uploadRequests.single()
        assertEquals("PUT", put.method)
        assertEquals("image/jpeg", put.body!!.contentType().toString())
        assertArrayEquals(jpeg, Buffer().also { put.body!!.writeTo(it) }.readByteArray())
    }

    @Test
    fun `the API token is never sent to the storage service`() = runBlocking {
        givenUploadUrl()

        uploader.upload("s-1", "e-1", jpeg)

        assertNull(uploadRequests.single().header("Authorization"))
    }

    @Test(expected = IOException::class)
    fun `a refused upload URL is reported as a failure`(): Unit = runBlocking {
        coEvery { api.requestSnapshotUploadUrl(any()) } returns retrofit2.Response.error(503, "".toResponseBody())

        uploader.upload("s-1", "e-1", jpeg)
    }

    @Test(expected = IOException::class)
    fun `a rejected PUT is reported as a failure`(): Unit = runBlocking {
        givenUploadUrl()
        storageStatus = 403

        uploader.upload("s-1", "e-1", jpeg)
    }
}
