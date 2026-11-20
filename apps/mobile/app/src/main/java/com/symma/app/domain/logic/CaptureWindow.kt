package com.symma.app.domain.logic

/**
 * Measures a capture window in frame time. Only steady frames advance it, so a capture paused by
 * head movement resumes where it stopped; gaps between frames are capped so a stall cannot
 * finish the window in one jump.
 */
class CaptureWindow(
    private val durationMs: Long,
    private val maxFrameGapMs: Long
) {
    private var elapsedMs = 0L
    private var lastFrameTimestampMs: Long? = null

    val progress: Float get() = (elapsedMs.toFloat() / durationMs).coerceIn(0f, 1f)

    val isComplete: Boolean get() = elapsedMs >= durationMs

    fun onFrame(timestampMs: Long, isSteady: Boolean) {
        val gapMs = lastFrameTimestampMs?.let { (timestampMs - it).coerceIn(0L, maxFrameGapMs) } ?: 0L
        lastFrameTimestampMs = timestampMs
        if (isSteady) elapsedMs += gapMs
    }

    fun restart() {
        elapsedMs = 0L
        lastFrameTimestampMs = null
    }
}
