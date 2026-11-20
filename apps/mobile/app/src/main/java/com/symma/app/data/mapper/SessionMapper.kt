package com.symma.app.data.mapper

import com.google.gson.Gson
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.data.remote.dto.session.CreateSessionRequest
import com.symma.app.data.local.calibration.calibrationFromStoredJson
import com.symma.app.data.remote.dto.session.CalibrationRequest
import com.symma.app.data.remote.dto.session.SessionItemRequest
import com.symma.app.domain.model.CalibrationBaseline
import com.symma.app.domain.model.ExerciseResult
import com.symma.app.domain.logic.isValidPercent
import com.symma.app.domain.model.Session
import com.symma.app.domain.model.SessionItem
import com.symma.app.domain.model.SyncStatus
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID

private val gson = Gson()
private val iso8601Format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
    timeZone = TimeZone.getTimeZone("UTC")
}

fun ExerciseResult.toEntity(sessionId: String): SessionItemEntity {
    return SessionItemEntity(
        id = UUID.randomUUID().toString(),
        sessionId = sessionId,
        exerciseId = exerciseId,
        repsCompleted = repsCompleted,
        averageAccuracy = averageAccuracy,
        symmetryScore = symmetryScore,
        averageHoldSeconds = averageHoldSeconds,
        snapshotReference = snapshotReference
    )
}

fun SessionEntity.toCreateRequest(items: List<SessionItemEntity>): CreateSessionRequest {
    return CreateSessionRequest(
        id = id,
        routineId = routineId,
        startTime = iso8601Format.format(Date(startTime)),
        endTime = iso8601Format.format(Date(endTime)),
        calibration = calibrationFromStoredJson(calibrationJson)?.toCalibrationRequest(),
        items = items.map { it.toSessionItemRequest() }
    )
}

/** A calibration without a capture time cannot be placed in the patient's history, so it is not sent. */
fun CalibrationBaseline.toCalibrationRequest(): CalibrationRequest? {
    val capturedAt = capturedAtMillis ?: return null
    val gestureMaxValues = CalibrationBaseline.GESTURE_KEYS.mapNotNull { key ->
        gestureMax(key)?.let { max -> "${key}Max" to max }
    }
    val neutralOffsetValues = neutralOffsets.map { (key, offset) -> "${key}NeutralOffset" to offset }
    val values = (gestureMaxValues + neutralOffsetValues).filter { (_, value) -> value.isFinite() }.toMap()
    return CalibrationRequest(capturedAt = iso8601Format.format(Date(capturedAt)), values = values)
}

fun SessionItemEntity.toSessionItemRequest(): SessionItemRequest {
    return SessionItemRequest(
        exerciseId = exerciseId,
        repsCompleted = repsCompleted,
        averageAccuracy = averageAccuracy?.takeIf { it.isValidPercent() },
        symmetryScore = symmetryScore?.takeIf { it.isValidPercent() },
        averageHoldSeconds = averageHoldSeconds?.takeIf { it.isFinite() && it >= 0f },
        snapshotKey = snapshotKey,
        seriesData = seriesData?.let { gson.fromJson(it, Any::class.java) }
    )
}

fun SessionEntity.toDomain(items: List<SessionItemEntity>): Session {
    return Session(
        id = id,
        routineId = routineId,
        startTime = startTime,
        endTime = endTime,
        durationSeconds = durationSeconds,
        score = score,
        syncStatus = SyncStatus.valueOf(syncStatus),
        items = items.map { it.toDomain() }
    )
}

fun SessionItemEntity.toDomain(): SessionItem {
    return SessionItem(
        id = id,
        exerciseId = exerciseId,
        repsCompleted = repsCompleted,
        averageAccuracy = averageAccuracy
    )
}
