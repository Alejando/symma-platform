package com.symma.app.core.security

import io.mockk.every
import io.mockk.mockk
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AppLockTest {

    private val tokenManager = mockk<TokenManager>()

    private fun appLock(signedIn: Boolean): AppLock {
        every { tokenManager.hasToken() } returns signedIn
        return AppLock(tokenManager)
    }

    @Test
    fun `opening the app with a stored session requires unlocking`() {
        assertTrue(appLock(signedIn = true).isLocked.value)
    }

    @Test
    fun `opening the app without a session goes straight to sign-in`() {
        assertFalse(appLock(signedIn = false).isLocked.value)
    }

    @Test
    fun `a short trip to the background does not lock again`() {
        val lock = appLock(signedIn = true).apply { unlock() }

        lock.onAppBackgrounded(nowMs = 0)
        lock.onAppForegrounded(nowMs = AppLock.RELOCK_AFTER_BACKGROUND_MS - 1)

        assertFalse(lock.isLocked.value)
    }

    @Test
    fun `returning after five minutes in the background locks again`() {
        val lock = appLock(signedIn = true).apply { unlock() }

        lock.onAppBackgrounded(nowMs = 0)
        lock.onAppForegrounded(nowMs = AppLock.RELOCK_AFTER_BACKGROUND_MS)

        assertTrue(lock.isLocked.value)
    }

    @Test
    fun `a signed-out app is never locked`() {
        val lock = appLock(signedIn = false)

        lock.onAppBackgrounded(nowMs = 0)
        lock.onAppForegrounded(nowMs = AppLock.RELOCK_AFTER_BACKGROUND_MS * 2)

        assertFalse(lock.isLocked.value)
    }
}
