package com.symma.app.data.repository

import android.content.SharedPreferences
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.repository.CalibrationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CalibrationRepositoryImpl @Inject constructor(
    private val sharedPreferences: SharedPreferences
) : CalibrationRepository {

    private val _baselineFlow = MutableStateFlow<CalibrationBaseline?>(null)

    init {
        _baselineFlow.value = loadFromPrefs()
    }

    override suspend fun saveBaseline(baseline: CalibrationBaseline) {
        sharedPreferences.edit().apply {
            putFloat(KEY_MOUTH_SMILE_MAX, baseline.mouthSmileMax)
            putFloat(KEY_BROW_RAISE_MAX, baseline.browRaiseMax)
            putFloat(KEY_MOUTH_OPEN_MAX, baseline.mouthOpenMax)
            putFloat(KEY_DUCK_FACE_MAX, baseline.duckFaceMax)
            putFloat(KEY_EYES_CLOSED_MAX, baseline.eyesClosedMax)
            putFloat(KEY_EYES_OPEN_MIN, baseline.eyesOpenMin)
            apply()
        }
        _baselineFlow.value = baseline
    }

    override fun getBaselineFlow(): Flow<CalibrationBaseline?> = _baselineFlow.asStateFlow()

    override fun getBaseline(): CalibrationBaseline? = _baselineFlow.value

    private fun loadFromPrefs(): CalibrationBaseline? {
        if (!sharedPreferences.contains(KEY_MOUTH_SMILE_MAX)) {
            return null
        }
        return CalibrationBaseline(
            mouthSmileMax = sharedPreferences.getFloat(KEY_MOUTH_SMILE_MAX, 0.5f),
            browRaiseMax = sharedPreferences.getFloat(KEY_BROW_RAISE_MAX, 0.5f),
            mouthOpenMax = sharedPreferences.getFloat(KEY_MOUTH_OPEN_MAX, 0.5f),
            duckFaceMax = sharedPreferences.getFloat(KEY_DUCK_FACE_MAX, 0.5f),
            eyesClosedMax = sharedPreferences.getFloat(KEY_EYES_CLOSED_MAX, 0.8f),
            eyesOpenMin = sharedPreferences.getFloat(KEY_EYES_OPEN_MIN, 0.1f)
        )
    }

    companion object {
        private const val KEY_MOUTH_SMILE_MAX = "calibration_mouth_smile_max"
        private const val KEY_BROW_RAISE_MAX = "calibration_brow_raise_max"
        private const val KEY_MOUTH_OPEN_MAX = "calibration_mouth_open_max"
        private const val KEY_DUCK_FACE_MAX = "calibration_duck_face_max"
        private const val KEY_EYES_CLOSED_MAX = "calibration_eyes_closed_max"
        private const val KEY_EYES_OPEN_MIN = "calibration_eyes_open_min"
    }
}
