package com.symma.app.presentation.player

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
import com.symma.app.presentation.components.feedback.FeedbackCue
import com.symma.app.presentation.components.feedback.rememberFeedbackPlayer

@Composable
fun PlayerScreen(
    onNavigateBack: () -> Unit,
    onNavigateToSummary: (routineId: String, duration: Long, sessionId: String) -> Unit,
    viewModel: PlayerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val faceResult by viewModel.faceResult.collectAsState()
    val gestureProgress by viewModel.gestureProgress.collectAsState()
    
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
    
    val feedbackPlayer = rememberFeedbackPlayer()
    LaunchedEffect(feedbackPlayer) {
        viewModel.events.collect { event -> feedbackPlayer.play(event.feedbackCue()) }
    }

    // 3. Handle Navigation on Completion
    LaunchedEffect(uiState) {
        val state = uiState
        if (state is PlayerUiState.Completed) {
            onNavigateToSummary(state.routineId, state.totalTimeSeconds, state.sessionId)
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
                gestureProgress = gestureProgress,
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

internal fun PlayerEvent.feedbackCue(): FeedbackCue = when (this) {
    PlayerEvent.PlayTick -> FeedbackCue.COUNTDOWN_TICK
    PlayerEvent.PlayDing -> FeedbackCue.REP_COMPLETED
    PlayerEvent.PlaySuccess -> FeedbackCue.SESSION_COMPLETED
}
