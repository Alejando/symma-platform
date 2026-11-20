package com.symma.app.domain.logic

private const val PERCENT_MAX = 100f

/** Strategies score on 0–1; storage and the session contract use 0–100, and this is the only conversion. */
fun unitScoreToPercent(unitScore: Float): Float = (unitScore * PERCENT_MAX).coerceIn(0f, PERCENT_MAX)

fun Float.isValidPercent(): Boolean = this in 0f..PERCENT_MAX
