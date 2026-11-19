package com.symma.app.core.di

import com.symma.app.core.network.AuthInterceptor
import io.mockk.every
import io.mockk.mockk
import okhttp3.ConnectionSpec
import okhttp3.Request
import okhttp3.logging.HttpLoggingInterceptor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.net.UnknownServiceException

class NetworkModuleTest {

    private val authInterceptor = mockk<AuthInterceptor> {
        every { intercept(any()) } answers { firstArg<okhttp3.Interceptor.Chain>().let { it.proceed(it.request()) } }
    }

    @Test
    fun `release client does not log traffic`() {
        val client = NetworkModule.createOkHttpClient(authInterceptor, isDebugBuild = false)

        assertTrue(client.interceptors.none { it is HttpLoggingInterceptor })
    }

    @Test
    fun `release client only allows modern TLS`() {
        val client = NetworkModule.createOkHttpClient(authInterceptor, isDebugBuild = false)

        assertEquals(listOf(ConnectionSpec.MODERN_TLS), client.connectionSpecs)
    }

    @Test(expected = UnknownServiceException::class)
    fun `release client refuses plain HTTP`() {
        val client = NetworkModule.createOkHttpClient(authInterceptor, isDebugBuild = false)

        client.newCall(Request.Builder().url("http://127.0.0.1:1/").build()).execute()
    }

    @Test
    fun `debug client logs only request lines without headers or bodies`() {
        val client = NetworkModule.createOkHttpClient(authInterceptor, isDebugBuild = true)

        val logging = client.interceptors.filterIsInstance<HttpLoggingInterceptor>().single()
        assertEquals(HttpLoggingInterceptor.Level.BASIC, logging.level)
    }

    @Test
    fun `debug client allows cleartext for the local API`() {
        val client = NetworkModule.createOkHttpClient(authInterceptor, isDebugBuild = true)

        assertTrue(ConnectionSpec.CLEARTEXT in client.connectionSpecs)
    }
}
