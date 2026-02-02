package com.symma.app.domain.logic

import com.google.mediapipe.tasks.components.containers.Category
import com.symma.app.domain.model.CalibrationBaseline

interface ExerciseStrategy {
    fun calculateScore(shapes: List<Category>, baseline: CalibrationBaseline, difficulty: Float): Float
}
