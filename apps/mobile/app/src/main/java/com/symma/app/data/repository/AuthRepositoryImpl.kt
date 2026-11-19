package com.symma.app.data.repository

import com.symma.app.core.network.SymmaApiService
import com.symma.app.core.security.TokenManager
import com.symma.app.data.remote.dto.auth.LoginRequestDto
import com.symma.app.domain.model.LoginFailure
import com.symma.app.domain.repository.AuthRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: SymmaApiService,
    private val tokenManager: TokenManager
) : AuthRepository {

    override suspend fun login(accessCode: String): Result<Unit> {
        return withContext(Dispatchers.IO) {
            try {
                val response = api.loginPatient(LoginRequestDto(accessCode = accessCode))
                tokenManager.saveToken(response.accessToken)
                Result.success(Unit)
            } catch (e: HttpException) {
                Result.failure(loginFailureFor(e.code()))
            } catch (e: IOException) {
                Result.failure(LoginFailure.NoConnection())
            } catch (e: Exception) {
                Result.failure(LoginFailure.ServerUnavailable())
            }
        }
    }

    private fun loginFailureFor(statusCode: Int): LoginFailure = when (statusCode) {
        429 -> LoginFailure.TooManyAttempts()
        in 400..499 -> LoginFailure.InvalidAccessCode()
        else -> LoginFailure.ServerUnavailable()
    }
}
