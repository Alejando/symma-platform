package com.symma.app.core.database

import net.zetetic.database.sqlcipher.SQLiteDatabase
import java.io.File

/** Copies a plaintext SQLite database into a new SQLCipher database, keeping Room's schema version. */
object SqlCipherExporter : EncryptedCopyExporter {

    override fun export(plaintextDatabase: File, encryptedDestination: File, passphrase: String) {
        val plaintext = SQLiteDatabase.openDatabase(plaintextDatabase.path, null, SQLiteDatabase.OPEN_READWRITE)
        try {
            val schemaVersion = plaintext.version
            plaintext.execSQL("ATTACH DATABASE ? AS encrypted KEY ?", arrayOf(encryptedDestination.path, passphrase))
            plaintext.rawExecSQL("SELECT sqlcipher_export('encrypted')")
            plaintext.execSQL("PRAGMA encrypted.user_version = $schemaVersion")
            plaintext.execSQL("DETACH DATABASE encrypted")
        } finally {
            plaintext.close()
        }
    }
}
