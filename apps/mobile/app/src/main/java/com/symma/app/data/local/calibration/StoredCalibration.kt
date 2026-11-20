package com.symma.app.data.local.calibration

import com.google.gson.Gson
import com.google.gson.JsonParseException
import com.symma.app.domain.model.CalibrationBaseline

/** Serialized form of a calibration, shared by the encrypted preferences and the session rows. */
data class StoredCalibration(
    val capturedAtMillis: Long?,
    val gestureMax: Map<String, Float>,
    val neutralOffsets: Map<String, Float>
)

private val gson = Gson()

fun CalibrationBaseline.toStoredJson(): String = gson.toJson(
    StoredCalibration(
        capturedAtMillis = capturedAtMillis,
        gestureMax = CalibrationBaseline.GESTURE_KEYS.associateWith { key -> gestureMax(key) ?: 0f },
        neutralOffsets = neutralOffsets
    )
)

fun calibrationFromStoredJson(json: String?): CalibrationBaseline? {
    if (json.isNullOrBlank()) return null
    val stored = try {
        gson.fromJson(json, StoredCalibration::class.java)
    } catch (e: JsonParseException) {
        null
    } ?: return null
    val withMaxes = stored.gestureMax.orEmpty().entries.fold(CalibrationBaseline()) { baseline, (key, max) ->
        baseline.withGestureMax(key, max)
    }
    return withMaxes.copy(
        neutralOffsets = stored.neutralOffsets.orEmpty(),
        capturedAtMillis = stored.capturedAtMillis
    )
}
