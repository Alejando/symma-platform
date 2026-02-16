package com.symma.app.domain.model

data class Exercise(
    val id: String,
    val name: String,
    val keyName: String,
    val description: String?,
    val type: String,
    val category: String,
    val mobileModule: String? = null,
    val assetAnimationUrl: String?,
    val assetTutorialVideoUrl: String?
)
