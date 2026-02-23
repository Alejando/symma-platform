package com.symma.app.domain.logic

import android.graphics.RectF
import android.util.Size
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Distance state for face positioning validation.
 * Used to detect lens distortion risk (too close) or low resolution (too far).
 */
enum class DistanceState {
    TOO_CLOSE,  // ratio > 0.45 - Distortion risk
    TOO_FAR,    // ratio < 0.25 - Low resolution risk
    OK          // ratio 0.25-0.45 - Optimal distance
}

/** Default engage threshold: score must reach this to count as target reached. */
const val REP_ENGAGE_THRESHOLD = 1.0f

/**
 * Default release threshold: score must drop below this after a rep completes
 * before the next rep can start. Strictly lower than [REP_ENGAGE_THRESHOLD] to
 * provide hysteresis and avoid jitter-driven false transitions.
 */
const val REP_RELEASE_THRESHOLD = 0.75f

/** Step-specific minimum gesture intensity thresholds for calibration. */
const val CALIBRATION_THRESHOLD_DEFAULT = 0.15f
const val CALIBRATION_THRESHOLD_BROW_RAISE = 0.10f
const val CALIBRATION_THRESHOLD_EYES_CLOSED = 0.10f
const val CALIBRATION_THRESHOLD_SMILE = 0.20f
const val CALIBRATION_THRESHOLD_JAW_OPEN = 0.20f
const val CALIBRATION_THRESHOLD_KISS = 0.20f

/** Minimum valid stable samples required before a calibration step can finalize. */
const val CALIBRATION_MIN_VALID_SAMPLES = 30

object CalibrationUtils {

    private const val HEAD_MOVEMENT_THRESHOLD_PX = 15f
    private const val P95_PERCENTILE = 0.95f
    
    // Distance validation thresholds (face area / screen area)
    private const val DISTANCE_MIN_RATIO = 0.15f  // Min face/screen area ratio (15%)
    private const val DISTANCE_MAX_RATIO = 0.30f  // Max face/screen area ratio (30%)
    
    // Silhouette dimensions - oval shape matching face proportions
    // Target area ~32.5% (middle of 15-30% range with margin)
    const val SILHOUETTE_WIDTH_RATIO = 0.65f   // 65% of screen width
    const val SILHOUETTE_HEIGHT_RATIO = 0.50f  // 50% of screen height
    const val SILHOUETTE_CENTER_Y_RATIO = 0.45f // Centered vertically

    /**
     * Calculate the P95 (95th percentile) maximum value from a list of samples.
     * This filters out noise spikes by discarding the top 5% of values.
     *
     * Algorithm:
     * 1. Sort samples ascending
     * 2. Discard top 5% (noise outliers)
     * 3. Return max of remaining values
     *
     * @param samples List of float values collected during calibration
     * @return The P95 max value, or 0f if samples are empty
     */
    fun calculateP95(samples: List<Float>): Float {
        if (samples.isEmpty()) return 0f
        if (samples.size == 1) return samples.first()

        val sorted = samples.sorted()
        val cutoffIndex = (sorted.size * P95_PERCENTILE).toInt().coerceAtMost(sorted.size - 1)
        
        // Take max of values up to P95 cutoff
        return sorted.subList(0, cutoffIndex + 1).maxOrNull() ?: 0f
    }

    /**
     * Calculate the average value from a list of samples.
     * Used for Neutral phase to compute offset values.
     *
     * @param samples List of float values
     * @return Average value, or 0f if empty
     */
    fun calculateAverage(samples: List<Float>): Float {
        if (samples.isEmpty()) return 0f
        return samples.sum() / samples.size
    }

    /**
     * Check if the head is stable between two frames by comparing face bounding boxes.
     * Movement is calculated as the Euclidean distance between box centers.
     *
     * @param currentFaceBox Current frame's face bounding box
     * @param previousFaceBox Previous frame's face bounding box
     * @param threshold Maximum allowed movement in pixels (default: 15px)
     * @return true if head is stable (movement below threshold), false otherwise
     */
    fun isHeadStable(
        currentFaceBox: RectF?,
        previousFaceBox: RectF?,
        threshold: Float = HEAD_MOVEMENT_THRESHOLD_PX
    ): Boolean {
        if (currentFaceBox == null || previousFaceBox == null) return false

        val currentCenterX = currentFaceBox.centerX()
        val currentCenterY = currentFaceBox.centerY()
        val previousCenterX = previousFaceBox.centerX()
        val previousCenterY = previousFaceBox.centerY()

        val dx = currentCenterX - previousCenterX
        val dy = currentCenterY - previousCenterY
        val distance = sqrt(dx * dx + dy * dy)

        return distance <= threshold
    }

