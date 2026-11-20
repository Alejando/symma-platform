package com.symma.app.core.database

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File
import java.io.IOException

class PlaintextDatabaseMigrationTest {

    @get:Rule
    val folder = TemporaryFolder()

    private val databaseFile by lazy { File(folder.root, "symma_db") }
    private val exports = mutableListOf<Pair<File, String>>()

    private val fakeExporter = EncryptedCopyExporter { plaintext, destination, passphrase ->
        exports += plaintext to passphrase
        destination.writeBytes(ENCRYPTED_CONTENT)
    }

    private fun writePlaintextDatabase() {
        databaseFile.writeBytes(PLAINTEXT_HEADER + "pending sessions".toByteArray())
        File(databaseFile.path + "-wal").writeText("wal")
        File(databaseFile.path + "-shm").writeText("shm")
    }

    @Test
    fun `a plaintext database is replaced by its encrypted copy along with its journal files`() {
        writePlaintextDatabase()

        val encrypted = PlaintextDatabaseMigration(databaseFile, fakeExporter).encryptIfPlaintext("secret")

        assertTrue(encrypted)
        assertEquals(listOf(databaseFile to "secret"), exports)
        assertArrayEquals(ENCRYPTED_CONTENT, databaseFile.readBytes())
        assertFalse(File(databaseFile.path + "-wal").exists())
        assertFalse(File(databaseFile.path + "-shm").exists())
        assertEquals(listOf("symma_db"), folder.root.list()!!.toList())
    }

    @Test
    fun `an already encrypted database is left alone`() {
        databaseFile.writeBytes(ENCRYPTED_CONTENT)

        val encrypted = PlaintextDatabaseMigration(databaseFile, fakeExporter).encryptIfPlaintext("secret")

        assertTrue(encrypted)
        assertTrue(exports.isEmpty())
        assertArrayEquals(ENCRYPTED_CONTENT, databaseFile.readBytes())
    }

    @Test
    fun `a fresh install has nothing to encrypt`() {
        assertTrue(PlaintextDatabaseMigration(databaseFile, fakeExporter).encryptIfPlaintext("secret"))
        assertTrue(exports.isEmpty())
    }

    @Test
    fun `a failed export keeps the plaintext database intact`() {
        writePlaintextDatabase()
        val original = databaseFile.readBytes()
        val failingExporter = EncryptedCopyExporter { _, destination, _ ->
            destination.writeText("half")
            throw IOException("disk full")
        }

        runCatching { PlaintextDatabaseMigration(databaseFile, failingExporter).encryptIfPlaintext("secret") }

        assertArrayEquals(original, databaseFile.readBytes())
        assertTrue(PlaintextDatabaseMigration.isPlaintextSqlite(databaseFile))
    }

    @Test
    fun `a half-written copy left by an interrupted export is discarded and redone`() {
        writePlaintextDatabase()
        File(databaseFile.path + ".encrypting").writeText("half")

        PlaintextDatabaseMigration(databaseFile, fakeExporter).encryptIfPlaintext("secret")

        assertEquals(1, exports.size)
        assertArrayEquals(ENCRYPTED_CONTENT, databaseFile.readBytes())
        assertFalse(File(databaseFile.path + ".encrypting").exists())
    }

    @Test
    fun `a finished copy whose swap was interrupted is swapped in without exporting again`() {
        writePlaintextDatabase()
        File(databaseFile.path + ".encrypted").writeBytes(ENCRYPTED_CONTENT)

        val encrypted = PlaintextDatabaseMigration(databaseFile, fakeExporter).encryptIfPlaintext("secret")

        assertTrue(encrypted)
        assertTrue(exports.isEmpty())
        assertArrayEquals(ENCRYPTED_CONTENT, databaseFile.readBytes())
        assertFalse(File(databaseFile.path + ".encrypted").exists())
    }

    @Test
    fun `the plaintext check reads the SQLite file header`() {
        databaseFile.writeBytes(PLAINTEXT_HEADER)
        assertTrue(PlaintextDatabaseMigration.isPlaintextSqlite(databaseFile))

        databaseFile.writeBytes(ENCRYPTED_CONTENT)
        assertFalse(PlaintextDatabaseMigration.isPlaintextSqlite(databaseFile))

        databaseFile.writeBytes(ByteArray(0))
        assertFalse(PlaintextDatabaseMigration.isPlaintextSqlite(databaseFile))
    }

    private companion object {
        val PLAINTEXT_HEADER = "SQLite format 3\u0000".toByteArray(Charsets.US_ASCII)
        val ENCRYPTED_CONTENT = ByteArray(64) { index -> (index * 37 + 11).toByte() }
    }
}
