package com.symma.app.data.repository

import com.symma.app.core.network.SymmaApiService
import com.symma.app.core.security.TokenManager
import com.symma.app.data.remote.dto.auth.LoginResponseDto
import com.symma.app.domain.model.LoginFailure
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertTrue
import org.junit.Test
import retrofit2.HttpException
import retrofit2.Response
import java.io.IOException

class AuthRepositoryImplTest {

    private val api = mockk<SymmaApiService>()
    private val tokenManager = mockk<TokenManager>(relaxed = true)
    private val repository = AuthRepositoryImpl(api, tokenManager)

    private fun httpError(statusCode: Int) = HttpException(Response.error<Any>(statusCode, "error".toResponseBody()))

    @Test
    fun `successful login stores the token`() = runBlocking {
        coEvery { api.loginPatient(any()) } returns mockk<LoginResponseDto> { every { accessToken } returns "jwt" }

        val result = repository.login("123456")

        assertTrue(result.isSuccess)
        verify { tokenManager.saveToken("jwt") }
    }

    @Test
    fun `rejected PIN is reported as an invalid access code`() = runBlocking {
        coEvery { api.loginPatient(any()) } throws httpError(401)

        assertTrue(repository.login("123456").exceptionOrNull() is LoginFailure.InvalidAccessCode)
    }

    @Test
    fun `missing network is reported as no connection`() = runBlocking {
        coEvery { api.loginPatient(any()) } throws IOException("offline")

        assertTrue(repository.login("123456").exceptionOrNull() is LoginFailure.NoConnection)
    }

    @Test
    fun `server errors are not reported as an invalid PIN`() = runBlocking {
        coEvery { api.loginPatient(any()) } throws httpError(503)

        assertTrue(repository.login("123456").exceptionOrNull() is LoginFailure.ServerUnavailable)
    }

    @Test
    fun `rate limiting is reported as too many attempts`() = runBlocking {
        coEvery { api.loginPatient(any()) } throws httpError(429)

        assertTrue(repository.login("123456").exceptionOrNull() is LoginFailure.TooManyAttempts)
    }
}
