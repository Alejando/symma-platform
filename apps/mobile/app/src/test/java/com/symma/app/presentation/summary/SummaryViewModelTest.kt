package com.symma.app.presentation.summary

import androidx.lifecycle.SavedStateHandle
import app.cash.turbine.test
import com.symma.app.MainDispatcherRule
import com.symma.app.domain.model.SessionExerciseResult
import com.symma.app.domain.repository.SessionRepository
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SummaryViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val storedResults = MutableStateFlow<List<SessionExerciseResult>>(emptyList())
    private val sessionRepository = mockk<SessionRepository> {
        every { observeExerciseResults("session-1") } returns storedResults
    }

    private fun createViewModel(routineId: String = "routine-123", duration: Long = 900L) = SummaryViewModel(
        sessionRepository,
        SavedStateHandle(mapOf("routineId" to routineId, "duration" to duration, "sessionId" to "session-1"))
    )

    @Test
    fun `routineId is extracted from SavedStateHandle`() {
        assertEquals("routine-456", createViewModel(routineId = "routine-456").routineId)
    }

    @Test
    fun `durationSeconds is extracted from SavedStateHandle`() {
        assertEquals(1200L, createViewModel(duration = 1200L).durationSeconds)
    }

    @Test
    fun `summary lists reps and accuracy per exercise once the session is stored`() = runTest {
        val viewModel = createViewModel()
        val results = listOf(
            SessionExerciseResult("ex-1", "Smile", repsCompleted = 10, averageAccuracy = 87.4f),
            SessionExerciseResult("ex-2", "Brows", repsCompleted = 0, averageAccuracy = null)
        )

        viewModel.uiState.test {
            assertEquals(SummaryUiState.Success(emptyList()), awaitItem())

            storedResults.value = results

            assertEquals(SummaryUiState.Success(results), awaitItem())
        }
    }

    @Test
    fun `accuracy stored on 0 to 100 is shown rounded without rescaling`() {
        assertEquals(87, SessionExerciseResult("ex-1", "Smile", 10, 87.4f).accuracyPercent())
        assertEquals(1, SessionExerciseResult("ex-1", "Smile", 10, 0.874f).accuracyPercent())
        assertEquals(100, SessionExerciseResult("ex-1", "Smile", 10, 120f).accuracyPercent())
        assertNull(SessionExerciseResult("ex-1", "Smile", 10, null).accuracyPercent())
    }
}
