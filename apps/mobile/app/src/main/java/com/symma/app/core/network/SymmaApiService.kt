package com.symma.app.core.network

import com.symma.app.data.remote.dto.auth.LoginRequestDto
import com.symma.app.data.remote.dto.auth.LoginResponseDto
import com.symma.app.data.remote.dto.routine.RoutineDto
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface SymmaApiService {

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
}
