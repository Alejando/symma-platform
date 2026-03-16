package com.symma.app.presentation.summary

import androidx.lifecycle.SavedStateHandle
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SummaryViewModelTest {

    @Test
    fun `uiState is immediately Success on init`() {
        val savedStateHandle = SavedStateHandle(
            mapOf(
                "routineId" to "routine-123",
                "duration" to 900L
            )
        )

        val viewModel = SummaryViewModel(savedStateHandle)

        assertEquals(SummaryUiState.Success, viewModel.uiState.value)
    }

    @Test
    fun `routineId is extracted from SavedStateHandle`() {
        val savedStateHandle = SavedStateHandle(
            mapOf(
                "routineId" to "routine-456",
                "duration" to 600L
            )
        )

        val viewModel = SummaryViewModel(savedStateHandle)

        assertEquals("routine-456", viewModel.routineId)
    }

    @Test
    fun `durationSeconds is extracted from SavedStateHandle`() {
        val savedStateHandle = SavedStateHandle(
            mapOf(
                "routineId" to "routine-789",
                "duration" to 1200L
            )
        )

        val viewModel = SummaryViewModel(savedStateHandle)

        assertEquals(1200L, viewModel.durationSeconds)
    }
}
