package com.symma.app.presentation.player

import android.graphics.Bitmap
import android.util.Log
import com.symma.app.core.di.IoDispatcher
import com.symma.app.domain.repository.LocalSnapshotStore
import com.symma.app.presentation.components.camera.FrameEncoder
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import javax.inject.Inject

class BestAttemptSnapshots @Inject constructor(
    private val store: LocalSnapshotStore,
    private val encoder: FrameEncoder,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) {

    /** A snapshot that cannot be stored is simply missing from the session; it never affects the exercise data. */
    suspend fun persist(frame: Bitmap): String? =
        try {
            withContext(ioDispatcher) { encoder.encode(frame) }?.let { jpeg -> store.save(jpeg) }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TAG, "Best attempt snapshot not stored: ${e.message}")
            null
        }

    private companion object {
        const val TAG = "BestAttemptSnapshots"
    }
}
