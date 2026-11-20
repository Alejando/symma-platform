package com.symma.app.core.network

import com.symma.app.data.remote.dto.auth.LoginRequestDto
import com.symma.app.data.remote.dto.auth.LoginResponseDto
import com.symma.app.data.remote.dto.routine.RoutineDto
import com.symma.app.data.remote.dto.snapshot.SnapshotUploadUrlRequest
import com.symma.app.data.remote.dto.snapshot.SnapshotUploadUrlResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Headers
import retrofit2.http.POST

interface SymmaApiService {

    @Headers("$NO_AUTH_HEADER: true")
    @POST("api/v1/auth/patient/login")
    suspend fun loginPatient(
        @Body request: LoginRequestDto
    ): LoginResponseDto

    @GET("api/v1/mobile/routine/active")
    suspend fun getActiveRoutine(): Response<RoutineDto>

    @POST("api/v1/sessions")
    suspend fun createSession(
        @Body request: com.symma.app.data.remote.dto.session.CreateSessionRequest
    ): Response<Unit>

    @POST("api/v1/mobile/snapshots/upload-url")
    suspend fun requestSnapshotUploadUrl(
        @Body request: SnapshotUploadUrlRequest
    ): Response<SnapshotUploadUrlResponse>
}
