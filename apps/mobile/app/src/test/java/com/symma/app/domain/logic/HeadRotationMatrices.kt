package com.symma.app.domain.logic

import kotlin.math.cos
import kotlin.math.sin

object HeadRotationMatrices {

    /** Builds a column-major 4x4 transform equal to scale * Ry(yaw) * Rx(pitch), as MediaPipe emits it. */
    fun rotation(yawDegrees: Float = 0f, pitchDegrees: Float = 0f, scale: Float = 1f): FloatArray {
        val yaw = Math.toRadians(yawDegrees.toDouble())
        val pitch = Math.toRadians(pitchDegrees.toDouble())
        val yawMatrix = arrayOf(
            doubleArrayOf(cos(yaw), 0.0, sin(yaw)),
            doubleArrayOf(0.0, 1.0, 0.0),
            doubleArrayOf(-sin(yaw), 0.0, cos(yaw))
        )
        val pitchMatrix = arrayOf(
            doubleArrayOf(1.0, 0.0, 0.0),
            doubleArrayOf(0.0, cos(pitch), -sin(pitch)),
            doubleArrayOf(0.0, sin(pitch), cos(pitch))
        )
        val columnMajor = FloatArray(16)
        for (row in 0..2) {
            for (column in 0..2) {
                val value = (0..2).sumOf { k -> yawMatrix[row][k] * pitchMatrix[k][column] } * scale
                columnMajor[column * 4 + row] = value.toFloat()
            }
        }
        columnMajor[15] = 1f
        return columnMajor
    }
}
