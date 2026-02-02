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
}
