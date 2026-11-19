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
    val neutralOffsets: Map<String, Float> = emptyMap()
) {
    companion object {
        const val KEY_JAW_OPEN = "jawOpen"
        const val KEY_SMILE = "smile"
        const val KEY_BROW_RAISE = "browRaise"
        const val KEY_KISS = "kiss"
        const val KEY_EYES_CLOSED = "eyesClosed"
        const val KEY_EYES_WIDE = "eyesWide"
    }

    fun getNeutralOffset(key: String): Float = neutralOffsets[key] ?: 0f

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
