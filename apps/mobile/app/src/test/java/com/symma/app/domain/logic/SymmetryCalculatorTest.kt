package com.symma.app.domain.logic

import com.google.mediapipe.tasks.components.containers.NormalizedLandmark
import org.junit.Assert.assertEquals
import org.junit.Test

class SymmetryCalculatorTest {

    private val calculator = SymmetryCalculator()

    @Test
    fun `calculateSmileSymmetry returns 0 for empty landmarks`() {
        val score = calculator.calculateSmileSymmetry(emptyList())
        assertEquals(0f, score, 0.01f)
    }

    @Test
    fun `calculateSmileSymmetry returns 0 for completely overlapping points`() {
        // Mock landmarks where everything is at 0,0
        val landmarks = MutableList(300) { createLandmark(0f, 0f) }
        val score = calculator.calculateSmileSymmetry(landmarks)
        assertEquals(0f, score, 0.01f)
    }

    @Test
    fun `calculateSmileSymmetry returns 100 for perfect symmetry`() {
        // Center at 0.5, 0.5
        // Left at 0.4, 0.5 (dist 0.1)
        // Right at 0.6, 0.5 (dist 0.1)
        
        val landmarks = MutableList(300) { createLandmark(0f, 0f) }
        landmarks[13] = createLandmark(0.5f, 0.5f) // Center
        landmarks[61] = createLandmark(0.4f, 0.5f) // Left
        landmarks[291] = createLandmark(0.6f, 0.5f) // Right

        val score = calculator.calculateSmileSymmetry(landmarks)
        assertEquals(100f, score, 0.01f)
    }

    @Test
    fun `calculateSmileSymmetry detects asymmetry`() {
        // Center at 0.5, 0.5
        // Left at 0.4, 0.5 (dist 0.1)
        // Right at 0.7, 0.5 (dist 0.2)
        // MaxDist = 0.2
        // Diff = 0.1
        // Ratio = 0.1 / 0.2 = 0.5
        // Score = (1 - 0.5) * 100 = 50

        val landmarks = MutableList(300) { createLandmark(0f, 0f) }
        landmarks[13] = createLandmark(0.5f, 0.5f) // Center
        landmarks[61] = createLandmark(0.4f, 0.5f) // Left
        landmarks[291] = createLandmark(0.7f, 0.5f) // Right

        val score = calculator.calculateSmileSymmetry(landmarks)
        assertEquals(50f, score, 0.01f)
    }

    private fun createLandmark(x: Float, y: Float): NormalizedLandmark {
        // NormalizedLandmark has a protected constructor or builder. 
        // We typically use the builder.
        return NormalizedLandmark.create(x, y, 0f)
    }
}
