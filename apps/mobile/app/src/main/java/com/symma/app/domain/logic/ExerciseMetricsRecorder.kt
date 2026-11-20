package com.symma.app.domain.logic

data class ExerciseMetrics(
    val averageAccuracy: Float?,
    val symmetryScore: Float?,
    val averageHoldSeconds: Float?
)

/** Collects the samples of one exercise and reduces them to the values sent per session item. */
class ExerciseMetricsRecorder {

    private val gestureScores = mutableListOf<Float>()
    private val symmetryPercents = mutableListOf<Float>()
    private val holdDurationsMs = mutableListOf<Long>()

    fun recordGestureScore(unitScore: Float) {
        if (unitScore.isFinite()) gestureScores += unitScore
    }

    fun recordSymmetry(percent: Float) {
        if (percent.isValidPercent()) symmetryPercents += percent
    }

    fun recordHold(durationMs: Long) {
        if (durationMs > 0) holdDurationsMs += durationMs
    }

    fun metrics(): ExerciseMetrics = ExerciseMetrics(
        averageAccuracy = gestureScores.averageOrNull()?.let(::unitScoreToPercent),
        symmetryScore = symmetryPercents.averageOrNull(),
        averageHoldSeconds = holdDurationsMs.takeIf { it.isNotEmpty() }?.average()?.div(MILLIS_PER_SECOND)?.toFloat()
    )

    fun reset() {
        gestureScores.clear()
        symmetryPercents.clear()
        holdDurationsMs.clear()
    }

    private fun List<Float>.averageOrNull(): Float? = takeIf { it.isNotEmpty() }?.average()?.toFloat()

    private companion object {
        const val MILLIS_PER_SECOND = 1000.0
    }
}
