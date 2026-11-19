package com.symma.app.core.network

import com.symma.app.core.security.SessionExpiryNotifier
import com.symma.app.core.security.TokenManager
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

const val NO_AUTH_HEADER = "No-Auth"

@Singleton
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager,
    private val sessionExpiryNotifier: SessionExpiryNotifier
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        if (original.header(NO_AUTH_HEADER) != null) {
            return chain.proceed(original.newBuilder().removeHeader(NO_AUTH_HEADER).build())
        }

        val token = tokenManager.getToken()
            ?: return chain.proceed(original)

        val response = chain.proceed(original.newBuilder().header("Authorization", "Bearer $token").build())
        if (response.code == HTTP_UNAUTHORIZED) {
            tokenManager.clearToken()
            sessionExpiryNotifier.notifySessionExpired()
        }
        return response
    }

    private companion object {
        const val HTTP_UNAUTHORIZED = 401
    }
}
