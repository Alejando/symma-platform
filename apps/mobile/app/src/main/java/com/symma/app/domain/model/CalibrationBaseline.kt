package com.symma.app.domain.model

data class CalibrationBaseline(
    // Active Max Values (P95 filtered)
    val mouthOpenMax: Float = 0.5f,
    val mouthSmileMax: Float = 0.5f,
    val browRaiseMax: Float = 0.5f,
    val duckFaceMax: Float = 0.5f,
    val eyesClosedMax: Float = 0.5f,
    val eyesWideMax: Float = 0.5f,

    // Neutral Offsets (Tare values from resting face)
    val neutralOffsets: Map<String, Float> = emptyMap(),

    val capturedAtMillis: Long? = null
) {
    companion object {
        const val KEY_JAW_OPEN = "jawOpen"
        const val KEY_SMILE = "smile"
        const val KEY_BROW_RAISE = "browRaise"
        const val KEY_KISS = "kiss"
        const val KEY_EYES_CLOSED = "eyesClosed"
        const val KEY_EYES_WIDE = "eyesWide"

        val GESTURE_KEYS = listOf(KEY_JAW_OPEN, KEY_SMILE, KEY_BROW_RAISE, KEY_KISS, KEY_EYES_CLOSED, KEY_EYES_WIDE)
    }

    fun getNeutralOffset(key: String): Float = neutralOffsets[key] ?: 0f

    fun gestureMax(key: String): Float? = when (key) {
        KEY_JAW_OPEN -> mouthOpenMax
        KEY_SMILE -> mouthSmileMax
        KEY_BROW_RAISE -> browRaiseMax
        KEY_KISS -> duckFaceMax
        KEY_EYES_CLOSED -> eyesClosedMax
        KEY_EYES_WIDE -> eyesWideMax
        else -> null
    }

    fun withGestureMax(key: String, max: Float): CalibrationBaseline = when (key) {
        KEY_JAW_OPEN -> copy(mouthOpenMax = max)
        KEY_SMILE -> copy(mouthSmileMax = max)
        KEY_BROW_RAISE -> copy(browRaiseMax = max)
        KEY_KISS -> copy(duckFaceMax = max)
        KEY_EYES_CLOSED -> copy(eyesClosedMax = max)
        KEY_EYES_WIDE -> copy(eyesWideMax = max)
        else -> this
    }
}
