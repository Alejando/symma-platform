package com.symma.app.presentation.unlock

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.symma.app.core.di.CpuDispatcher
import com.symma.app.core.security.AppLock
import com.symma.app.core.security.DeviceUnlockAvailability
import com.symma.app.core.security.OfflinePinCheck
import com.symma.app.core.security.OfflinePinVerifier
import com.symma.app.core.security.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

enum class UnlockMethod {
    DEVICE_CREDENTIAL,
    ACCESS_CODE,
    SIGN_IN_AGAIN
}

data class UnlockUiState(
    val method: UnlockMethod,
    val enteredDigits: String = "",
    val attemptsLeft: Int? = null,
    val isChecking: Boolean = false
)

@HiltViewModel
class UnlockViewModel @Inject constructor(
    private val appLock: AppLock,
    deviceUnlock: DeviceUnlockAvailability,
    private val offlinePinVerifier: OfflinePinVerifier,
    private val tokenManager: TokenManager,
    @CpuDispatcher private val hashingDispatcher: CoroutineDispatcher
) : ViewModel() {

    private val _uiState = MutableStateFlow(UnlockUiState(method = unlockMethod(deviceUnlock)))
    val uiState: StateFlow<UnlockUiState> = _uiState.asStateFlow()

    init {
        if (_uiState.value.method == UnlockMethod.SIGN_IN_AGAIN) signOutKeepingPendingSessions()
    }

    /**
     * The screen lock is preferred; without one, the access code checked against a local hash keeps
     * the app usable offline; with neither, only signing in online can prove who the patient is.
     */
    private fun unlockMethod(deviceUnlock: DeviceUnlockAvailability): UnlockMethod = when {
        deviceUnlock.isAvailable() -> UnlockMethod.DEVICE_CREDENTIAL
        offlinePinVerifier.hasPin() -> UnlockMethod.ACCESS_CODE
        else -> UnlockMethod.SIGN_IN_AGAIN
    }

    fun onDeviceUnlockSucceeded() {
        appLock.unlock()
    }

    fun onDigitEntered(digit: Int) {
        val state = _uiState.value
        if (state.method != UnlockMethod.ACCESS_CODE || state.isChecking || state.enteredDigits.length >= ACCESS_CODE_LENGTH) return
        val digits = state.enteredDigits + digit
        _uiState.update { it.copy(enteredDigits = digits) }
        if (digits.length == ACCESS_CODE_LENGTH) checkAccessCode(digits)
    }

    fun onBackspace() {
        _uiState.update { state ->
            if (state.isChecking) state else state.copy(enteredDigits = state.enteredDigits.dropLast(1))
        }
    }

    private fun checkAccessCode(accessCode: String) {
        _uiState.update { it.copy(isChecking = true) }
        viewModelScope.launch {
            val check = withContext(hashingDispatcher) { offlinePinVerifier.check(accessCode) }
            when (check) {
                OfflinePinCheck.Accepted -> appLock.unlock()
                is OfflinePinCheck.Rejected -> _uiState.update {
                    it.copy(enteredDigits = "", attemptsLeft = check.attemptsLeft, isChecking = false)
                }
                OfflinePinCheck.LockedOut -> {
                    _uiState.update { it.copy(method = UnlockMethod.SIGN_IN_AGAIN, isChecking = false) }
                    signOutKeepingPendingSessions()
                }
            }
        }
    }

    /** Sessions waiting in Room are not tied to the token and are sent after the next sign-in. */
    private fun signOutKeepingPendingSessions() {
        tokenManager.clearToken()
        offlinePinVerifier.forget()
        appLock.unlock()
    }

    private companion object {
        const val ACCESS_CODE_LENGTH = 6
    }
}
