package com.symma.app.domain.repository

interface AuthRepository {
    suspend fun login(accessCode: String): Result<Unit>
}
