package com.symma.app.domain.logic

/** Keeps the frame of the strongest attempt; between equally strong attempts the more symmetric one wins. */
class BestAttemptTracker<Frame : Any> {

    private var bestFrame: Frame? = null
    private var bestScore = Float.NEGATIVE_INFINITY
    private var bestSymmetry = Float.NEGATIVE_INFINITY

    fun consider(gestureScore: Float, symmetryPercent: Float?, frame: Frame) {
        val symmetry = symmetryPercent ?: 0f
        val isBetter = gestureScore > bestScore || (gestureScore == bestScore && symmetry > bestSymmetry)
        if (!isBetter) return
        bestFrame = frame
        bestScore = gestureScore
        bestSymmetry = symmetry
    }

    fun best(): Frame? = bestFrame

    fun reset() {
        bestFrame = null
        bestScore = Float.NEGATIVE_INFINITY
        bestSymmetry = Float.NEGATIVE_INFINITY
    }
}
