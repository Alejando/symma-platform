package com.symma.app.domain.model

data class CalibrationBaseline(
    val mouthOpenMax: Float = 0.5f,
    val mouthSmileMax: Float = 0.5f,
    val browRaiseMax: Float = 0.5f,
    val duckFaceMax: Float = 0.5f,
    val eyesClosedMax: Float = 0.5f,
    val eyesOpenMin: Float = 0.1f
)
