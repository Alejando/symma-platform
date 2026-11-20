package com.symma.app.domain.logic

import com.google.mediapipe.tasks.components.containers.Category
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.MobileModule
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class StrategiesTest {

    private fun createCategory(name: String, score: Float): Category {
        return Category.create(score, 0, name, "")
    }

    // ==================== EyesStrategy Tests ====================

    @Test
    fun `EyesStrategy - perfect score when blink matches baseline`() {
        val strategy = EyesStrategy()
        val baseline = CalibrationBaseline(eyesClosedMax = 0.8f)
        
        val shapes = listOf(
            createCategory("eyeBlinkLeft", 0.8f),
            createCategory("eyeBlinkRight", 0.8f)
        )
        
        val score = strategy.calculateScore(shapes, baseline, 1.0f)
        assertEquals(1.0f, score, 0.01f)
    }

    @Test
    fun `EyesStrategy - half score when blink is half of baseline`() {
        val strategy = EyesStrategy()
        val baseline = CalibrationBaseline(eyesClosedMax = 0.8f)
        
        val shapes = listOf(
            createCategory("eyeBlinkLeft", 0.4f),
            createCategory("eyeBlinkRight", 0.4f)
        )
        
        val score = strategy.calculateScore(shapes, baseline, 1.0f)
        assertEquals(0.5f, score, 0.01f)
    }

    @Test
    fun `EyesStrategy - clamped to 1 when exceeding baseline`() {
        val strategy = EyesStrategy()
        val baseline = CalibrationBaseline(eyesClosedMax = 0.5f)
        
        val shapes = listOf(
            createCategory("eyeBlinkLeft", 0.8f),
            createCategory("eyeBlinkRight", 0.8f)
        )
        
        val score = strategy.calculateScore(shapes, baseline, 1.0f)
        assertEquals(1.0f, score, 0.01f)
    }

    @Test
    fun `EyesStrategy - difficulty affects score`() {
        val strategy = EyesStrategy()
        val baseline = CalibrationBaseline(eyesClosedMax = 0.8f)
        
        val shapes = listOf(
            createCategory("eyeBlinkLeft", 0.8f),
            createCategory("eyeBlinkRight", 0.8f)
        )
        
        val score = strategy.calculateScore(shapes, baseline, 2.0f)
        assertEquals(0.5f, score, 0.01f)
    }

    @Test
    fun `EyesStrategy - asymmetric blink averages correctly`() {
        val strategy = EyesStrategy()
        val baseline = CalibrationBaseline(eyesClosedMax = 0.8f)
        
        val shapes = listOf(
            createCategory("eyeBlinkLeft", 0.6f),
            createCategory("eyeBlinkRight", 0.2f)
        )
        
        val score = strategy.calculateScore(shapes, baseline, 1.0f)
        assertEquals(0.5f, score, 0.01f)
    }

    // ==================== EyesInverseStrategy Tests ====================

    private val eyesWideBaseline = CalibrationBaseline(
        eyesWideMax = 0.4f,
        neutralOffsets = mapOf(CalibrationBaseline.KEY_EYES_WIDE to 0.05f)
    )

    private fun restingEyes() = listOf(
        createCategory("eyeBlinkLeft", 0.05f),
        createCategory("eyeBlinkRight", 0.05f),
        createCategory("eyeWideLeft", 0.05f),
        createCategory("eyeWideRight", 0.05f)
    )

    @Test
    fun `EyesInverseStrategy - resting face stays below the engage threshold`() {
        val score = EyesInverseStrategy().calculateScore(restingEyes(), eyesWideBaseline, 1.0f)

        assertTrue("Resting face scored $score", score < REP_RELEASE_THRESHOLD)
        assertEquals(0.0f, score, 0.01f)
    }

    @Test
    fun `EyesInverseStrategy - resting face without tare stays below the engage threshold`() {
        val uncalibrated = CalibrationBaseline()

        val score = EyesInverseStrategy().calculateScore(restingEyes(), uncalibrated, 1.0f)

        assertTrue("Resting face scored $score", score < REP_ENGAGE_THRESHOLD)
    }

    @Test
    fun `EyesInverseStrategy - perfect score when eyes open as wide as calibrated`() {
        val shapes = listOf(
            createCategory("eyeWideLeft", 0.45f),
            createCategory("eyeWideRight", 0.45f)
        )

        val score = EyesInverseStrategy().calculateScore(shapes, eyesWideBaseline, 1.0f)

        assertEquals(1.0f, score, 0.01f)
    }

    @Test
    fun `EyesInverseStrategy - partial opening gives a proportional score after tare`() {
        val shapes = listOf(
            createCategory("eyeWideLeft", 0.25f),
            createCategory("eyeWideRight", 0.25f)
        )

        val score = EyesInverseStrategy().calculateScore(shapes, eyesWideBaseline, 1.0f)

        assertEquals(0.5f, score, 0.01f)
    }

    @Test
    fun `EyesInverseStrategy - closed eyes score zero`() {
        val shapes = listOf(
            createCategory("eyeBlinkLeft", 1.0f),
            createCategory("eyeBlinkRight", 1.0f),
            createCategory("eyeWideLeft", 0.0f),
            createCategory("eyeWideRight", 0.0f)
        )

        val score = EyesInverseStrategy().calculateScore(shapes, eyesWideBaseline, 1.0f)

        assertEquals(0.0f, score, 0.01f)
    }

    @Test
    fun `EyesInverseStrategy - difficulty affects score`() {
        val shapes = listOf(
            createCategory("eyeWideLeft", 0.25f),
            createCategory("eyeWideRight", 0.25f)
        )

        val scoreEasy = EyesInverseStrategy().calculateScore(shapes, eyesWideBaseline, 1.0f)
        val scoreHard = EyesInverseStrategy().calculateScore(shapes, eyesWideBaseline, 2.0f)

        assertTrue("Harder difficulty should result in lower score", scoreHard < scoreEasy)
    }

    // ==================== Factory Tests ====================

    @Test
    fun `Factory returns EyesStrategy for EYES module`() {
        val strategy = ExerciseStrategyFactory.getStrategy(MobileModule.EYES)
        assertTrue(strategy is EyesStrategy)
    }

    @Test
    fun `Factory returns EyesInverseStrategy for EYES_INVERSE module`() {
        val strategy = ExerciseStrategyFactory.getStrategy(MobileModule.EYES_INVERSE)
        assertTrue(strategy is EyesInverseStrategy)
    }

    @Test
    fun `Factory returns EyesStrategy for eye keynames`() {
        assertTrue(ExerciseStrategyFactory.getStrategy("eyes") is EyesStrategy)
        assertTrue(ExerciseStrategyFactory.getStrategy("eye_close") is EyesStrategy)
        assertTrue(ExerciseStrategyFactory.getStrategy("blink") is EyesStrategy)
    }

    @Test
    fun `Factory returns EyesInverseStrategy for inverse eye keynames`() {
        assertTrue(ExerciseStrategyFactory.getStrategy("eyes_inverse") is EyesInverseStrategy)
        assertTrue(ExerciseStrategyFactory.getStrategy("eye_open") is EyesInverseStrategy)
        assertTrue(ExerciseStrategyFactory.getStrategy("wide_eyes") is EyesInverseStrategy)
    }

    @Test
    fun `Factory returns null for UNKNOWN module`() {
        val strategy = ExerciseStrategyFactory.getStrategy(MobileModule.UNKNOWN)
        assertEquals(null, strategy)
    }

    @Test
    fun `Factory returns correct strategies for all modules`() {
        assertTrue(ExerciseStrategyFactory.getStrategy(MobileModule.SMILE) is SmileStrategy)
        assertTrue(ExerciseStrategyFactory.getStrategy(MobileModule.BROWS) is BrowsStrategy)
        assertTrue(ExerciseStrategyFactory.getStrategy(MobileModule.JAW) is JawStrategy)
        assertTrue(ExerciseStrategyFactory.getStrategy(MobileModule.KISS) is KissStrategy)
    }
}
