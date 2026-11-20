package com.symma.app.data.local.snapshot

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class EncryptedSnapshotStoreTest {

    @get:Rule
    val folder = TemporaryFolder()

    /** Stands in for the Keystore cipher, which only exists on a device. */
    private val xorCipher = object : SnapshotFileCipher {
        override fun write(file: File, bytes: ByteArray) = file.writeBytes(bytes.map { (it.toInt() xor 0x5A).toByte() }.toByteArray())
        override fun read(file: File): ByteArray = file.readBytes().map { (it.toInt() xor 0x5A).toByte() }.toByteArray()
    }

    private val directory by lazy { File(folder.root, "snapshots") }
    private val store by lazy { EncryptedSnapshotStore(directory, xorCipher, Dispatchers.Unconfined) }
    private val jpeg = byteArrayOf(0xFF.toByte(), 0xD8.toByte(), 1, 2, 3, 0xFF.toByte(), 0xD9.toByte())

    @Test
    fun `a saved snapshot is written through the cipher and read back`() = runBlocking {
        val reference = store.save(jpeg)

        assertFalse(File(directory, reference).readBytes().contentEquals(jpeg))
        assertArrayEquals(jpeg, store.read(reference))
    }

    @Test
    fun `references are plain file names inside the snapshot directory`() = runBlocking {
        val reference = store.save(jpeg)

        assertEquals(reference, File(reference).name)
        assertNull(store.read("../secure_database.xml"))
    }

    @Test
    fun `deleting a snapshot removes its file`() = runBlocking {
        val reference = store.save(jpeg)

        store.delete(reference)

        assertNull(store.read(reference))
        assertTrue(directory.listFiles().orEmpty().isEmpty())
    }

    @Test
    fun `only old snapshots no session refers to are purged`() = runBlocking {
        val referencedOld = store.save(jpeg)
        val orphanOld = store.save(jpeg)
        val orphanRecent = store.save(jpeg)
        File(directory, referencedOld).setLastModified(1_000)
        File(directory, orphanOld).setLastModified(1_000)
        File(directory, orphanRecent).setLastModified(10_000)

        store.deleteUnreferencedOlderThan(referenced = setOf(referencedOld), cutoffMillis = 5_000)

        assertEquals(setOf(referencedOld, orphanRecent), directory.list()!!.toSet())
    }
}
