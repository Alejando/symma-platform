package com.symma.app.data.local.snapshot

import com.symma.app.domain.repository.LocalSnapshotStore
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

interface SnapshotFileCipher {
    fun write(file: File, bytes: ByteArray)
    fun read(file: File): ByteArray
}

/** References are bare file names inside [directory], so a stored reference can never point elsewhere. */
class EncryptedSnapshotStore(
    private val directory: File,
    private val cipher: SnapshotFileCipher,
    private val ioDispatcher: CoroutineDispatcher
) : LocalSnapshotStore {

    override suspend fun save(jpeg: ByteArray): String = withContext(ioDispatcher) {
        directory.mkdirs()
        val reference = "${UUID.randomUUID()}$FILE_SUFFIX"
        cipher.write(File(directory, reference), jpeg)
        reference
    }

    override suspend fun read(reference: String): ByteArray? = withContext(ioDispatcher) {
        fileFor(reference)?.takeIf { it.exists() }?.let(cipher::read)
    }

    override suspend fun delete(reference: String) {
        withContext(ioDispatcher) { fileFor(reference)?.delete() }
    }

    override suspend fun deleteUnreferencedOlderThan(referenced: Set<String>, cutoffMillis: Long) {
        withContext(ioDispatcher) {
            directory.listFiles().orEmpty()
                .filter { file -> file.name !in referenced && file.lastModified() < cutoffMillis }
                .forEach { file -> file.delete() }
        }
    }

    private fun fileFor(reference: String): File? =
        File(directory, reference).takeIf { file -> file.parentFile == directory && file.name == reference }

    private companion object {
        const val FILE_SUFFIX = ".jpg.enc"
    }
}
