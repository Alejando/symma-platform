package com.symma.app.domain.logic

import com.symma.app.domain.model.MobileModule

object ExerciseStrategyFactory {
    
    /**
     * Gets strategy by MobileModule enum (preferred method).
     */
    fun getStrategy(module: MobileModule): ExerciseStrategy? {
        return when (module) {
            MobileModule.EYES -> EyesStrategy()
            MobileModule.EYES_INVERSE -> EyesInverseStrategy()
            MobileModule.BROWS -> BrowsStrategy()
            MobileModule.JAW -> JawStrategy()
            MobileModule.SMILE -> SmileStrategy()
            MobileModule.KISS -> KissStrategy()
            MobileModule.UNKNOWN -> null
        }
    }
    
    /**
     * Gets strategy by exercise key name (legacy compatibility).
     */
    fun getStrategy(exerciseKeyName: String): ExerciseStrategy? {
        return when (exerciseKeyName.lowercase()) {
            "eyes", "eye_close", "blink" -> EyesStrategy()
            "eyes_inverse", "eye_open", "wide_eyes" -> EyesInverseStrategy()
            "smile", "mouth_smile" -> SmileStrategy()
            "brows", "eyebrows", "brow_raise" -> BrowsStrategy()
            "jaw", "jaw_open", "mouth_open" -> JawStrategy()
            "kiss", "pucker", "duck_face" -> KissStrategy()
            else -> null
        }
    }
}
