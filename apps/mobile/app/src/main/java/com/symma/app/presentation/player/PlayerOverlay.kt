package com.symma.app.presentation.player

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import com.symma.app.presentation.components.feedback.QualityBar
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.FaceRetouchingOff
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.ScatterPlot
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun PlayerOverlay(
    state: PlayerUiState,
    symmetryScore: Float,
    isMeshVisible: Boolean,
    showMeshPoints: Boolean,
    onToggleMesh: () -> Unit,
    onToggleMeshPoints: () -> Unit,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onSkip: () -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize()
    ) {
        // --- Layer 1: Header (Always visible) ---
        TopHeader(
            isMeshVisible = isMeshVisible,
            showMeshPoints = showMeshPoints,
            onToggleMesh = onToggleMesh,
            onToggleMeshPoints = onToggleMeshPoints,
            onClose = onClose
        )

        // --- Layer 2: Main Content (State Dependent) ---
        AnimatedContent(
            targetState = state,
            transitionSpec = {
                fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(300))
            },
            label = "PlayerStateTransition",
            modifier = Modifier.fillMaxSize()
        ) { targetState ->
            when (targetState) {
                is PlayerUiState.Loading -> {
                    LoadingView()
                }
                is PlayerUiState.GetReady -> {
                    GetReadyView(state = targetState)
                }
                is PlayerUiState.Exercise -> {
                    ExerciseView(
                        state = targetState,
                        symmetryScore = symmetryScore,
                        onPause = onPause,
                        onResume = onResume,
                        onSkip = onSkip
                    )
                }
                is PlayerUiState.Rest -> {
                    RestView(
                        state = targetState,
                        onSkip = onSkip
                    )
                }
                is PlayerUiState.Completed -> {
                    CompletedView(state = targetState, onClose = onClose)
                }
            }
        }
    }
}
// ... (TopHeader, LoadingView, GetReadyView remain unchanged) ...

