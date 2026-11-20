package com.symma.app.presentation.summary

import com.symma.app.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.symma.app.domain.model.SessionExerciseResult
import com.symma.app.presentation.components.design.SymmaButton
import com.symma.app.presentation.components.design.SymmaCard
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import kotlin.math.roundToInt
import com.symma.app.presentation.components.design.SymmaScaffold

@Composable
fun SummaryScreen(
    onNavigateHome: () -> Unit,
    viewModel: SummaryViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    SymmaScaffold { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            when (uiState) {
                is SummaryUiState.Loading -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = stringResource(R.string.summary_saving),
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
                
                is SummaryUiState.Success -> {
                    SuccessContent(
                        exerciseResults = (uiState as SummaryUiState.Success).exerciseResults,
                        onNavigateHome = onNavigateHome
                    )
                }
                
                is SummaryUiState.Error -> {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = stringResource(R.string.summary_error),
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.headlineSmall
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        SymmaButton(
                            text = stringResource(R.string.summary_go_home),
                            onClick = onNavigateHome
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SuccessContent(
    exerciseResults: List<SessionExerciseResult>,
    onNavigateHome: () -> Unit
) {
    Column(
        modifier = Modifier.verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Big Checkmark
        Box(
            modifier = Modifier
                .size(120.dp)
                .background(Color(0xFF4CAF50), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(64.dp)
            )
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Text(
            text = stringResource(R.string.summary_session_complete),
            style = MaterialTheme.typography.displayLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = stringResource(R.string.summary_great_progress),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        if (exerciseResults.isNotEmpty()) {
            Spacer(modifier = Modifier.height(24.dp))
            exerciseResults.forEach { result ->
                ExerciseResultRow(result)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
        
        SymmaButton(
            text = stringResource(R.string.summary_finish),
            onClick = onNavigateHome,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun ExerciseResultRow(result: SessionExerciseResult) {
    SymmaCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = result.exerciseName ?: stringResource(R.string.summary_unknown_exercise),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = stringResource(R.string.summary_exercise_reps, result.repsCompleted),
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = result.accuracyPercent()
                    ?.let { stringResource(R.string.summary_exercise_accuracy, it) }
                    ?: stringResource(R.string.summary_exercise_accuracy_unavailable),
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = result.symmetryPercent()
                    ?.let { stringResource(R.string.summary_exercise_symmetry, it) }
                    ?: stringResource(R.string.summary_exercise_symmetry_unavailable),
                style = MaterialTheme.typography.bodyMedium
            )
            result.averageHoldSeconds?.let { holdSeconds ->
                Text(
                    text = stringResource(R.string.summary_exercise_hold, holdSeconds),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

internal fun SessionExerciseResult.accuracyPercent(): Int? = averageAccuracy?.toDisplayPercent()

internal fun SessionExerciseResult.symmetryPercent(): Int? = symmetryScore?.toDisplayPercent()

private fun Float.toDisplayPercent(): Int = roundToInt().coerceIn(0, 100)
