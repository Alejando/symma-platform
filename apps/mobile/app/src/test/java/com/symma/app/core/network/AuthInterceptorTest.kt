package com.symma.app.core.network

import com.symma.app.core.security.SessionExpiryNotifier
import com.symma.app.core.security.TokenManager
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import io.mockk.verify
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AuthInterceptorTest {

    private val tokenManager = mockk<TokenManager> {
        every { getToken() } returns "jwt-token"
        every { clearToken() } just runs
    }
    private val sessionExpiryNotifier = mockk<SessionExpiryNotifier>(relaxed = true)
    private var lastRequest: Request? = null

    private fun clientAnswering(statusCode: Int) = OkHttpClient.Builder()
        .addInterceptor(AuthInterceptor(tokenManager, sessionExpiryNotifier))
        .addInterceptor(Interceptor { chain ->
            lastRequest = chain.request()
            Response.Builder()
                .request(chain.request())
                .protocol(Protocol.HTTP_1_1)
                .code(statusCode)
                .message("status $statusCode")
                .body("".toResponseBody())
                .build()
        })
        .build()

    private fun call(statusCode: Int, request: Request = Request.Builder().url("https://api.example.test/sessions").build()) {
        clientAnswering(statusCode).newCall(request).execute().close()
    }

    @Test
    fun `adds the bearer token to authenticated requests`() {
        call(200)

        assertEquals("Bearer jwt-token", lastRequest?.header("Authorization"))
    }

    @Test
    fun `401 on an authenticated request clears the token and signals session expiry`() {
        call(401)

        verify { tokenManager.clearToken() }
        verify { sessionExpiryNotifier.notifySessionExpired() }
    }

    @Test
    fun `successful responses keep the session`() {
        call(200)

        verify(exactly = 0) { tokenManager.clearToken() }
        verify(exactly = 0) { sessionExpiryNotifier.notifySessionExpired() }
    }

    @Test
    fun `login requests travel without token and a rejected PIN does not expire the session`() {
        val login = Request.Builder()
            .url("https://api.example.test/api/v1/auth/patient/login")
            .header(NO_AUTH_HEADER, "true")
            .build()

        call(401, login)

        assertNull(lastRequest?.header("Authorization"))
        assertNull(lastRequest?.header(NO_AUTH_HEADER))
        verify(exactly = 0) { tokenManager.clearToken() }
        verify(exactly = 0) { sessionExpiryNotifier.notifySessionExpired() }
    }
}
