package com.symma.app.core.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.io.File
import java.security.KeyStore

/**
 * Preferences encrypted with an AES-256 key held in the Android Keystore. Each file gets its own
 * key alias so that resetting one (for example the token store after Keystore corruption) never
 * makes another unreadable.
 */
object EncryptedPreferences {

    private const val ANDROID_KEYSTORE = "AndroidKeyStore"

    fun open(context: Context, fileName: String, keyAlias: String): SharedPreferences {
        val masterKey = MasterKey.Builder(context, keyAlias)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            context,
            fileName,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun delete(context: Context, fileName: String, keyAlias: String) {
        context.deleteSharedPreferences(fileName)
        File(context.filesDir.parentFile, "shared_prefs/$fileName.xml").delete()
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        if (keyStore.containsAlias(keyAlias)) keyStore.deleteEntry(keyAlias)
    }
}
