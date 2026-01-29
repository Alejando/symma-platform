package com.symma.app.presentation.summary

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.symma.app.domain.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface SummaryUiState {
    data object Loading : SummaryUiState
    data object Success : SummaryUiState
    data class Error(val message: String) : SummaryUiState
}

@HiltViewModel
class SummaryViewModel @Inject constructor(
    private val sessionRepository: SessionRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow<SummaryUiState>(SummaryUiState.Loading)
    val uiState: StateFlow<SummaryUiState> = _uiState.asStateFlow()
    
    // Arguments passed via Navigation
    private val routineId: String = checkNotNull(savedStateHandle["routineId"])
    private val durationSeconds: Long = checkNotNull(savedStateHandle["duration"]) { "Duration is required" }.toString().toLong()

    init {
        submitSession()
    }
    
    private fun submitSession() {
        viewModelScope.launch {
            _uiState.value = SummaryUiState.Loading
            
            val result = sessionRepository.submitSession(
                routineId = routineId,
                durationSeconds = durationSeconds
            )
            
            result.onSuccess {
                _uiState.value = SummaryUiState.Success
            }.onFailure { _ ->
                // For MVP, even failure (offline) should ideally show success or "Saved Offline".
                // We'll show success but log the error (logging happened in Repo).
                // Or if we want to be honest to the user:
                // _uiState.value = SummaryUiState.Error(e.message ?: "Unknown error")
                
                // RFC says: "If Fail ... returning 'Success' to the UI is acceptable"
                // So let's show success to give positive reinforcement.
                _uiState.value = SummaryUiState.Success
            }
        }
    }
}
