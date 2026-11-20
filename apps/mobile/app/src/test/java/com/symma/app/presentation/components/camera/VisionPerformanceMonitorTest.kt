package com.symma.app.presentation.components.camera

import org.junit.Assert.assertEquals
import org.junit.Test

class VisionPerformanceMonitorTest {

    @Test
    fun `steady 30 fps stream reports 30 fps`() {
        val monitor = VisionPerformanceMonitor(windowMs = 1_000)
        var snapshot: VisionPerformanceSnapshot? = null

        (0 until 60).forEach { frame -> snapshot = monitor.record(timestampMs = frame * 1000L / 30, inferenceTimeMs = 20) }

        assertEquals(30f, snapshot!!.framesPerSecond, 0.6f)
    }

    @Test
    fun `latency reports the average and the 95th percentile of the window`() {
        val monitor = VisionPerformanceMonitor(windowMs = 10_000)
        var snapshot: VisionPerformanceSnapshot? = null

        (1..100).forEach { frame -> snapshot = monitor.record(timestampMs = frame * 33L, inferenceTimeMs = frame.toLong()) }

        assertEquals(50.5f, snapshot!!.averageInferenceMs, 0.01f)
        assertEquals(95L, snapshot!!.p95InferenceMs)
        assertEquals(100, snapshot!!.sampleCount)
    }

    @Test
    fun `frames older than the window are discarded`() {
        val monitor = VisionPerformanceMonitor(windowMs = 1_000)

        monitor.record(timestampMs = 0, inferenceTimeMs = 500)
        val snapshot = monitor.record(timestampMs = 2_000, inferenceTimeMs = 10)

        assertEquals(1, snapshot.sampleCount)
        assertEquals(10L, snapshot.p95InferenceMs)
        assertEquals(0f, snapshot.framesPerSecond, 0f)
    }
}
