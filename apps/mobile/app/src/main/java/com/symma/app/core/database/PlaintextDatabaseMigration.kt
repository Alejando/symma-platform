package com.symma.app.core.database

import java.io.File
import java.io.IOException

fun interface EncryptedCopyExporter {
    fun export(plaintextDatabase: File, encryptedDestination: File, passphrase: String)
}

/**
 * Replaces a plaintext database from an earlier version with an encrypted copy. The copy is
 * written next to the original and only swapped in once complete, so an interruption at any point
 * leaves either the original or a finished copy and no pending session is lost.
 */
class PlaintextDatabaseMigration(
    private val databaseFile: File,
    private val exporter: EncryptedCopyExporter
) {
    private val partialCopy = File(databaseFile.path + PARTIAL_SUFFIX)
    private val finishedCopy = File(databaseFile.path + FINISHED_SUFFIX)

    /** Returns false when the database is still plaintext and must be opened without encryption. */
    fun encryptIfPlaintext(passphrase: String): Boolean {
        if (finishedCopy.exists()) return swapInFinishedCopy()
        if (!databaseFile.exists() || !isPlaintextSqlite(databaseFile)) return true

        partialCopy.delete()
        exporter.export(databaseFile, partialCopy, passphrase)
        if (!partialCopy.renameTo(finishedCopy)) throw IOException("Could not finish the encrypted copy of ${databaseFile.name}")
        return swapInFinishedCopy()
    }

    private fun swapInFinishedCopy(): Boolean {
        DATABASE_FILE_SUFFIXES.forEach { suffix -> File(databaseFile.path + suffix).delete() }
        if (!finishedCopy.renameTo(databaseFile)) throw IOException("Could not replace ${databaseFile.name} with its encrypted copy")
        return true
    }

    companion object {
        private const val PARTIAL_SUFFIX = ".encrypting"
        private const val FINISHED_SUFFIX = ".encrypted"
        private val DATABASE_FILE_SUFFIXES = listOf("", "-wal", "-shm", "-journal")
        private val SQLITE_HEADER = "SQLite format 3\u0000".toByteArray(Charsets.US_ASCII)

        fun isPlaintextSqlite(file: File): Boolean {
            if (file.length() < SQLITE_HEADER.size) return false
            val header = ByteArray(SQLITE_HEADER.size)
            file.inputStream().use { input -> if (input.read(header) != header.size) return false }
            return header.contentEquals(SQLITE_HEADER)
        }
    }
}
