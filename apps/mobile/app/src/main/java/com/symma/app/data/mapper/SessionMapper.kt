package com.symma.app.data.mapper

import com.google.gson.Gson
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import com.symma.app.data.remote.dto.session.CreateSessionRequest
import com.symma.app.data.remote.dto.session.SessionItemRequest
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

fun SessionItemRequest.toEntity(sessionId: String): SessionItemEntity {
    return SessionItemEntity(
        id = UUID.randomUUID().toString(),
        sessionId = sessionId,
        exerciseId = exerciseId,
        repsCompleted = repsCompleted,
        averageAccuracy = averageAccuracy,
        seriesData = seriesData?.let { gson.toJson(it) }
    )
}

fun SessionEntity.toCreateRequest(items: List<SessionItemEntity>): CreateSessionRequest {
    return CreateSessionRequest(
        id = id,
        routineId = routineId,
        startTime = iso8601Format.format(Date(startTime)),
        endTime = iso8601Format.format(Date(endTime)),
        items = items.map { it.toSessionItemRequest() }
    )
}

fun SessionItemEntity.toSessionItemRequest(): SessionItemRequest {
    return SessionItemRequest(
        exerciseId = exerciseId,
        repsCompleted = repsCompleted,
        averageAccuracy = averageAccuracy,
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
