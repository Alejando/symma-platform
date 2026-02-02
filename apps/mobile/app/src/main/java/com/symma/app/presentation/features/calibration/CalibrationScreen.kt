package com.symma.app.presentation.features.calibration

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.symma.app.presentation.components.camera.CameraPreview
import com.symma.app.presentation.components.camera.FaceLandmarkerHelper

@Composable
fun CalibrationScreen(
    viewModel: CalibrationViewModel = hiltViewModel(),
    onCalibrationComplete: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    val landmarkerListener = remember(viewModel) {
        object : FaceLandmarkerHelper.LandmarkerListener {
            override fun onError(error: String, errorCode: Int) {
                // Log or handle error
            }

            override fun onResults(resultBundle: FaceLandmarkerHelper.ResultBundle) {
                viewModel.processFrame(resultBundle.result)
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (uiState.currentStep != CalibrationStep.Complete) {
            CameraPreview(
                modifier = Modifier.fillMaxSize(),
                landmarkerListener = landmarkerListener
            )
        } else {
             Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background),
                contentAlignment = Alignment.Center
            ) {
                 Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Calibration Complete!",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onCalibrationComplete) {
                        Text("Finish")
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
        
        // Overlay for instructions
        if (uiState.currentStep != CalibrationStep.Complete) {
             Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(bottom = 80.dp)
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                InstructionText(
                    text = getInstructionText(uiState.currentStep),
                    isHighlight = true
                )
                
                if (uiState.currentStep == CalibrationStep.Instructions) {
                    Spacer(modifier = Modifier.height(24.dp))
                    Button(onClick = { viewModel.nextStep() }) {
                        Text("Start Calibration")
                    }
                } else if (uiState.isCapturing) {
                     Spacer(modifier = Modifier.height(8.dp))
                     Text(
                        text = "Capturing...",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.Green // Or theme color
                    )
                }
            }
        }
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
            text = "Step: ${uiState.currentStep.name}",
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
        Spacer(modifier = Modifier.height(4.dp))
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
            text = "Eyes Closed: %.3f".format(baseline.eyesClosedMax),
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
        )
    }
}

fun getInstructionText(step: CalibrationStep): String {
    return when (step) {
        CalibrationStep.Instructions -> "We need to calibrate your range of motion. Follow the instructions on screen."
        CalibrationStep.Neutral -> "Relax your face (Neutral)"
        CalibrationStep.Smile -> "Smile Big!"
        CalibrationStep.BrowRaise -> "Raise Eyebrows!"
        CalibrationStep.Kiss -> "Pucker your lips (Kiss)!"
        CalibrationStep.JawOpen -> "Open your mouth wide!"
        CalibrationStep.Complete -> "Done!"
    }
}
