package com.symma.app.domain.logic

import com.symma.app.domain.model.MobileModule
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.sqrt

/** A face mesh point in an isotropic space, so distances mean the same in every direction. */
data class FacePoint(val x: Float, val y: Float, val z: Float) {
    fun distanceTo(other: FacePoint): Float {
        val dx = x - other.x
        val dy = y - other.y
        val dz = z - other.z
        return sqrt(dx * dx + dy * dy + dz * dz)
    }
}

/**
 * Left/right symmetry of the movement each module trains, on a 0–100 scale where 100 is perfectly
 * symmetric: `(1 - |dRight - dLeft| / max(dRight, dLeft)) * 100`, comparing mirror landmark pairs of
 * the MediaPipe face mesh.
 */
object FacialSymmetry {

    private const val MOUTH_CORNER_RIGHT = 61
    private const val MOUTH_CORNER_LEFT = 291
    private const val UPPER_LIP_CENTER = 0
    private const val BROW_RIGHT = 105
    private const val BROW_LEFT = 334
    private const val UPPER_EYELID_RIGHT = 159
    private const val UPPER_EYELID_LEFT = 386
    private const val LOWER_EYELID_RIGHT = 145
    private const val LOWER_EYELID_LEFT = 374
    private const val OUTER_EYE_CORNER_RIGHT = 33
    private const val OUTER_EYE_CORNER_LEFT = 263

    /**
     * With both eyes shut the apertures are a few pixels of tracking noise; differences below this
     * fraction of the inter-ocular distance are not treated as asymmetry.
     */
    private const val CLOSED_EYELID_TOLERANCE = 0.05f

    private class BilateralMeasure(
        val right: Pair<Int, Int>,
        val left: Pair<Int, Int>,
        val minimumReferenceInInterocularDistances: Float = 0f
    ) {
        val landmarkIndices = listOf(right.first, right.second, left.first, left.second, OUTER_EYE_CORNER_RIGHT, OUTER_EYE_CORNER_LEFT)
    }

    private val mouthCornerExcursion = BilateralMeasure(
        right = MOUTH_CORNER_RIGHT to UPPER_LIP_CENTER,
        left = MOUTH_CORNER_LEFT to UPPER_LIP_CENTER
    )
    private val browElevation = BilateralMeasure(
        right = BROW_RIGHT to UPPER_EYELID_RIGHT,
        left = BROW_LEFT to UPPER_EYELID_LEFT
    )
    private val eyelidAperture = BilateralMeasure(
        right = UPPER_EYELID_RIGHT to LOWER_EYELID_RIGHT,
        left = UPPER_EYELID_LEFT to LOWER_EYELID_LEFT,
        minimumReferenceInInterocularDistances = CLOSED_EYELID_TOLERANCE
    )

    private fun measureFor(module: MobileModule): BilateralMeasure? = when (module) {
        MobileModule.SMILE, MobileModule.KISS, MobileModule.JAW -> mouthCornerExcursion
        MobileModule.BROWS -> browElevation
        MobileModule.EYES, MobileModule.EYES_INVERSE -> eyelidAperture
        MobileModule.UNKNOWN -> null
    }

    /** Returns null when the module has no bilateral measure or the mesh lacks the needed landmarks. */
    fun percentFor(module: MobileModule, face: List<FacePoint>): Float? {
        val measure = measureFor(module) ?: return null
        if (measure.landmarkIndices.any { it !in face.indices }) return null

        val rightDistance = face[measure.right.first].distanceTo(face[measure.right.second])
        val leftDistance = face[measure.left.first].distanceTo(face[measure.left.second])
        val interocularDistance = face[OUTER_EYE_CORNER_RIGHT].distanceTo(face[OUTER_EYE_CORNER_LEFT])
        val reference = max(max(rightDistance, leftDistance), measure.minimumReferenceInInterocularDistances * interocularDistance)
        if (reference <= 0f) return null

        val asymmetry = abs(rightDistance - leftDistance) / reference
        return ((1f - asymmetry) * 100f).coerceIn(0f, 100f)
    }
}

/**
 * MediaPipe normalizes x by the frame width and y by its height, and z roughly at the scale of x,
 * so x and z are scaled by the width and y by the height to make distances comparable.
 */
fun facePointFromNormalized(x: Float, y: Float, z: Float, imageWidth: Int, imageHeight: Int): FacePoint =
    FacePoint(x * imageWidth, y * imageHeight, z * imageWidth)
