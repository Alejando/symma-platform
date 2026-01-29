package com.symma.app.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.symma.app.domain.model.Routine
import com.symma.app.domain.repository.RoutineRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class HomeUiState {
    data object Loading : HomeUiState()
    data class Content(val routine: Routine) : HomeUiState()
    data object Empty : HomeUiState()
    data class Error(val message: String) : HomeUiState()
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val routineRepository: RoutineRepository
) : ViewModel() {

    private val _isRefreshing = MutableStateFlow(true)
    private val _errorMessage = MutableStateFlow<String?>(null)

    val uiState: StateFlow<HomeUiState> = combine(
        routineRepository.getRoutineFlow(),
        _isRefreshing,
        _errorMessage
    ) { routine, isRefreshing, error ->
        when {
            isRefreshing -> HomeUiState.Loading
            error != null && routine == null -> HomeUiState.Error(error)
            routine != null -> HomeUiState.Content(routine)
            else -> HomeUiState.Empty
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = HomeUiState.Loading
    )

    init {
        refreshRoutine()
    }

    fun refreshRoutine() {
        viewModelScope.launch {
            _isRefreshing.value = true
            _errorMessage.value = null

            routineRepository.refreshRoutine()
                .onFailure { exception ->
                    _errorMessage.value = exception.message ?: "Failed to sync routine"
                }

            _isRefreshing.value = false
        }
    }
}
