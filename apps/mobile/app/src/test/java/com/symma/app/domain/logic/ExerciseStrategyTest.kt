package com.symma.app.domain.logic

import com.google.mediapipe.tasks.components.containers.Category
import com.symma.app.domain.model.CalibrationBaseline
import org.junit.Assert.assertEquals
import org.junit.Test

class ExerciseStrategyTest {

    private val baseline = CalibrationBaseline(
        mouthSmileMax = 0.8f,
        browRaiseMax = 0.6f,
        mouthOpenMax = 0.5f,
        duckFaceMax = 0.4f
    )
    // Note: I used a typo in my dummy baseline above "monthOpenMax" vs "mouthOpenMax", 
    // I need to be careful or check the actual class definition.
    // CalibrationBaseline definition: mouthOpenMax, mouthSmileMax, browRaiseMax, duckFaceMax, eyesClosedMax.
    // I will correct the property name in the actual test code below.

    private fun createCategory(name: String, score: Float): Category {
        return Category.create(score, 0, name, "")
    }

    @Test
    fun `SmileStrategy calculates correctly`() {
        val strategy = SmileStrategy()
        // Input: Left=0.4, Right=0.4 => Avg=0.4
        // Baseline: 0.8
        // Difficulty: 1.0
        // Expected: 0.4 / 0.8 = 0.5
        
        val shapes = listOf(
            createCategory("mouthSmileLeft", 0.4f),
            createCategory("mouthSmileRight", 0.4f)
        )
        
        val score = strategy.calculateScore(shapes, baseline, 1.0f)
        assertEquals(0.5f, score, 0.01f)
    }

    @Test
    fun `SmileStrategy with difficulty`() {
        val strategy = SmileStrategy()
        // Input: 0.4
        // Baseline: 0.8
        // Difficulty: 2.0
        // Expected: 0.4 / (0.8 * 2.0) = 0.4 / 1.6 = 0.25
        
        val shapes = listOf(
            createCategory("mouthSmileLeft", 0.4f),
            createCategory("mouthSmileRight", 0.4f)
        )
        
        val score = strategy.calculateScore(shapes, baseline, 2.0f)
        assertEquals(0.25f, score, 0.01f)
    }
    
    @Test
    fun `BrowsStrategy calculates average`() {
        val strategy = BrowsStrategy()
        // Inner=0.3, OuterLeft=0.3, OuterRight=0.3 => Avg=0.3
        // Baseline: 0.6
        // Expected: 0.3 / 0.6 = 0.5
        
        val shapes = listOf(
            createCategory("browInnerUp", 0.3f),
            createCategory("browOuterUpLeft", 0.3f),
            createCategory("browOuterUpRight", 0.3f)
        )
        
        val score = strategy.calculateScore(shapes, baseline, 1.0f)
        assertEquals(0.5f, score, 0.01f)
    }

    @Test
    fun `Factory returns correct strategy`() {
        assert(ExerciseStrategyFactory.getStrategy("smile") is SmileStrategy)
        assert(ExerciseStrategyFactory.getStrategy("brows") is BrowsStrategy)
        assert(ExerciseStrategyFactory.getStrategy("jaw") is JawStrategy)
        assert(ExerciseStrategyFactory.getStrategy("kiss") is KissStrategy)
        assert(ExerciseStrategyFactory.getStrategy("unknown") == null)
    }

    // ==================== Neutral Offset Tests ====================

    @Test
    fun `SmileStrategy applies neutral offset`() {
        val strategy = SmileStrategy()
        val baselineWithOffset = CalibrationBaseline(
            mouthSmileMax = 0.72f,
            neutralOffsets = mapOf(CalibrationBaseline.KEY_SMILE to 0.08f)
        )
        // Raw: (0.52 + 0.52) / 2 = 0.52
        // Corrected: 0.52 - 0.08 = 0.44
        // Score: 0.44 / 0.72 = 0.611
        val shapes = listOf(
            createCategory("mouthSmileLeft", 0.52f),
            createCategory("mouthSmileRight", 0.52f)
        )
        val score = strategy.calculateScore(shapes, baselineWithOffset, 1.0f)
        assertEquals(0.611f, score, 0.01f)
    }

