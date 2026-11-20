package com.symma.app.data.local.snapshot

import android.content.Context
import androidx.security.crypto.EncryptedFile
import androidx.security.crypto.MasterKey
import java.io.File

class KeystoreSnapshotFileCipher(private val context: Context) : SnapshotFileCipher {

    private val masterKey by lazy {
        MasterKey.Builder(context, KEY_ALIAS).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
    }

    override fun write(file: File, bytes: ByteArray) {
        encrypted(file).openFileOutput().use { output -> output.write(bytes) }
    }

    override fun read(file: File): ByteArray = encrypted(file).openFileInput().use { input -> input.readBytes() }

    private fun encrypted(file: File) =
        EncryptedFile.Builder(context, file, masterKey, EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB).build()

    private companion object {
        const val KEY_ALIAS = "symma_snapshot_key"
    }
}
