package com.symma.app.data.local.calibration

import android.content.SharedPreferences
import com.symma.app.domain.model.CalibrationBaseline
import org.json.JSONException
import org.json.JSONObject

/**
 * Calibration as earlier versions stored it, in plaintext preferences. The file was only written
 * when a calibration was saved, so its modification time is the best available capture time.
 */
class LegacyCalibrationPreferences(
    private val preferences: SharedPreferences,
    private val lastModifiedMillis: Long?
) {

    fun readBaseline(): CalibrationBaseline? {
        if (!preferences.contains(KEY_MOUTH_SMILE_MAX)) return null
        return CalibrationBaseline(
            mouthSmileMax = preferences.getFloat(KEY_MOUTH_SMILE_MAX, DEFAULT_MAX),
            browRaiseMax = preferences.getFloat(KEY_BROW_RAISE_MAX, DEFAULT_MAX),
            mouthOpenMax = preferences.getFloat(KEY_MOUTH_OPEN_MAX, DEFAULT_MAX),
            duckFaceMax = preferences.getFloat(KEY_DUCK_FACE_MAX, DEFAULT_MAX),
            eyesClosedMax = preferences.getFloat(KEY_EYES_CLOSED_MAX, LEGACY_DEFAULT_EYES_CLOSED_MAX),
            eyesWideMax = preferences.getFloat(KEY_EYES_WIDE_MAX, DEFAULT_MAX),
            neutralOffsets = parseNeutralOffsets(preferences.getString(KEY_NEUTRAL_OFFSETS, null)),
            capturedAtMillis = lastModifiedMillis
        )
    }

    fun clear() {
        preferences.edit().apply { LEGACY_KEYS.forEach(::remove) }.commit()
    }

    private fun parseNeutralOffsets(json: String?): Map<String, Float> {
        if (json.isNullOrEmpty()) return emptyMap()
        return try {
            val jsonObject = JSONObject(json)
            jsonObject.keys().asSequence().associateWith { key -> jsonObject.getDouble(key).toFloat() }
        } catch (e: JSONException) {
            emptyMap()
        }
    }

    private companion object {
        const val DEFAULT_MAX = 0.5f
        const val LEGACY_DEFAULT_EYES_CLOSED_MAX = 0.8f
        const val KEY_MOUTH_SMILE_MAX = "calibration_mouth_smile_max"
        const val KEY_BROW_RAISE_MAX = "calibration_brow_raise_max"
        const val KEY_MOUTH_OPEN_MAX = "calibration_mouth_open_max"
        const val KEY_DUCK_FACE_MAX = "calibration_duck_face_max"
        const val KEY_EYES_CLOSED_MAX = "calibration_eyes_closed_max"
        const val KEY_EYES_WIDE_MAX = "calibration_eyes_wide_max"
        const val KEY_NEUTRAL_OFFSETS = "calibration_neutral_offsets"
        val LEGACY_KEYS = listOf(
            KEY_MOUTH_SMILE_MAX, KEY_BROW_RAISE_MAX, KEY_MOUTH_OPEN_MAX, KEY_DUCK_FACE_MAX,
            KEY_EYES_CLOSED_MAX, KEY_EYES_WIDE_MAX, KEY_NEUTRAL_OFFSETS
        )
    }
}
