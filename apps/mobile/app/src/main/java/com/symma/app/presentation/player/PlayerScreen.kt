package com.symma.app.presentation.player

import android.media.AudioManager
import android.media.ToneGenerator
import android.util.Log
import android.view.WindowManager
import android.widget.Toast
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import com.symma.app.presentation.components.camera.CameraPreview
import com.symma.app.presentation.components.camera.CameraPermissionWrapper
import com.symma.app.presentation.components.camera.FaceMeshOverlay
import kotlinx.coroutines.flow.collectLatest

@Composable
fun PlayerScreen(
    onNavigateBack: () -> Unit,
    onNavigateToSummary: (routineId: String, duration: Long) -> Unit,
    viewModel: PlayerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val faceResult by viewModel.faceResult.collectAsState()
    val symmetryScore by viewModel.symmetryScore.collectAsState()
    
    // FaceMesh visibility toggles
    var isMeshVisible by remember { mutableStateOf(true) }
    var showMeshPoints by remember { mutableStateOf(false) }
    
    // 1. Keep Screen On
    DisposableEffect(Unit) {
        val window = (context as? android.app.Activity)?.window
        window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        onDispose {
            window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }
    
    // 2. Handle PlayerEvents for audio feedback
    LaunchedEffect(Unit) {
        viewModel.events.collectLatest { event ->
            playPlayerEventSound(event)
        }
    }

    // 3. Handle Navigation on Completion
    LaunchedEffect(uiState) {
        val state = uiState
        if (state is PlayerUiState.Completed) {
            onNavigateToSummary(state.routineId, state.totalTimeSeconds)
        }
    }

    // Wrap the entire screen content in permission handling
    CameraPermissionWrapper {
        Box(modifier = Modifier.fillMaxSize()) {
            // Layer 0: Camera Preview (Background)
            CameraPreview(
                modifier = Modifier.fillMaxSize(),
                landmarkerListener = viewModel
            )
            
            // Layer 1: Face Mesh Overlay (togglable)
            if (isMeshVisible) {
                FaceMeshOverlay(
                    result = faceResult,
                    modifier = Modifier.fillMaxSize(),
                    showPoints = showMeshPoints
                )
            }
            
            // Layer 2: UI Overlay
            PlayerOverlay(
                state = uiState,
                symmetryScore = symmetryScore,
                isMeshVisible = isMeshVisible,
                showMeshPoints = showMeshPoints,
                onToggleMesh = { isMeshVisible = !isMeshVisible },
                onToggleMeshPoints = { showMeshPoints = !showMeshPoints },
                onPause = viewModel::pause,
                onResume = viewModel::resume,
                onSkip = viewModel::skip,
                onClose = onNavigateBack
            )
        }
    }
}

private const val PLAYER_SCREEN_TAG = "PlayerScreen"

/**
 * Plays a lightweight tone for the given [PlayerEvent].
 * Uses [ToneGenerator] with STREAM_MUSIC. Gracefully no-ops if audio is unavailable.
 */
private fun playPlayerEventSound(event: PlayerEvent) {
    try {
        val (toneType, durationMs) = when (event) {
            PlayerEvent.PlayTick -> ToneGenerator.TONE_PROP_BEEP to 80
            PlayerEvent.PlayDing -> ToneGenerator.TONE_PROP_ACK to 200
            PlayerEvent.PlaySuccess -> ToneGenerator.TONE_CDMA_CONFIRM to 400
        }
        val toneGen = ToneGenerator(AudioManager.STREAM_MUSIC, ToneGenerator.MAX_VOLUME)
        toneGen.startTone(toneType, durationMs)
        toneGen.release()
    } catch (e: Exception) {
        Log.w(PLAYER_SCREEN_TAG, "Audio playback unavailable for event $event: ${e.message}")
    }
}
