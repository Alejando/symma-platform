package com.symma.app.domain.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ExerciseMetricsRecorderTest {

    private val recorder = ExerciseMetricsRecorder()

    @Test
    fun `an exercise without samples has no metrics`() {
        assertEquals(ExerciseMetrics(null, null, null), recorder.metrics())
    }

    @Test
    fun `gesture scores are averaged and reported as a percentage`() {
        recorder.recordGestureScore(0.5f)
        recorder.recordGestureScore(1.0f)

        assertEquals(75f, recorder.metrics().averageAccuracy!!, 0.001f)
    }

    @Test
    fun `symmetry is averaged on its own 0 to 100 scale and ignores invalid samples`() {
        recorder.recordSymmetry(80f)
        recorder.recordSymmetry(90f)
        recorder.recordSymmetry(Float.NaN)
        recorder.recordSymmetry(140f)

        assertEquals(85f, recorder.metrics().symmetryScore!!, 0.001f)
    }

    @Test
    fun `holds are averaged in seconds`() {
        recorder.recordHold(3_000)
        recorder.recordHold(2_000)
        recorder.recordHold(0)

        assertEquals(2.5f, recorder.metrics().averageHoldSeconds!!, 0.001f)
    }

    @Test
    fun `reset starts the next exercise from scratch`() {
        recorder.recordGestureScore(1f)
        recorder.recordSymmetry(90f)
        recorder.recordHold(1_000)

        recorder.reset()

        assertNull(recorder.metrics().averageAccuracy)
        assertNull(recorder.metrics().symmetryScore)
        assertNull(recorder.metrics().averageHoldSeconds)
    }
}