@Composable
private fun ExerciseView(
    state: PlayerUiState.Exercise,
    symmetryScore: Float,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onSkip: () -> Unit
) {
    // Feedback Logic: differentiate isometric (hold) vs isotonic (pulse)
    val feedbackText = if (state.isIsometric) {
        when {
            state.isTargetReached -> "Hold it!"
            symmetryScore >= 0.8f -> "Almost there!"
            symmetryScore >= 0.5f -> "Keep going..."
            symmetryScore > 0f -> "Try harder"
            else -> "Get in position"
        }
    } else {
        when {
            state.isTargetReached -> "Nice!"
            symmetryScore >= 0.8f -> "Almost!"
            symmetryScore >= 0.5f -> "Keep going..."
            symmetryScore > 0f -> "Go!"
            else -> "Get in position"
        }
    }
    
    val feedbackColor = when {
        state.isTargetReached -> Color.Green
        symmetryScore >= 0.8f -> Color(0xFFFFC107) // Yellow
        symmetryScore >= 0.5f -> Color(0xFFFFC107)
        else -> Color.White
    }

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        // Gradient Scrim at Bottom
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(450.dp)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.9f))
                    )
                )
        )

        // Bottom Content
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // --- FEEDBACK ---
            Text(
                text = feedbackText,
                style = MaterialTheme.typography.titleMedium,
                color = feedbackColor,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            QualityBar(
                score = symmetryScore * 100f,
                modifier = Modifier.padding(horizontal = 32.dp)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Exercise Name
            Text(
                text = state.exerciseName,
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            
            if (!state.instruction.isNullOrBlank()) {
                Text(
                    text = state.instruction,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.8f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // Metrics Row: Set | Timer/Rep | Rep
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // Set Counter
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "SERIES",
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.Gray
                    )
                    Text(
                        text = "${state.completedSets}/${state.totalSets}",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }

                // Center: Hold Timer (Isometric) or Rep indicator
                if (state.isIsometric && state.holdTimeTotal > 0) {
                    // Circular hold timer for Isometric exercises
                    Box(contentAlignment = Alignment.Center) {
                        val progress = if (state.holdTimeTotal > 0) {
                            1f - (state.holdTimeLeft.toFloat() / state.holdTimeTotal.toFloat())
                        } else 0f
                        
                        CircularProgressIndicator(
                            progress = { 1f },
                            modifier = Modifier.size(80.dp),
                            color = Color.White.copy(alpha = 0.2f),
                            strokeWidth = 6.dp,
                        )
                        
                        CircularProgressIndicator(
                            progress = { progress },
                            modifier = Modifier.size(80.dp),
                            color = if (state.isTargetReached) Color.Green else Color.White,
                            strokeWidth = 6.dp,
                        )
                        
                        Text(
                            text = "${state.holdTimeLeft}s",
                            style = MaterialTheme.typography.headlineMedium,
                            color = if (state.holdTimeLeft <= 3 && state.isTargetReached) Color.Green else Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                } else {
                    // For Isotonic, show a target indicator
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(80.dp)
                            .background(
                                color = if (state.isTargetReached) Color.Green.copy(alpha = 0.3f) else Color.White.copy(alpha = 0.1f),
                                shape = CircleShape
                            )
                    ) {
                        Icon(
                            imageVector = if (state.isTargetReached) Icons.Default.Check else Icons.Default.FitnessCenter,
                            contentDescription = if (state.isTargetReached) "Target reached" else "Perform gesture",
                            tint = if (state.isTargetReached) Color.Green else Color.White,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                }
                
                // Rep Counter
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "REP",
                        style = MaterialTheme.typography.labelMedium,
                        color = Color.Gray
                    )
                    Text(
                        text = "${state.completedReps}/${state.totalReps}",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Controls
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Pause/Resume
                FilledIconButton(
                    onClick = { if (state.isPaused) onResume() else onPause() },
                    modifier = Modifier.size(64.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = Color.White,
                        contentColor = Color.Black
                    )
                ) {
                    Icon(
                        imageVector = if (state.isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                        contentDescription = if (state.isPaused) "Resume" else "Pause",
                        modifier = Modifier.size(32.dp)
                    )
                }
                
                // Skip (Secondary)
                Button(
                    onClick = onSkip,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White.copy(alpha = 0.2f),
                        contentColor = Color.White
                    )
                ) {
                    Text("Skip")
                    Spacer(modifier = Modifier.size(8.dp))
                    Icon(
                        imageVector = Icons.Default.SkipNext,
                        contentDescription = "Skip Exercise",
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
@Composable
private fun TopHeader(
    isMeshVisible: Boolean,
    showMeshPoints: Boolean,
    onToggleMesh: () -> Unit,
    onToggleMeshPoints: () -> Unit,
    onClose: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // "Close" (X) button (Top Left)
        IconButton(
            onClick = onClose,
            colors = IconButtonDefaults.iconButtonColors(
                containerColor = Color.Black.copy(alpha = 0.4f),
                contentColor = Color.White
            )
        ) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Cerrar"
            )
        }
        
        // Toggle buttons (Top Right)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            // Points toggle button
            IconButton(
                onClick = onToggleMeshPoints,
                enabled = isMeshVisible,
                colors = IconButtonDefaults.iconButtonColors(
                    containerColor = if (showMeshPoints && isMeshVisible) Color(0xFFFF9800).copy(alpha = 0.8f) else Color.Black.copy(alpha = 0.4f),
                    contentColor = Color.White,
                    disabledContainerColor = Color.Black.copy(alpha = 0.2f),
                    disabledContentColor = Color.White.copy(alpha = 0.3f)
                )
            ) {
                Icon(
                    imageVector = Icons.Default.ScatterPlot,
                    contentDescription = if (showMeshPoints) "Ocultar puntos" else "Mostrar puntos"
                )
            }
            
            // Mesh toggle button
            IconButton(
                onClick = onToggleMesh,
                colors = IconButtonDefaults.iconButtonColors(
                    containerColor = if (isMeshVisible) Color(0xFF00BCD4).copy(alpha = 0.8f) else Color.Black.copy(alpha = 0.4f),
                    contentColor = Color.White
                )
            ) {
                Icon(
                    imageVector = if (isMeshVisible) Icons.Default.Face else Icons.Default.FaceRetouchingOff,
                    contentDescription = if (isMeshVisible) "Ocultar malla" else "Mostrar malla"
                )
            }
        }
    }
}

@Composable
private fun LoadingView() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(color = Color.White)
    }
}

@Composable
private fun GetReadyView(state: PlayerUiState.GetReady) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.5f)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "GET READY",
                style = MaterialTheme.typography.headlineLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Box(contentAlignment = Alignment.Center) {
                CircularProgressIndicator(
                    progress = { 1f }, // Full circle background hint could be added
                    modifier = Modifier.size(120.dp),
                    color = Color.White.copy(alpha = 0.3f),
                    strokeWidth = 8.dp,
                )
                
                CircularProgressIndicator(
                    progress = { state.countdownSeconds.toFloat() / state.totalSeconds.toFloat() },
                    modifier = Modifier.size(120.dp),
                    color = Color.Green,
                    strokeWidth = 8.dp,
                )
                
                Text(
                    text = state.countdownSeconds.toString(),
                    style = MaterialTheme.typography.displayLarge,
                    color = Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 64.sp
                )
            }
        }
    }
}

@Composable
private fun RestView(
    state: PlayerUiState.Rest,
    onSkip: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        // Orange/Amber Theme Scrim
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(350.dp)
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color(0xFFFF9800).copy(alpha = 0.9f) // Amber/Orange
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Show set progress if this is rest between sets
            if (state.isSetRest && state.totalSets > 1) {
                Text(
                    text = "Set ${state.currentSet}/${state.totalSets} Complete",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White.copy(alpha = 0.8f)
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
            
            Text(
                text = "REST",
                style = MaterialTheme.typography.headlineLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = "${state.timeLeft}s",
                style = MaterialTheme.typography.displayLarge,
                color = Color.White,
                fontWeight = FontWeight.ExtraBold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Next: ${state.nextExerciseName}",
                style = MaterialTheme.typography.titleMedium,
                color = Color.White.copy(alpha = 0.9f)
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = onSkip,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = Color(0xFFFF9800)
                ),
                modifier = Modifier.fillMaxWidth(0.5f)
            ) {
                Text("Skip Rest")
            }
        }
    }
}

@Composable
private fun CompletedView(
    state: PlayerUiState.Completed,
    onClose: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.8f)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp)
        ) {
            Text(
                text = "Great Job!",
                style = MaterialTheme.typography.displayMedium,
                color = Color.Green,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Completed ${state.totalExercises} exercises in ${state.totalTimeSeconds}s",
                style = MaterialTheme.typography.headlineSmall,
                color = Color.White,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(
                onClick = onClose,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Green,
                    contentColor = Color.White
                ),
                modifier = Modifier.fillMaxWidth(0.6f)
            ) {
                Text(
                    text = "Done",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
