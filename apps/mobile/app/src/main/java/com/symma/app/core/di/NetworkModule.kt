package com.symma.app.core.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.ConnectionSpec
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.symma.app.BuildConfig
import com.symma.app.core.network.AuthInterceptor
import com.symma.app.core.network.NullOnEmptyConverterFactory
import com.symma.app.core.network.SymmaApiService
import com.symma.app.core.security.SessionExpiryNotifier
import com.symma.app.core.security.TokenManager
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideAuthInterceptor(
        tokenManager: TokenManager,
        sessionExpiryNotifier: SessionExpiryNotifier
    ): AuthInterceptor = AuthInterceptor(tokenManager, sessionExpiryNotifier)

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient =
        createOkHttpClient(authInterceptor, isDebugBuild = BuildConfig.DEBUG)

    /**
     * Request and response bodies carry the patient PIN and the JWT, so they are never logged;
     * release builds only speak modern TLS and refuse plain HTTP.
     */
    internal fun createOkHttpClient(authInterceptor: AuthInterceptor, isDebugBuild: Boolean): OkHttpClient {
        val builder = OkHttpClient.Builder().addInterceptor(authInterceptor)
        if (isDebugBuild) {
            builder
                .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
                .connectionSpecs(listOf(ConnectionSpec.MODERN_TLS, ConnectionSpec.CLEARTEXT))
        } else {
            builder.connectionSpecs(listOf(ConnectionSpec.MODERN_TLS))
        }
        return builder.build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(NullOnEmptyConverterFactory())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    @Provides
    @Singleton
    fun provideSymmaApiService(retrofit: Retrofit): SymmaApiService {
        return retrofit.create(SymmaApiService::class.java)
    }
}
