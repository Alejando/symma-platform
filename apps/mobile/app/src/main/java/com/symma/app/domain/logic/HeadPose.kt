package com.symma.app.domain.logic

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.sqrt

const val CALIBRATION_MAX_HEAD_ROTATION_DEGREES = 10f

data class HeadPose(val yawDegrees: Float, val pitchDegrees: Float) {

    fun isTurnedAwayFromCamera(maxDegrees: Float = CALIBRATION_MAX_HEAD_ROTATION_DEGREES): Boolean =
        abs(yawDegrees) > maxDegrees || abs(pitchDegrees) > maxDegrees

    companion object {
        private const val MATRIX_SIZE = 16

        /** MediaPipe's facial transformation matrix is a column-major 4x4 matrix that may carry scale. */
        fun fromTransformationMatrix(matrix: FloatArray): HeadPose? {
            if (matrix.size < MATRIX_SIZE) return null
            fun element(row: Int, column: Int) = matrix[column * 4 + row]

            val r20 = element(2, 0)
            val r21 = element(2, 1)
            val r22 = element(2, 2)
            val yaw = atan2(-r20, sqrt(r21 * r21 + r22 * r22))
            val pitch = atan2(r21, r22)
            return HeadPose(
                yawDegrees = Math.toDegrees(yaw.toDouble()).toFloat(),
                pitchDegrees = Math.toDegrees(pitch.toDouble()).toFloat()
            )
        }
    }
}
