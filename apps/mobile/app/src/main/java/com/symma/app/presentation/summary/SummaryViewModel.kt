package com.symma.app.presentation.summary

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.symma.app.domain.model.SessionExerciseResult
import com.symma.app.domain.repository.SessionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

sealed interface SummaryUiState {
    data object Loading : SummaryUiState
    data class Success(val exerciseResults: List<SessionExerciseResult> = emptyList()) : SummaryUiState
    data class Error(val message: String) : SummaryUiState
}

@HiltViewModel
class SummaryViewModel @Inject constructor(
    sessionRepository: SessionRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val routineId: String = checkNotNull(savedStateHandle["routineId"])
    val durationSeconds: Long = checkNotNull(savedStateHandle["duration"]) { "Duration is required" }.toString().toLong()
    private val sessionId: String = savedStateHandle["sessionId"] ?: ""

    /** The session is saved by the Player; results appear here as soon as Room stores them. */
    val uiState: StateFlow<SummaryUiState> = sessionRepository.observeExerciseResults(sessionId)
        .map<List<SessionExerciseResult>, SummaryUiState> { results -> SummaryUiState.Success(results) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), SummaryUiState.Success())
}