    @Test
    fun `SmileStrategy without neutral offset gives higher score`() {
        val strategy = SmileStrategy()
        val baselineNoOffset = CalibrationBaseline(mouthSmileMax = 0.72f)
        val baselineWithOffset = CalibrationBaseline(
            mouthSmileMax = 0.72f,
            neutralOffsets = mapOf(CalibrationBaseline.KEY_SMILE to 0.08f)
        )
        val shapes = listOf(
            createCategory("mouthSmileLeft", 0.52f),
            createCategory("mouthSmileRight", 0.52f)
        )
        val scoreNoOffset = strategy.calculateScore(shapes, baselineNoOffset, 1.0f)
        val scoreWithOffset = strategy.calculateScore(shapes, baselineWithOffset, 1.0f)
        // Without offset: 0.52/0.72 = 0.722
        // With offset: 0.44/0.72 = 0.611
        assert(scoreNoOffset > scoreWithOffset)
    }

    @Test
    fun `Neutral offset clamps to zero - no negative scores`() {
        val strategy = SmileStrategy()
        val baselineWithLargeOffset = CalibrationBaseline(
            mouthSmileMax = 0.72f,
            neutralOffsets = mapOf(CalibrationBaseline.KEY_SMILE to 0.60f)
        )
        // Raw: 0.10, Offset: 0.60 => Corrected: max(0.10 - 0.60, 0) = 0.0
        val shapes = listOf(
            createCategory("mouthSmileLeft", 0.10f),
            createCategory("mouthSmileRight", 0.10f)
        )
        val score = strategy.calculateScore(shapes, baselineWithLargeOffset, 1.0f)
        assertEquals(0.0f, score, 0.001f)
    }

    @Test
    fun `JawStrategy applies neutral offset`() {
        val strategy = JawStrategy()
        val baselineWithOffset = CalibrationBaseline(
            mouthOpenMax = 0.83f,
            neutralOffsets = mapOf(CalibrationBaseline.KEY_JAW_OPEN to 0.03f)
        )
        // Raw: 0.43, Corrected: 0.40, Score: 0.40/0.83 = 0.482
        val shapes = listOf(createCategory("jawOpen", 0.43f))
        val score = strategy.calculateScore(shapes, baselineWithOffset, 1.0f)
        assertEquals(0.482f, score, 0.01f)
    }

    @Test
    fun `KissStrategy applies neutral offset`() {
        val strategy = KissStrategy()
        val baselineWithOffset = CalibrationBaseline(
            duckFaceMax = 0.45f,
            neutralOffsets = mapOf(CalibrationBaseline.KEY_KISS to 0.12f)
        )
        // Raw: 0.32, Corrected: 0.20, Score: 0.20/0.45 = 0.444
        val shapes = listOf(createCategory("mouthPucker", 0.32f))
        val score = strategy.calculateScore(shapes, baselineWithOffset, 1.0f)
        assertEquals(0.444f, score, 0.01f)
    }

    @Test
    fun `BrowsStrategy applies neutral offset`() {
        val strategy = BrowsStrategy()
        val baselineWithOffset = CalibrationBaseline(
            browRaiseMax = 0.58f,
            neutralOffsets = mapOf(CalibrationBaseline.KEY_BROW_RAISE to 0.05f)
        )
        // Raw: (0.35+0.35+0.35)/3 = 0.35, Corrected: 0.30, Score: 0.30/0.58 = 0.517
        val shapes = listOf(
            createCategory("browInnerUp", 0.35f),
            createCategory("browOuterUpLeft", 0.35f),
            createCategory("browOuterUpRight", 0.35f)
        )
        val score = strategy.calculateScore(shapes, baselineWithOffset, 1.0f)
        assertEquals(0.517f, score, 0.01f)
    }

    @Test
    fun `EyesStrategy applies neutral offset`() {
        val strategy = EyesStrategy()
        val baselineWithOffset = CalibrationBaseline(
            eyesClosedMax = 0.91f,
            neutralOffsets = mapOf(CalibrationBaseline.KEY_EYES_CLOSED to 0.15f)
        )
        // Raw: (0.65+0.65)/2 = 0.65, Corrected: 0.50, Score: 0.50/0.91 = 0.549
        val shapes = listOf(
            createCategory("eyeBlinkLeft", 0.65f),
            createCategory("eyeBlinkRight", 0.65f)
        )
        val score = strategy.calculateScore(shapes, baselineWithOffset, 1.0f)
        assertEquals(0.549f, score, 0.01f)
    }
}
