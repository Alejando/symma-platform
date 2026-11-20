package com.symma.app.core.security

import android.content.SharedPreferences
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

sealed interface OfflinePinCheck {
    data object Accepted : OfflinePinCheck
    data class Rejected(val attemptsLeft: Int) : OfflinePinCheck
    data object LockedOut : OfflinePinCheck
}

/**
 * Lets the patient unlock with their access code when the phone has no screen lock. Only a salted
 * PBKDF2 hash is kept, in preferences encrypted with a Keystore key, and repeated failures discard
 * it so the next unlock requires signing in online.
 */
class OfflinePinVerifier(
    private val preferences: SharedPreferences,
    private val random: SecureRandom = SecureRandom()
) {

    fun hasPin(): Boolean = preferences.contains(KEY_HASH) && preferences.contains(KEY_SALT)

    fun remember(pin: String) {
        val salt = ByteArray(SALT_BYTES).also(random::nextBytes)
        preferences.edit()
            .putString(KEY_SALT, salt.toBase64())
            .putString(KEY_HASH, hash(pin, salt).toBase64())
            .putInt(KEY_FAILED_ATTEMPTS, 0)
            .commit()
    }

    fun check(pin: String): OfflinePinCheck {
        val salt = preferences.getString(KEY_SALT, null)?.fromBase64() ?: return OfflinePinCheck.LockedOut
        val expected = preferences.getString(KEY_HASH, null)?.fromBase64() ?: return OfflinePinCheck.LockedOut
        if (MessageDigest.isEqual(expected, hash(pin, salt))) {
            preferences.edit().putInt(KEY_FAILED_ATTEMPTS, 0).commit()
            return OfflinePinCheck.Accepted
        }
        val failedAttempts = preferences.getInt(KEY_FAILED_ATTEMPTS, 0) + 1
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            forget()
            return OfflinePinCheck.LockedOut
        }
        preferences.edit().putInt(KEY_FAILED_ATTEMPTS, failedAttempts).commit()
        return OfflinePinCheck.Rejected(attemptsLeft = MAX_FAILED_ATTEMPTS - failedAttempts)
    }

    fun forget() {
        preferences.edit().remove(KEY_SALT).remove(KEY_HASH).remove(KEY_FAILED_ATTEMPTS).commit()
    }

    private fun hash(pin: String, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(pin.toCharArray(), salt, ITERATIONS, HASH_BITS)
        return try {
            SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).encoded
        } finally {
            spec.clearPassword()
        }
    }

    private fun ByteArray.toBase64(): String = Base64.getEncoder().encodeToString(this)

    private fun String.fromBase64(): ByteArray = Base64.getDecoder().decode(this)

    companion object {
        const val MAX_FAILED_ATTEMPTS = 5
        private const val ALGORITHM = "PBKDF2WithHmacSHA256"
        private const val ITERATIONS = 100_000
        private const val HASH_BITS = 256
        private const val SALT_BYTES = 16
        private const val KEY_SALT = "offline_pin_salt"
        private const val KEY_HASH = "offline_pin_hash"
        private const val KEY_FAILED_ATTEMPTS = "offline_pin_failed_attempts"
    }
}
