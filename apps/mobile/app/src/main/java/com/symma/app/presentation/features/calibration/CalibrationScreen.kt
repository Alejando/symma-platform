package com.symma.app.presentation.features.calibration

import android.content.Context
import android.graphics.RectF
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.symma.app.domain.logic.CalibrationUtils
import com.symma.app.domain.logic.DistanceState
import com.symma.app.presentation.components.camera.CameraPermissionWrapper
import com.symma.app.presentation.components.camera.CameraPreview
import com.symma.app.presentation.components.camera.FaceLandmarkerHelper

@Composable
fun CalibrationScreen(
    viewModel: CalibrationViewModel = hiltViewModel(),
    onCalibrationComplete: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    
    var screenWidth by remember { mutableStateOf(1080) }
    var screenHeight by remember { mutableStateOf(1920) }

    // Update screen dimensions
    LaunchedEffect(screenWidth, screenHeight) {
        viewModel.setScreenDimensions(screenWidth, screenHeight)
    }

    // Handle feedback (sound & vibration)
    LaunchedEffect(uiState.shouldPlayCompletionSound, uiState.shouldVibrate) {
        if (uiState.shouldPlayCompletionSound) {
            playCompletionSound()
        }
        if (uiState.shouldVibrate) {
            triggerVibration(context)
        }
        if (uiState.shouldPlayCompletionSound || uiState.shouldVibrate) {
            viewModel.onFeedbackConsumed()
        }
    }

    val landmarkerListener = remember(viewModel) {
        object : FaceLandmarkerHelper.LandmarkerListener {
            override fun onError(error: String, errorCode: Int) {}

            override fun onResults(resultBundle: FaceLandmarkerHelper.ResultBundle) {
                val result = resultBundle.result
                val landmarks = result.faceLandmarks().firstOrNull()
                val imageWidth = resultBundle.inputImageWidth
                val imageHeight = resultBundle.inputImageHeight
                
                // Get face box for positioning check
                val faceBox = if (landmarks != null) {
                    CalibrationUtils.getFaceBoundingBox(landmarks, imageWidth, imageHeight)
                } else null
                
                // Pass image dimensions for correct ratio calculation
                viewModel.onFaceDetected(landmarks != null, faceBox, imageWidth, imageHeight)
                viewModel.processFrame(result, imageWidth, imageHeight)
            }
        }
    }

    CameraPermissionWrapper {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .onSizeChanged { size ->
                    screenWidth = size.width
                    screenHeight = size.height
                }
        ) {
        // Camera Preview (always shown except on complete)
        if (uiState.phase != CalibrationPhase.COMPLETE) {
            CameraPreview(
                modifier = Modifier.fillMaxSize(),
                landmarkerListener = landmarkerListener
            )
            
            // Face Silhouette Guide (only in positioning phase)
            if (uiState.phase == CalibrationPhase.POSITIONING) {
                FaceSilhouetteOverlay(
                    distanceState = uiState.distanceState,
                    isFaceInPosition = uiState.isFaceInPosition,
                    modifier = Modifier.fillMaxSize()
                )
            }
        } else {
            // Complete screen
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "¡Calibración Completa!",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onCalibrationComplete) {
                        Text("Continuar")
                    }
                }
            }
        }
        
        // Debug overlay - top left
        DebugCalibrationOverlay(
            uiState = uiState,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(16.dp)
        )
        
        // Progress and Instructions overlay
        if (uiState.phase != CalibrationPhase.COMPLETE) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(bottom = 60.dp)
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Circular progress indicator (during capture phases)
                if (uiState.phase == CalibrationPhase.NEUTRAL_CAPTURE || 
                    uiState.phase == CalibrationPhase.ACTIVE_CAPTURE) {
                    CaptureProgressIndicator(
                        progress = uiState.captureProgress,
                        isStable = uiState.isHeadStable,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                }
                
                // Head stability warning
                if (!uiState.isHeadStable && uiState.phase != CalibrationPhase.POSITIONING) {
                    Text(
                        text = "⚠️ Mantén la cabeza quieta",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFFFF9800),
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.7f), RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                // Gesture intensity warning (only during active capture)
                if (uiState.phase == CalibrationPhase.ACTIVE_CAPTURE && 
                    uiState.isHeadStable && 
                    !uiState.isGestureIntensitySufficient) {
                    Text(
                        text = "💪 ¡Hazlo con más intensidad!",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFFFF5722),
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.7f), RoundedCornerShape(8.dp))
                            .padding(8.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                // Distance warning (only in positioning phase)
                if (uiState.phase == CalibrationPhase.POSITIONING) {
                    DistanceWarningText(
                        distanceState = uiState.distanceState,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    // Progress indicator for 1-second hold
                    if (uiState.distanceState == DistanceState.OK && uiState.isFaceInPosition) {
                        PositionHoldProgress(
                            progress = uiState.distanceOkProgress,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }
                }
                
                // Instructions
                InstructionText(
                    text = getInstructionText(uiState.phase, uiState.currentStep, uiState.distanceState),
                    isHighlight = true
                )
                
                // Start button (only in positioning phase when ready)
                if (uiState.phase == CalibrationPhase.POSITIONING) {
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(
                        onClick = { viewModel.startCalibration() },
                        enabled = uiState.isReadyToStart
                    ) {
                        Text(
                            when {
                                uiState.isReadyToStart -> "Iniciar Calibración"
                                uiState.distanceState == DistanceState.TOO_CLOSE -> "Aléjate de la cámara"
                                uiState.distanceState == DistanceState.TOO_FAR -> "Acércate a la cámara"
                                else -> "Mantén la posición..."
                            }
                        )
                    }
                }
            }
        }
        }
    }
}

