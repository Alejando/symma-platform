package com.symma.app.domain.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class BestAttemptTrackerTest {

    private val tracker = BestAttemptTracker<String>()

    @Test
    fun `the strongest attempt is kept`() {
        tracker.consider(0.8f, 90f, "weaker")
        tracker.consider(0.95f, 70f, "strongest")
        tracker.consider(0.9f, 99f, "middle")

        assertEquals("strongest", tracker.best())
    }

    @Test
    fun `between equally strong attempts the more symmetric one is kept`() {
        tracker.consider(1f, 75f, "first at target")
        tracker.consider(1f, 92f, "more symmetric")
        tracker.consider(1f, 80f, "less symmetric")

        assertEquals("more symmetric", tracker.best())
    }

    @Test
    fun `an attempt without symmetry still counts`() {
        tracker.consider(0.9f, null, "no landmarks")

        assertEquals("no landmarks", tracker.best())
    }

    @Test
    fun `reset forgets the previous exercise`() {
        tracker.consider(1f, 90f, "previous")

        tracker.reset()

        assertNull(tracker.best())
    }
}
