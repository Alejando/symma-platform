package com.symma.app.domain.repository

/** Best-attempt images waiting to be uploaded, kept encrypted on the device. */
interface LocalSnapshotStore {
    suspend fun save(jpeg: ByteArray): String
    suspend fun read(reference: String): ByteArray?
    suspend fun delete(reference: String)
    suspend fun deleteUnreferencedOlderThan(referenced: Set<String>, cutoffMillis: Long)
}
