package com.symma.app.data.repository

import android.content.SharedPreferences
import android.util.Log
import com.symma.app.core.di.EncryptedCalibrationPreferences
import com.symma.app.data.local.calibration.LegacyCalibrationPreferences
import com.symma.app.data.local.calibration.calibrationFromStoredJson
import com.symma.app.data.local.calibration.toStoredJson
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.repository.CalibrationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

private const val TAG = "CalibrationRepo"

@Singleton
class CalibrationRepositoryImpl @Inject constructor(
    @EncryptedCalibrationPreferences private val encryptedPreferences: SharedPreferences,
    private val legacyPreferences: LegacyCalibrationPreferences
) : CalibrationRepository {

    private val _baselineFlow = MutableStateFlow<CalibrationBaseline?>(null)

    init {
        moveLegacyCalibrationToEncryptedStore()
        _baselineFlow.value = calibrationFromStoredJson(encryptedPreferences.getString(KEY_BASELINE, null))
    }

    override suspend fun saveBaseline(baseline: CalibrationBaseline) {
        encryptedPreferences.edit().putString(KEY_BASELINE, baseline.toStoredJson()).apply()
        _baselineFlow.value = baseline
    }

    override fun getBaselineFlow(): Flow<CalibrationBaseline?> = _baselineFlow.asStateFlow()

    override fun getBaseline(): CalibrationBaseline? = _baselineFlow.value

    /** The plaintext copy is removed only after the encrypted copy is durably written. */
    private fun moveLegacyCalibrationToEncryptedStore() {
        val legacyBaseline = legacyPreferences.readBaseline() ?: return
        if (!encryptedPreferences.contains(KEY_BASELINE)) {
            val written = encryptedPreferences.edit().putString(KEY_BASELINE, legacyBaseline.toStoredJson()).commit()
            if (!written) {
                Log.e(TAG, "Could not write the encrypted calibration, keeping the legacy copy")
                return
            }
        }
        legacyPreferences.clear()
        Log.d(TAG, "Legacy calibration moved to encrypted storage")
    }

    private companion object {
        const val KEY_BASELINE = "calibration_baseline"
    }
}
