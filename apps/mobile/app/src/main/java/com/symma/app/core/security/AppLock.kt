package com.symma.app.core.security

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Whether the signed-in patient must prove who they are before seeing clinical data: on every app
 * start, and again after the app spent [RELOCK_AFTER_BACKGROUND_MS] in the background.
 */
@Singleton
class AppLock @Inject constructor(
    private val tokenManager: TokenManager
) {
    private val _isLocked = MutableStateFlow(tokenManager.hasToken())
    val isLocked: StateFlow<Boolean> = _isLocked.asStateFlow()

    private var backgroundedAtMs: Long? = null

    fun onAppBackgrounded(nowMs: Long) {
        backgroundedAtMs = nowMs
    }

    fun onAppForegrounded(nowMs: Long) {
        val backgroundedFor = backgroundedAtMs?.let { nowMs - it } ?: return
        backgroundedAtMs = null
        if (backgroundedFor >= RELOCK_AFTER_BACKGROUND_MS && tokenManager.hasToken()) {
            _isLocked.value = true
        }
    }

    fun unlock() {
        _isLocked.value = false
    }

    companion object {
        const val RELOCK_AFTER_BACKGROUND_MS = 5 * 60 * 1000L
    }
}
