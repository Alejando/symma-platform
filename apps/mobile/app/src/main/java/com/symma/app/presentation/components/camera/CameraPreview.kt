package com.symma.app.presentation.components.camera

import android.util.Log
import android.view.ViewGroup
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.common.util.concurrent.ListenableFuture

private const val TAG = "CameraPreview"

/**
 * A Jetpack Compose component that renders the front-facing camera preview.
 * 
 * Key features:
 * - Uses CameraX for camera operations
 * - Binds to lifecycle automatically (camera stops when app is backgrounded)
 * - Mirrors the preview for front camera (acts like a mirror)
 * - Handles camera provider cleanup on disposal
 */
@Composable
fun CameraPreview(
    modifier: Modifier = Modifier,
    landmarkerListener: FaceLandmarkerHelper.LandmarkerListener? = null
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    
    DisposableEffect(Unit) {
        onDispose {
            try {
                if (cameraProviderFuture.isDone) {
                    cameraProviderFuture.get().unbindAll()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error unbinding camera: ${e.message}")
            }
        }
    }
    
    val faceLandmarkerHelper = remember(landmarkerListener) {
        FaceLandmarkerHelper(
            context = context,
            faceLandmarkerHelperListener = landmarkerListener
        )
    }

    AndroidView(
        factory = { ctx ->
            PreviewView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                // Mirror the preview for front camera (acts like a mirror)
                scaleX = -1f
                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
            }.also { previewView ->
                startCamera(
                    cameraProviderFuture = cameraProviderFuture,
                    lifecycleOwner = lifecycleOwner,
                    previewView = previewView,
                    faceLandmarkerHelper = faceLandmarkerHelper
                )
            }
        },
        modifier = modifier
    )
}

private fun startCamera(
    cameraProviderFuture: ListenableFuture<ProcessCameraProvider>,
    lifecycleOwner: LifecycleOwner,
    previewView: PreviewView,
    faceLandmarkerHelper: FaceLandmarkerHelper
) {
    cameraProviderFuture.addListener({
        try {
            val cameraProvider = cameraProviderFuture.get()
            
            // Build the preview use case
            val preview = Preview.Builder()
                .build()
                .also {
                    it.surfaceProvider = previewView.surfaceProvider
                }
            
            // Build ImageAnalysis use case
            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                .build()
                .also {
                    it.setAnalyzer(ContextCompat.getMainExecutor(previewView.context), faceLandmarkerHelper)
                }

            // Select front camera
            val cameraSelector = CameraSelector.Builder()
                .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
                .build()
            
            // Unbind any existing use cases before binding new ones
            cameraProvider.unbindAll()
            
            // Bind the camera to the lifecycle
            cameraProvider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                imageAnalyzer
            )
            
            Log.d(TAG, "Camera started successfully with ImageAnalysis")
        } catch (e: Exception) {
            Log.e(TAG, "Camera initialization failed: ${e.message}", e)
        }
    }, ContextCompat.getMainExecutor(previewView.context))
}
