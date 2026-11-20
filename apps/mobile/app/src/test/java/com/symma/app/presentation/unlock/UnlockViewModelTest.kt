package com.symma.app.presentation.unlock

import com.symma.app.MainDispatcherRule
import com.symma.app.core.security.AppLock
import com.symma.app.core.security.DeviceUnlockAvailability
import com.symma.app.core.security.OfflinePinCheck
import com.symma.app.core.security.OfflinePinVerifier
import com.symma.app.core.security.TokenManager
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class UnlockViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule(testDispatcher)

    private val appLock = mockk<AppLock>(relaxed = true)
    private val offlinePinVerifier = mockk<OfflinePinVerifier>(relaxed = true)
    private val tokenManager = mockk<TokenManager>(relaxed = true)

    private fun viewModel(deviceLockConfigured: Boolean, accessCodeRemembered: Boolean): UnlockViewModel {
        every { offlinePinVerifier.hasPin() } returns accessCodeRemembered
        return UnlockViewModel(
            appLock,
            DeviceUnlockAvailability { deviceLockConfigured },
            offlinePinVerifier,
            tokenManager,
            testDispatcher
        )
    }

    private fun UnlockViewModel.enter(code: String) = code.forEach { digit -> onDigitEntered(digit.digitToInt()) }

    @Test
    fun `a phone with a screen lock unlocks with biometrics or the screen lock`() {
        val viewModel = viewModel(deviceLockConfigured = true, accessCodeRemembered = true)

        assertEquals(UnlockMethod.DEVICE_CREDENTIAL, viewModel.uiState.value.method)

        viewModel.onDeviceUnlockSucceeded()
        verify { appLock.unlock() }
    }

    @Test
    fun `a phone without a screen lock asks for the access code checked offline`() = runTest(testDispatcher) {
        every { offlinePinVerifier.check("123456") } returns OfflinePinCheck.Accepted
        val viewModel = viewModel(deviceLockConfigured = false, accessCodeRemembered = true)

        assertEquals(UnlockMethod.ACCESS_CODE, viewModel.uiState.value.method)
        viewModel.enter("123456")
        advanceUntilIdle()

        verify { appLock.unlock() }
        verify(exactly = 0) { tokenManager.clearToken() }
    }

    @Test
    fun `a wrong access code shows the attempts left and clears the entry`() = runTest(testDispatcher) {
        every { offlinePinVerifier.check("000000") } returns OfflinePinCheck.Rejected(attemptsLeft = 3)
        val viewModel = viewModel(deviceLockConfigured = false, accessCodeRemembered = true)

        viewModel.enter("000000")
        advanceUntilIdle()

        assertEquals(UnlockUiState(UnlockMethod.ACCESS_CODE, enteredDigits = "", attemptsLeft = 3), viewModel.uiState.value)
        verify(exactly = 0) { appLock.unlock() }
    }

    @Test
    fun `running out of attempts signs the patient out`() = runTest(testDispatcher) {
        every { offlinePinVerifier.check(any()) } returns OfflinePinCheck.LockedOut
        val viewModel = viewModel(deviceLockConfigured = false, accessCodeRemembered = true)

        viewModel.enter("000000")
        advanceUntilIdle()

        assertEquals(UnlockMethod.SIGN_IN_AGAIN, viewModel.uiState.value.method)
        verify { tokenManager.clearToken() }
    }

    @Test
    fun `with no screen lock and no remembered code the patient signs in online again`() {
        val viewModel = viewModel(deviceLockConfigured = false, accessCodeRemembered = false)

        assertEquals(UnlockMethod.SIGN_IN_AGAIN, viewModel.uiState.value.method)
        verify { tokenManager.clearToken() }
        verify { appLock.unlock() }
    }

    @Test
    fun `digits are ignored while the device unlock is in use`() {
        val viewModel = viewModel(deviceLockConfigured = true, accessCodeRemembered = true)

        viewModel.enter("123456")

        assertEquals("", viewModel.uiState.value.enteredDigits)
        verify(exactly = 0) { offlinePinVerifier.check(any()) }
    }
}
