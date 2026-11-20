package com.symma.app.presentation.auth

import com.symma.app.MainDispatcherRule
import com.symma.app.R
import com.symma.app.domain.model.LoginFailure
import com.symma.app.domain.repository.AuthRepository
import io.mockk.coEvery
import com.symma.app.core.sync.SessionSyncScheduler
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val authRepository = mockk<AuthRepository>()
    private val sessionSyncScheduler = mockk<SessionSyncScheduler>(relaxed = true)

    private fun enterAccessCode(viewModel: AuthViewModel) {
        "123456".forEach { digit -> viewModel.onEvent(LoginEvent.OnDigitEntered(digit.digitToInt())) }
    }

    private fun errorAfterLoginFailing(failure: LoginFailure): Int? {
        coEvery { authRepository.login(any()) } returns Result.failure(failure)
        val viewModel = AuthViewModel(authRepository, sessionSyncScheduler)
        "123456".forEach { digit -> viewModel.onEvent(LoginEvent.OnDigitEntered(digit.digitToInt())) }
        return viewModel.state.errorMessageRes
    }

    @Test
    fun `signing in again immediately sends the sessions that waited for it`() = runTest {
        coEvery { authRepository.login("123456") } returns Result.success(Unit)

        enterAccessCode(AuthViewModel(authRepository, sessionSyncScheduler))

        verify(exactly = 1) { sessionSyncScheduler.syncNow() }
    }

    @Test
    fun `a failed sign-in does not start a sync`() = runTest {
        errorAfterLoginFailing(LoginFailure.InvalidAccessCode())

        verify(exactly = 0) { sessionSyncScheduler.syncNow() }
    }

    @Test
    fun `no network shows a connection message instead of invalid PIN`() = runTest {
        assertEquals(R.string.login_no_connection, errorAfterLoginFailing(LoginFailure.NoConnection()))
    }

    @Test
    fun `rejected PIN shows invalid access code`() = runTest {
        assertEquals(R.string.login_invalid_access_code, errorAfterLoginFailing(LoginFailure.InvalidAccessCode()))
    }

    @Test
    fun `server outage shows a server message`() = runTest {
        assertEquals(R.string.login_server_unavailable, errorAfterLoginFailing(LoginFailure.ServerUnavailable()))
    }

    @Test
    fun `rate limiting shows too many attempts`() = runTest {
        assertEquals(R.string.login_too_many_attempts, errorAfterLoginFailing(LoginFailure.TooManyAttempts()))
    }
}