@Composable
fun DistanceWarningText(
    distanceState: DistanceState,
    modifier: Modifier = Modifier
) {
    val (text, color) = when (distanceState) {
        DistanceState.TOO_CLOSE -> "⚠️ Muy cerca - Riesgo de distorsión" to Color(0xFFFF5722)
        DistanceState.TOO_FAR -> "⚠️ Muy lejos - Baja resolución" to Color(0xFFFF9800)
        DistanceState.OK -> "✓ Distancia correcta" to Color(0xFF4CAF50)
    }
    
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        color = color,
        modifier = modifier
            .background(Color.Black.copy(alpha = 0.7f), RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp)
    )
}

@Composable
fun PositionHoldProgress(
    progress: Float,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.size(60.dp),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            progress = { 1f },
            modifier = Modifier.size(60.dp),
            color = Color.White.copy(alpha = 0.3f),
            strokeWidth = 4.dp
        )
        CircularProgressIndicator(
            progress = { progress },
            modifier = Modifier.size(60.dp),
            color = Color.Green,
            strokeWidth = 4.dp
        )
        Text(
            text = "${(progress * 100).toInt()}%",
            style = MaterialTheme.typography.labelMedium,
            color = Color.White
        )
    }
}

@Composable
fun FaceSilhouetteOverlay(
    distanceState: DistanceState,
    isFaceInPosition: Boolean,
    modifier: Modifier = Modifier
) {
    // Color based on distance state: Red=Bad, Green=Good
    val silhouetteColor = when {
        distanceState == DistanceState.TOO_CLOSE -> Color.Red.copy(alpha = 0.6f)
        distanceState == DistanceState.TOO_FAR -> Color(0xFFFF9800).copy(alpha = 0.5f) // Orange
        isFaceInPosition -> Color.Green.copy(alpha = 0.5f)
        else -> Color.White.copy(alpha = 0.4f)
    }
    val strokeWidth = 4f
    
    Canvas(modifier = modifier) {
        val centerX = size.width / 2
        val centerY = size.height * CalibrationUtils.SILHOUETTE_CENTER_Y_RATIO
        val ovalWidth = size.width * CalibrationUtils.SILHOUETTE_WIDTH_RATIO
        val ovalHeight = size.height * CalibrationUtils.SILHOUETTE_HEIGHT_RATIO
        
        // Draw face oval guide
        drawOval(
            color = silhouetteColor,
            topLeft = Offset(centerX - ovalWidth / 2, centerY - ovalHeight / 2),
            size = Size(ovalWidth, ovalHeight),
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )
        
        // Draw corner guides
        val guideLength = 40f
        val corners = listOf(
            Offset(centerX - ovalWidth / 2, centerY - ovalHeight / 2), // Top-left
            Offset(centerX + ovalWidth / 2, centerY - ovalHeight / 2), // Top-right
            Offset(centerX - ovalWidth / 2, centerY + ovalHeight / 2), // Bottom-left
            Offset(centerX + ovalWidth / 2, centerY + ovalHeight / 2)  // Bottom-right
        )
        
        corners.forEachIndexed { index, corner ->
            val (hDir, vDir) = when (index) {
                0 -> Pair(1f, 1f)
                1 -> Pair(-1f, 1f)
                2 -> Pair(1f, -1f)
                else -> Pair(-1f, -1f)
            }
            drawLine(silhouetteColor, corner, Offset(corner.x + guideLength * hDir, corner.y), strokeWidth)
            drawLine(silhouetteColor, corner, Offset(corner.x, corner.y + guideLength * vDir), strokeWidth)
        }
    }
}

@Composable
fun CaptureProgressIndicator(
    progress: Float,
    isStable: Boolean,
    modifier: Modifier = Modifier
) {
    val progressColor = if (isStable) Color.Green else Color(0xFFFF9800)
    val trackColor = Color.White.copy(alpha = 0.3f)
    
    Box(
        modifier = modifier.size(80.dp),
        contentAlignment = Alignment.Center
    ) {
        // Background track
        CircularProgressIndicator(
            progress = { 1f },
            modifier = Modifier.size(80.dp),
            color = trackColor,
            strokeWidth = 6.dp
        )
        // Progress
        CircularProgressIndicator(
            progress = { progress },
            modifier = Modifier.size(80.dp),
            color = progressColor,
            strokeWidth = 6.dp
        )
        // Percentage text
        Text(
            text = "${(progress * 100).toInt()}%",
            style = MaterialTheme.typography.titleMedium,
            color = Color.White
        )
    }
}

