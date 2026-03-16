package com.symma.app.presentation.summary

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

sealed interface SummaryUiState {
    data object Loading : SummaryUiState
    data object Success : SummaryUiState
    data class Error(val message: String) : SummaryUiState
}

@HiltViewModel
class SummaryViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow<SummaryUiState>(SummaryUiState.Success)
    val uiState: StateFlow<SummaryUiState> = _uiState.asStateFlow()
    
    // Arguments passed via Navigation (kept for display purposes)
    val routineId: String = checkNotNull(savedStateHandle["routineId"])
    val durationSeconds: Long = checkNotNull(savedStateHandle["duration"]) { "Duration is required" }.toString().toLong()

    // Session is already saved by PlayerViewModel via SaveAndSyncSessionUseCase
    // No need to call submitSession() here - just show success immediately
}
