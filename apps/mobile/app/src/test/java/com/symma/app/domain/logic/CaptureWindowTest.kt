package com.symma.app.domain.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CaptureWindowTest {

    private val window = CaptureWindow(durationMs = 3_000, maxFrameGapMs = 200)

    private fun feed(fromMs: Long, toMs: Long, stepMs: Long, isSteady: Boolean = true) {
        var timestamp = fromMs
        while (timestamp <= toMs) {
            window.onFrame(timestamp, isSteady)
            timestamp += stepMs
        }
    }

    @Test
    fun `the window lasts three seconds of frame time whatever the frame rate`() {
        feed(fromMs = 0, toMs = 2_950, stepMs = 50)
        assertFalse(window.isComplete)

        window.onFrame(3_000, isSteady = true)
        assertTrue(window.isComplete)
    }

    @Test
    fun `a slow camera completes the window in the same time with fewer frames`() {
        feed(fromMs = 0, toMs = 3_000, stepMs = 150)

        assertTrue(window.isComplete)
    }

    @Test
    fun `unsteady frames pause the window`() {
        feed(fromMs = 0, toMs = 1_500, stepMs = 50)
        feed(fromMs = 1_550, toMs = 4_000, stepMs = 50, isSteady = false)

        assertEquals(0.5f, window.progress, 0.001f)
        assertFalse(window.isComplete)
    }

    @Test
    fun `a stalled camera cannot complete the window in one frame`() {
        window.onFrame(0, isSteady = true)
        window.onFrame(10_000, isSteady = true)

        assertEquals(200f / 3_000f, window.progress, 0.0001f)
    }

    @Test
    fun `restart begins a new window`() {
        feed(fromMs = 0, toMs = 3_000, stepMs = 50)

        window.restart()

        assertEquals(0f, window.progress, 0f)
        assertFalse(window.isComplete)
    }
}
