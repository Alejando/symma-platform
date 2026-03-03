package com.symma.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "session_items",
    foreignKeys = [
        ForeignKey(
            entity = SessionEntity::class,
            parentColumns = ["id"],
            childColumns = ["session_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["session_id"])]
)
data class SessionItemEntity(
    @PrimaryKey
    @ColumnInfo(name = "id")
    val id: String,

    @ColumnInfo(name = "session_id")
    val sessionId: String,

    @ColumnInfo(name = "exercise_id")
    val exerciseId: String,

    @ColumnInfo(name = "reps_completed")
    val repsCompleted: Int,

    @ColumnInfo(name = "average_accuracy")
    val averageAccuracy: Float? = null,

    @ColumnInfo(name = "series_data")
    val seriesData: String? = null
)