    /**
     * Check if the user is at the correct distance from the camera.
     * Uses face/screen area ratio to detect:
     * - TOO_CLOSE: ratio > 0.45 (lens distortion risk)
     * - TOO_FAR: ratio < 0.25 (low resolution risk)
     * - OK: ratio between 0.25 and 0.45 (optimal)
     *
     * @param faceBox Face bounding box from MediaPipe
     * @param screenSize Screen dimensions
     * @return DistanceState indicating user positioning
     */
    fun isDistanceCorrect(faceBox: RectF?, screenSize: Size): DistanceState {
        if (faceBox == null) return DistanceState.TOO_FAR

        val faceArea = faceBox.width() * faceBox.height()
        val screenArea = screenSize.width.toFloat() * screenSize.height.toFloat()
        
        if (screenArea <= 0) return DistanceState.TOO_FAR
        
        val ratio = faceArea / screenArea

        return when {
            ratio > DISTANCE_MAX_RATIO -> DistanceState.TOO_CLOSE
            ratio < DISTANCE_MIN_RATIO -> DistanceState.TOO_FAR
            else -> DistanceState.OK
        }
    }

    /**
     * Check if the face is properly positioned within the silhouette guide area.
     * The face should be centered and appropriately sized relative to the silhouette.
     *
     * @param faceBox Face bounding box from MediaPipe
     * @param screenWidth Screen width in pixels
     * @param screenHeight Screen height in pixels
     * @return true if face is properly positioned within silhouette bounds
     */
    fun isFaceInPosition(
        faceBox: RectF?,
        screenWidth: Int,
        screenHeight: Int
    ): Boolean {
        if (faceBox == null) return false

        val faceWidth = faceBox.width()
        val faceHeight = faceBox.height()
        val faceCenterX = faceBox.centerX()
        val faceCenterY = faceBox.centerY()

        // Calculate silhouette bounds (must match UI)
        val silhouetteWidth = screenWidth * SILHOUETTE_WIDTH_RATIO
        val silhouetteHeight = screenHeight * SILHOUETTE_HEIGHT_RATIO
        val silhouetteCenterX = screenWidth / 2f
        val silhouetteCenterY = screenHeight * SILHOUETTE_CENTER_Y_RATIO

        // Check if face center is within silhouette bounds (with 15% tolerance)
        val toleranceX = silhouetteWidth * 0.15f
        val toleranceY = silhouetteHeight * 0.15f
        
        val isHorizontallyCentered = abs(faceCenterX - silhouetteCenterX) < toleranceX
        val isVerticallyCentered = abs(faceCenterY - silhouetteCenterY) < toleranceY
        
        // Check if face size is reasonable relative to silhouette (40-90% of silhouette size)
        val widthRatio = faceWidth / silhouetteWidth
        val heightRatio = faceHeight / silhouetteHeight
        val isSizeOk = widthRatio in 0.40f..0.95f && heightRatio in 0.40f..0.95f

        return isHorizontallyCentered && isVerticallyCentered && isSizeOk
    }

    /**
     * Get face bounding box from MediaPipe face landmarks.
     *
     * @param landmarks List of normalized landmarks (0-1 range)
     * @param imageWidth Original image width
     * @param imageHeight Original image height
     * @return RectF bounding box in pixel coordinates
     */
    fun getFaceBoundingBox(
        landmarks: List<com.google.mediapipe.tasks.components.containers.NormalizedLandmark>,
        imageWidth: Int,
        imageHeight: Int
    ): RectF? {
        if (landmarks.isEmpty()) return null

        var minX = Float.MAX_VALUE
        var maxX = Float.MIN_VALUE
        var minY = Float.MAX_VALUE
        var maxY = Float.MIN_VALUE

        for (landmark in landmarks) {
            val x = landmark.x() * imageWidth
            val y = landmark.y() * imageHeight
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
        }

        return RectF(minX, minY, maxX, maxY)
    }
}
