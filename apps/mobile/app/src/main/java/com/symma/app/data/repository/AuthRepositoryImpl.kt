package com.symma.app.data.repository

import com.symma.app.core.network.SymmaApiService
import com.symma.app.core.security.TokenManager
import com.symma.app.data.remote.dto.auth.LoginRequestDto
import com.symma.app.domain.repository.AuthRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
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
                // Call API
                val request = LoginRequestDto(accessCode = accessCode)
                val response = api.loginPatient(request)
                
                // Save Token
                tokenManager.saveToken(response.accessToken)
                
                Result.success(Unit)
            } catch (e: Exception) {
                e.printStackTrace()
                Result.failure(e)
            }
        }
    }
}
