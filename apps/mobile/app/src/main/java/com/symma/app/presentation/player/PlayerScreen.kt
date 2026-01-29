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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import com.symma.app.presentation.components.camera.CameraPreview
import com.symma.app.presentation.components.camera.CameraPermissionWrapper

import com.symma.app.presentation.components.camera.FaceMeshOverlay

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
    
    // 1. Keep Screen On
    DisposableEffect(Unit) {
        val window = (context as? android.app.Activity)?.window
        window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        
        onDispose {
            window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }
    
    // 2. Handle Events (Audio/Haptic) - Placeholder for now as we don't have SoundManager inject yet
    // We could collect events here if we had a sound player. 
    // For now, we mainly focus on UI updates.
    
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
            
            // Layer 1: Face Mesh Overlay
            FaceMeshOverlay(
                result = faceResult,
                modifier = Modifier.fillMaxSize()
            )
            
            // Layer 2: UI Overlay
            PlayerOverlay(
                state = uiState,
                symmetryScore = symmetryScore,
                onPause = viewModel::pause,
                onResume = viewModel::resume,
                onSkip = viewModel::skip,
                onClose = onNavigateBack
            )
        }
    }
}