@Composable
fun InstructionText(text: String, isHighlight: Boolean = false) {
    Text(
        text = text,
        style = if (isHighlight) MaterialTheme.typography.headlineLarge else MaterialTheme.typography.bodyLarge,
        textAlign = TextAlign.Center,
        color = Color.White,
        modifier = Modifier
            .background(Color.Black.copy(alpha = 0.5f))
            .padding(16.dp)
    )
}

@Composable
fun DebugCalibrationOverlay(
    uiState: CalibrationUiState,
    modifier: Modifier = Modifier
) {
    val baseline = uiState.currentBaseline
    Column(
        modifier = modifier
            .background(
                color = Color.Black.copy(alpha = 0.7f),
                shape = RoundedCornerShape(8.dp)
            )
            .padding(12.dp)
    ) {
        Text(
            text = "DEBUG - Calibration",
            style = MaterialTheme.typography.labelSmall,
            color = Color.Yellow
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Phase: ${uiState.phase.name}",
            style = MaterialTheme.typography.bodySmall,
            color = Color.Cyan
        )
        Text(
            text = "Step: ${uiState.currentStep.name} (done: ${uiState.stepCompleted})",
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
        Text(
            text = "Frames: ${uiState.framesCaptured} | Progress: ${(uiState.captureProgress * 100).toInt()}%",
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
        Text(
            text = "Head Stable: ${uiState.isHeadStable}",
            style = MaterialTheme.typography.bodySmall,
            color = if (uiState.isHeadStable) Color.Green else Color.Red
        )
        Text(
            text = "Distance: ${uiState.distanceState.name}",
            style = MaterialTheme.typography.bodySmall,
            color = when (uiState.distanceState) {
                DistanceState.OK -> Color.Green
                DistanceState.TOO_CLOSE -> Color.Red
                DistanceState.TOO_FAR -> Color(0xFFFF9800)
            }
        )
        Text(
            text = "Face Ratio: %.3f (15-30%%)".format(uiState.debugFaceAreaRatio),
            style = MaterialTheme.typography.bodySmall,
            color = Color.Cyan
        )
        Text(
            text = "Gesture: %.1f%% (min: %.0f%%) %s".format(
                uiState.currentCorrectedValue * 100,
                uiState.minGestureThreshold * 100,
                if (uiState.isGestureIntensitySufficient) "✓" else "✗"
            ),
            style = MaterialTheme.typography.bodySmall,
            color = if (uiState.isGestureIntensitySufficient) Color.Green else Color.Red
        )
        Text(
            text = uiState.debugFaceBox,
            style = MaterialTheme.typography.bodySmall,
            color = Color.Gray
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "--- Max Values (P95) ---",
            style = MaterialTheme.typography.labelSmall,
            color = Color.Yellow
        )
        Text(
            text = "Smile: %.3f".format(baseline.mouthSmileMax),
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
        Text(
            text = "Brows: %.3f".format(baseline.browRaiseMax),
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
        Text(
            text = "Kiss: %.3f".format(baseline.duckFaceMax),
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
        Text(
            text = "Jaw: %.3f".format(baseline.mouthOpenMax),
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
        Text(
            text = "Eyes: %.3f".format(baseline.eyesClosedMax),
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "--- Neutral Offsets ---",
            style = MaterialTheme.typography.labelSmall,
            color = Color.Yellow
        )
        baseline.neutralOffsets.forEach { (key, value) ->
            Text(
                text = "$key: %.3f".format(value),
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
    }
}

fun getInstructionText(phase: CalibrationPhase, step: CalibrationStep, distanceState: DistanceState = DistanceState.OK): String {
    return when (phase) {
        CalibrationPhase.POSITIONING -> when (distanceState) {
            DistanceState.TOO_CLOSE -> "Aléjate un poco de la cámara"
            DistanceState.TOO_FAR -> "Acércate un poco a la cámara"
            DistanceState.OK -> "Mantén la posición 1 segundo"
        }
        CalibrationPhase.NEUTRAL_CAPTURE -> "Relaja tu rostro y mira al frente"
        CalibrationPhase.ACTIVE_CAPTURE -> when (step) {
            CalibrationStep.Smile -> "¡Sonríe ampliamente!"
            CalibrationStep.BrowRaise -> "¡Levanta las cejas!"
            CalibrationStep.Kiss -> "¡Haz un beso!"
            CalibrationStep.JawOpen -> "¡Abre la boca!"
            CalibrationStep.EyesClosed -> "¡Cierra los ojos fuerte!"
            else -> ""
        }
        CalibrationPhase.COMPLETE -> "¡Calibración completa!"
    }
}

private fun playCompletionSound() {
    try {
        val toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 100)
        toneGenerator.startTone(ToneGenerator.TONE_PROP_ACK, 150)
        toneGenerator.release()
    } catch (e: Exception) {
        // Ignore audio errors
    }
}

private fun triggerVibration(context: Context) {
    try {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(100)
        }
    } catch (e: Exception) {
        // Ignore vibration errors
    }
}
