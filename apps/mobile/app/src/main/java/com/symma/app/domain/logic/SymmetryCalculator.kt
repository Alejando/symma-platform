package com.symma.app.domain.logic

import com.google.mediapipe.tasks.components.containers.NormalizedLandmark
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.sqrt

/**
 * Calculates symmetry score based on facial landmarks.
 * RFC: docs/rfcs/024-symmetry-logic.md
 */
class SymmetryCalculator {

    companion object {
        // Key Indices from RFC
        private const val INDEX_CENTER_LIPS = 13
        private const val INDEX_LEFT = 61
        private const val INDEX_RIGHT = 291
    }

    /**
     * Calculates a symmetry score (0-100) based on the distance balance between
     * center lips and left/right mouth corners.
     *
     * @param landmarks List of NormalizedLandmark from MediaPipe
     * @return Score between 0.0 and 100.0
     */
    fun calculateSmileSymmetry(landmarks: List<NormalizedLandmark>): Float {
        if (landmarks.isEmpty() || 
            landmarks.size <= max(INDEX_CENTER_LIPS, max(INDEX_LEFT, INDEX_RIGHT))) {
            return 0f
        }

        val center = landmarks[INDEX_CENTER_LIPS]
        val left = landmarks[INDEX_LEFT]
        val right = landmarks[INDEX_RIGHT]

        // Calculate Euclidean distances
        // Since we are using NormalizedLandmarks (0.0-1.0), we can just use the coordinates directly.
        // Note: As aspect ratio might affect visual distance, typically we might want to convert to pixel coordinates
        // or account for aspect ratio, but per RFC instructions we usually operate on the normalized values directly
        // or the RFC implies simple distance. 
        // We will compute simple 2D distance on the normalized plane.
        
        val distL = distance(center, left)
        val distR = distance(center, right)

        // Safety: Handle zero distances
        val maxDist = max(distL, distR)
        
        if (maxDist == 0f) {
            // Points overlap perfectly or something is wrong. Return 100 on perfect overlap? 
            // Or 0 if it implies mouth is closed/no smile?
            // "if mouth is closed tight" -> usually distances are non-zero.
            // If maxDist is 0, then distL and distR are both 0, meaning Left=Right=Center. 
            // This is impossible for a valid face. Return 0 for safety.
            return 0f
        }

        // Formula: Score = (1 - abs(DistL - DistR) / max(DistL, DistR)) * 100
        val diff = abs(distL - distR)
        val ratio = diff / maxDist
        val score = (1.0f - ratio) * 100f

        return score.coerceIn(0f, 100f)
    }

    private fun distance(p1: NormalizedLandmark, p2: NormalizedLandmark): Float {
        val dx = p1.x() - p2.x()
        val dy = p1.y() - p2.y()
        // We are ignoring Z for this 2D symmetry check as per typical "smile symmetry" logic on camera frames
        return sqrt(dx.pow(2) + dy.pow(2))
    }
}
