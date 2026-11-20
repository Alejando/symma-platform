package com.symma.app.core.database

import android.content.SharedPreferences
import java.security.SecureRandom

/** Holds the SQLCipher passphrase; the preferences behind it are encrypted with a Keystore key. */
class DatabasePassphraseStore(
    private val preferences: SharedPreferences,
    private val random: SecureRandom = SecureRandom()
) {

    fun getOrCreate(): String {
        preferences.getString(KEY_PASSPHRASE, null)?.let { return it }
        val passphrase = ByteArray(PASSPHRASE_BYTES).also(random::nextBytes).toHex()
        check(preferences.edit().putString(KEY_PASSPHRASE, passphrase).commit()) { "Could not store the database passphrase" }
        return passphrase
    }

    private fun ByteArray.toHex(): String = joinToString(separator = "") { byte -> "%02x".format(byte) }

    private companion object {
        const val KEY_PASSPHRASE = "database_passphrase"
        const val PASSPHRASE_BYTES = 32
    }
}
