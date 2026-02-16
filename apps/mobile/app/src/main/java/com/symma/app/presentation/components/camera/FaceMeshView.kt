package com.symma.app.presentation.components.camera

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarker
import com.google.mediapipe.tasks.vision.facelandmarker.FaceLandmarkerResult
import kotlin.math.max

/**
 * High-performance face mesh overlay using Android View.
 * Based on Google's MediaPipe sample OverlayView.
 * 
 * Uses FaceLandmarker.FACE_LANDMARKS_CONNECTORS for mesh lines.
 */
class FaceMeshView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var results: FaceLandmarkerResult? = null
    private var imageWidth: Int = 1
    private var imageHeight: Int = 1
    private var scaleFactor: Float = 1f

    // Paint for mesh lines
    private val linePaint = Paint().apply {
        color = MESH_COLOR
        strokeWidth = LINE_STROKE_WIDTH
        style = Paint.Style.STROKE
        isAntiAlias = true
        strokeCap = Paint.Cap.ROUND
    }

    // Paint for landmark points (optional)
    private val pointPaint = Paint().apply {
        color = POINT_COLOR
        strokeWidth = POINT_STROKE_WIDTH
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    // Pre-filtered connectors (computed once)
    private val connectors = FaceLandmarker.FACE_LANDMARKS_CONNECTORS.filterNotNull()

    // Configuration
    var showPoints: Boolean = false
        set(value) {
            field = value
            invalidate()
        }

    var meshColor: Int
        get() = linePaint.color
        set(value) {
            linePaint.color = value
            invalidate()
        }

    var lineWidth: Float
        get() = linePaint.strokeWidth
        set(value) {
            linePaint.strokeWidth = value
            invalidate()
        }

    fun clear() {
        results = null
        invalidate()
    }

    fun setResults(
        faceLandmarkerResult: FaceLandmarkerResult,
        imageHeight: Int,
        imageWidth: Int
    ) {
        results = faceLandmarkerResult
        this.imageHeight = imageHeight
        this.imageWidth = imageWidth

        // Calculate scale factor for LIVE_STREAM mode (FILL_START)
        scaleFactor = max(width.toFloat() / imageWidth, height.toFloat() / imageHeight)

        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val faceLandmarks = results?.faceLandmarks()
        if (faceLandmarks.isNullOrEmpty()) return

        // Calculate offsets to center the scaled image
        val scaledImageWidth = imageWidth * scaleFactor
        val scaledImageHeight = imageHeight * scaleFactor
        val offsetX = (width - scaledImageWidth) / 2f
        val offsetY = (height - scaledImageHeight) / 2f

        // Draw each detected face
        faceLandmarks.forEach { landmarks ->
            // Draw connectors (mesh lines)
            connectors.forEach { connector ->
                val startLandmark = landmarks.getOrNull(connector.start())
                val endLandmark = landmarks.getOrNull(connector.end())

                if (startLandmark != null && endLandmark != null) {
                    // Note: Image is already mirrored in FaceLandmarkerHelper.analyze()
                    val startX = startLandmark.x() * imageWidth * scaleFactor + offsetX
                    val startY = startLandmark.y() * imageHeight * scaleFactor + offsetY
                    val endX = endLandmark.x() * imageWidth * scaleFactor + offsetX
                    val endY = endLandmark.y() * imageHeight * scaleFactor + offsetY

                    canvas.drawLine(startX, startY, endX, endY, linePaint)
                }
            }

            // Optionally draw landmark points
            if (showPoints) {
                landmarks.forEach { landmark ->
                    val x = landmark.x() * imageWidth * scaleFactor + offsetX
                    val y = landmark.y() * imageHeight * scaleFactor + offsetY
                    canvas.drawCircle(x, y, POINT_RADIUS, pointPaint)
                }
            }
        }
    }

    companion object {
        private const val LINE_STROKE_WIDTH = 2f
        private const val POINT_STROKE_WIDTH = 4f
        private const val POINT_RADIUS = 3f
        private const val MESH_COLOR = 0xFF00BCD4.toInt() // Cyan
        private const val POINT_COLOR = Color.WHITE
    }
}
