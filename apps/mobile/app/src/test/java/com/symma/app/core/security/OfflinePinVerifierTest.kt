package com.symma.app.core.security

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class OfflinePinVerifierTest {

    private val preferences = ApplicationProvider.getApplicationContext<Context>()
        .getSharedPreferences("offline-auth-standin", Context.MODE_PRIVATE)
    private val verifier = OfflinePinVerifier(preferences)

    @Before
    fun setUp() {
        preferences.edit().clear().commit()
    }

    @Test
    fun `the remembered access code unlocks`() {
        verifier.remember("123456")

        assertEquals(OfflinePinCheck.Accepted, verifier.check("123456"))
    }

    @Test
    fun `the access code itself is never stored`() {
        verifier.remember("123456")

        assertFalse(preferences.all.values.any { value -> value.toString().contains("123456") })
    }

    @Test
    fun `a wrong code reports the attempts left`() {
        verifier.remember("123456")

        assertEquals(OfflinePinCheck.Rejected(attemptsLeft = 4), verifier.check("000000"))
        assertEquals(OfflinePinCheck.Rejected(attemptsLeft = 3), verifier.check("000000"))
    }

    @Test
    fun `the failure count survives an app restart`() {
        verifier.remember("123456")
        verifier.check("000000")

        assertEquals(OfflinePinCheck.Rejected(attemptsLeft = 3), OfflinePinVerifier(preferences).check("000000"))
    }

    @Test
    fun `five wrong codes discard the stored hash so only an online sign-in works`() {
        verifier.remember("123456")

        repeat(OfflinePinVerifier.MAX_FAILED_ATTEMPTS - 1) { verifier.check("000000") }
        val lastAttempt = verifier.check("000000")

        assertEquals(OfflinePinCheck.LockedOut, lastAttempt)
        assertFalse(verifier.hasPin())
        assertEquals(OfflinePinCheck.LockedOut, verifier.check("123456"))
    }

    @Test
    fun `a correct code resets the failure count`() {
        verifier.remember("123456")
        repeat(3) { verifier.check("000000") }

        verifier.check("123456")

        assertEquals(OfflinePinCheck.Rejected(attemptsLeft = 4), verifier.check("000000"))
    }

    @Test
    fun `nothing is remembered before the first online sign-in`() {
        assertFalse(verifier.hasPin())
        verifier.remember("123456")
        assertTrue(verifier.hasPin())
    }
}
