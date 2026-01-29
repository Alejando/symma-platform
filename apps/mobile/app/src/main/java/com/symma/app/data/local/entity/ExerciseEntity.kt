package com.symma.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "exercises")
data class ExerciseEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val keyName: String,
    val description: String?,
    val type: String,
    val category: String,
    val assetAnimationUrl: String?,
    val assetTutorialVideoUrl: String?
)
