package com.symma.app.presentation.components.camera

import kotlin.math.ceil

data class VisionPerformanceSnapshot(
    val framesPerSecond: Float,
    val averageInferenceMs: Float,
    val p95InferenceMs: Long,
    val sampleCount: Int
)

/** Sliding-window fps and latency, used to measure RNF-001/RNF-002 on a reference device. */
class VisionPerformanceMonitor(private val windowMs: Long = DEFAULT_WINDOW_MS) {

    private data class FrameSample(val timestampMs: Long, val inferenceTimeMs: Long)

    private val samples = ArrayDeque<FrameSample>()

    fun record(timestampMs: Long, inferenceTimeMs: Long): VisionPerformanceSnapshot {
        samples.addLast(FrameSample(timestampMs, inferenceTimeMs))
        while (samples.first().timestampMs < timestampMs - windowMs) {
            samples.removeFirst()
        }
        return snapshot()
    }

    private fun snapshot(): VisionPerformanceSnapshot {
        val spanMs = samples.last().timestampMs - samples.first().timestampMs
        val framesPerSecond = if (samples.size > 1 && spanMs > 0) (samples.size - 1) * 1000f / spanMs else 0f
        val latencies = samples.map { it.inferenceTimeMs }.sorted()
        val p95Index = (ceil(latencies.size * P95) - 1).toInt().coerceIn(0, latencies.lastIndex)
        return VisionPerformanceSnapshot(
            framesPerSecond = framesPerSecond,
            averageInferenceMs = latencies.average().toFloat(),
            p95InferenceMs = latencies[p95Index],
            sampleCount = samples.size
        )
    }

    private companion object {
        const val DEFAULT_WINDOW_MS = 5_000L
        const val P95 = 0.95
    }
}
