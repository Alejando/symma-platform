package com.symma.app.domain.model

import org.junit.Assert.assertEquals
import org.junit.Test

class RoutineItemConfigTest {

    private fun item(exerciseType: String, holdTimeSeconds: Int) = RoutineItem(
        id = "item-1",
        orderIndex = 0,
        targetRepetitions = 5,
        targetSets = 1,
        holdTimeSeconds = holdTimeSeconds,
        restBetweenSetsSeconds = 0,
        exercise = Exercise("ex-1", "Smile", "smile", null, exerciseType, "CORE", "SMILE", null, null)
    )

    @Test
    fun `therapist exercise type wins over the hold time`() {
        assertEquals(ExerciseType.ISOTONIC, item("ISOTONIC", holdTimeSeconds = 3).config.exerciseType)
        assertEquals(ExerciseType.ISOMETRIC, item("ISOMETRIC", holdTimeSeconds = 0).config.exerciseType)
        assertEquals(ExerciseType.RELAXATION, item("RELAXATION", holdTimeSeconds = 5).config.exerciseType)
    }

    @Test
    fun `unknown exercise type falls back to the hold time`() {
        assertEquals(ExerciseType.ISOMETRIC, item("legacy", holdTimeSeconds = 3).config.exerciseType)
        assertEquals(ExerciseType.ISOTONIC, item("legacy", holdTimeSeconds = 0).config.exerciseType)
    }

    @Test
    fun `isometric exercise without hold time still requires a one second hold`() {
        assertEquals(1, item("ISOMETRIC", holdTimeSeconds = 0).config.holdSeconds)
        assertEquals(0, item("ISOTONIC", holdTimeSeconds = 0).config.holdSeconds)
    }
}
