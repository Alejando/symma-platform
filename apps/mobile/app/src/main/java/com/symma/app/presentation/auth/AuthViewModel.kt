package com.symma.app.presentation.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.symma.app.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    var state by mutableStateOf(LoginState())
        private set

    private val _uiEvent = Channel<LoginUiEvent>()
    val uiEvent = _uiEvent.receiveAsFlow()

    fun onEvent(event: LoginEvent) {
        when (event) {
            is LoginEvent.OnDigitEntered -> {
                if (state.pin.length < 6 && !state.isLoading) {
                    val newPin = state.pin + event.digit
                    state = state.copy(pin = newPin, error = null)
                    if (newPin.length == 6) {
                        login(newPin)
                    }
                }
            }
            is LoginEvent.OnBackspace -> {
                if (state.pin.isNotEmpty() && !state.isLoading) {
                    state = state.copy(pin = state.pin.dropLast(1), error = null)
                }
            }
        }
    }

    private fun login(pin: String) {
        viewModelScope.launch {
            state = state.copy(isLoading = true)
            // Call login with PIN (access code) only
            val result = authRepository.login(pin)
            
            state = state.copy(isLoading = false)
            
            result.onSuccess {
                _uiEvent.send(LoginUiEvent.NavigateToHome)
            }.onFailure {
                state = state.copy(pin = "", error = "Invalid Access Code")
            }
        }
    }
}

data class LoginState(
    val pin: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

sealed interface LoginEvent {
    data class OnDigitEntered(val digit: Int) : LoginEvent
    object OnBackspace : LoginEvent
}

sealed interface LoginUiEvent {
    object NavigateToHome : LoginUiEvent
}
