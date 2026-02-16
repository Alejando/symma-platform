package com.symma.app.presentation.components.camera

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView

/**
 * Face mesh overlay Composable wrapper for FaceMeshView (Android View).
 * Uses high-performance native Android Canvas drawing for better FPS.
 */
@Composable
fun FaceMeshOverlay(
    result: FaceLandmarkerHelper.ResultBundle?,
    modifier: Modifier = Modifier,
    meshColor: Color = Color(0xFF00BCD4), // Cyan
    showPoints: Boolean = false,
    lineWidth: Float = 2f
) {
    val context = LocalContext.current
    
    // Create and remember the FaceMeshView
    val faceMeshView = remember {
        FaceMeshView(context).apply {
            this.meshColor = meshColor.toArgb()
            this.showPoints = showPoints
            this.lineWidth = lineWidth
        }
    }

    // Update view properties when they change
    LaunchedEffect(meshColor) {
        faceMeshView.meshColor = meshColor.toArgb()
    }
    LaunchedEffect(showPoints) {
        faceMeshView.showPoints = showPoints
    }
    LaunchedEffect(lineWidth) {
        faceMeshView.lineWidth = lineWidth
    }

    // Update results when they change
    LaunchedEffect(result) {
        if (result != null) {
            faceMeshView.setResults(
                faceLandmarkerResult = result.result,
                imageHeight = result.inputImageHeight,
                imageWidth = result.inputImageWidth
            )
        } else {
            faceMeshView.clear()
        }
    }

    // Embed the Android View in Compose
    AndroidView(
        factory = { faceMeshView },
        modifier = modifier.fillMaxSize()
    )
}
