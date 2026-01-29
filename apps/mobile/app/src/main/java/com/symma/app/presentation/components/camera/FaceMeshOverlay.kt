package com.symma.app.presentation.components.camera

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PointMode
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import com.google.mediapipe.tasks.components.containers.NormalizedLandmark

@Composable
fun FaceMeshOverlay(
    result: FaceLandmarkerHelper.ResultBundle?,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val landmarks = result?.result?.faceLandmarks()
        if (landmarks.isNullOrEmpty()) return@Canvas

        val firstFace = landmarks[0]
        val width = size.width
        val height = size.height

        // Define key landmarks indices
        val lipsIndices = listOf(61, 291, 0, 17)
        val leftEyeIndices = listOf(33, 263) // Simple approximation
        // Add more if needed

        // Draw all landmarks as small white points
        val allPoints = firstFace.map { landmark ->
            // Mirror X coordinate for front camera: 1.0 - x
            val x = (1.0f - landmark.x()) * width
            val y = landmark.y() * height
            Offset(x, y)
        }
        
        drawPoints(
            points = allPoints,
            pointMode = PointMode.Points,
            color = Color.White.copy(alpha = 0.5f),
            strokeWidth = 2.dp.toPx(),
            cap = StrokeCap.Round
        )

        // Draw Lips (Green circles)
        lipsIndices.forEach { index ->
            if (index < firstFace.size) {
                val landmark = firstFace[index]
                val x = (1.0f - landmark.x()) * width
                val y = landmark.y() * height
                drawCircle(
                    color = Color.Green,
                    radius = 4.dp.toPx(),
                    center = Offset(x, y)
                )
            }
        }

        // Draw Eyes (Green circles)
        leftEyeIndices.forEach { index ->
            if (index < firstFace.size) {
                val landmark = firstFace[index]
                val x = (1.0f - landmark.x()) * width
                val y = landmark.y() * height
                drawCircle(
                    color = Color.Green,
                    radius = 4.dp.toPx(),
                    center = Offset(x, y)
                )
            }
        }
    }
}
