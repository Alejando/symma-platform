package com.symma.app.domain.logic

import com.google.mediapipe.tasks.components.containers.Category
import com.symma.app.domain.model.CalibrationBaseline
import kotlin.math.min

abstract class BaseExerciseStrategy : ExerciseStrategy {
    protected fun getScore(shapes: List<Category>, name: String): Float {
        return shapes.find { it.categoryName() == name }?.score() ?: 0f
    }

    /**
     * Applies neutral offset correction to a raw blendshape value.
     * Subtracts the resting-face noise captured during calibration.
     */
    protected fun applyNeutralOffset(rawValue: Float, baseline: CalibrationBaseline, offsetKey: String): Float {
        return (rawValue - baseline.getNeutralOffset(offsetKey)).coerceAtLeast(0f)
    }

    protected fun calculate(currentValue: Float, baselineValue: Float, difficulty: Float): Float {
        val denominator = baselineValue * difficulty
        if (denominator <= 0.001f) return 0f // Avoid division by zero
        val score = currentValue / denominator
        // Clamp to 0.0 - 1.0 (0% - 100%)
        return min(score, 1.0f)
    }
}

class SmileStrategy : BaseExerciseStrategy() {
    override fun calculateScore(shapes: List<Category>, baseline: CalibrationBaseline, difficulty: Float): Float {
        val left = getScore(shapes, "mouthSmileLeft")
        val right = getScore(shapes, "mouthSmileRight")
        val raw = (left + right) / 2
        val corrected = applyNeutralOffset(raw, baseline, CalibrationBaseline.KEY_SMILE)
        
        return calculate(corrected, baseline.mouthSmileMax, difficulty)
    }
}

class BrowsStrategy : BaseExerciseStrategy() {
    override fun calculateScore(shapes: List<Category>, baseline: CalibrationBaseline, difficulty: Float): Float {
        val inner = getScore(shapes, "browInnerUp")
        val outerLeft = getScore(shapes, "browOuterUpLeft")
        val outerRight = getScore(shapes, "browOuterUpRight")
        val raw = (inner + outerLeft + outerRight) / 3
        val corrected = applyNeutralOffset(raw, baseline, CalibrationBaseline.KEY_BROW_RAISE)
        
        return calculate(corrected, baseline.browRaiseMax, difficulty)
    }
}

class JawStrategy : BaseExerciseStrategy() {
    override fun calculateScore(shapes: List<Category>, baseline: CalibrationBaseline, difficulty: Float): Float {
        val raw = getScore(shapes, "jawOpen")
        val corrected = applyNeutralOffset(raw, baseline, CalibrationBaseline.KEY_JAW_OPEN)
        return calculate(corrected, baseline.mouthOpenMax, difficulty)
    }
}

class KissStrategy : BaseExerciseStrategy() {
    override fun calculateScore(shapes: List<Category>, baseline: CalibrationBaseline, difficulty: Float): Float {
        val raw = getScore(shapes, "mouthPucker")
        val corrected = applyNeutralOffset(raw, baseline, CalibrationBaseline.KEY_KISS)
        return calculate(corrected, baseline.duckFaceMax, difficulty)
    }
}

/**
 * EyesStrategy (Standard - Close Eyes)
 * Logic: eyeBlink blendshape goes from 0.0 (Open) to 1.0 (Closed).
 * Goal: Reach a high value (Closing eyes tightly).
 * Formula: score = currentAvg / (baseline.eyesClosedMax * difficulty)
 */
class EyesStrategy : BaseExerciseStrategy() {
    override fun calculateScore(shapes: List<Category>, baseline: CalibrationBaseline, difficulty: Float): Float {
        val left = getScore(shapes, "eyeBlinkLeft")
        val right = getScore(shapes, "eyeBlinkRight")
        val raw = (left + right) / 2f
        val corrected = applyNeutralOffset(raw, baseline, CalibrationBaseline.KEY_EYES_CLOSED)
        
        return calculate(corrected, baseline.eyesClosedMax, difficulty)
    }
}

/**
 * EyesInverseStrategy (Inverse - Open Eyes Wide)
 * Logic: eyeBlink blendshape goes from 0.0 (Open) to 1.0 (Closed).
 * Goal: Reach a LOW value (Opening eyes wide).
 * Formula: Since the UI expects a progress bar filling up (0->100%), we invert the math.
 *   - invertedCurrent = 1.0 - currentAvg
 *   - invertedBaseline = 1.0 - baseline.eyesOpenMin
 *   - score = invertedCurrent / invertedBaseline
 */
class EyesInverseStrategy : BaseExerciseStrategy() {
    override fun calculateScore(shapes: List<Category>, baseline: CalibrationBaseline, difficulty: Float): Float {
        val left = getScore(shapes, "eyeBlinkLeft")
        val right = getScore(shapes, "eyeBlinkRight")
        val currentAvg = (left + right) / 2f
        
        val invertedCurrent = 1.0f - currentAvg
        val invertedBaseline = 1.0f - baseline.eyesOpenMin
        
        if (invertedBaseline <= 0.001f) {
            return invertedCurrent
        }
        
        val score = invertedCurrent / (invertedBaseline * difficulty)
        return min(score, 1.0f)
    }
}
