package com.symma.app.presentation.components.camera

import android.graphics.Bitmap
import android.graphics.Matrix
import java.io.ByteArrayOutputStream

fun interface FrameEncoder {
    fun encode(frame: Bitmap): ByteArray?
}

/**
 * Analysis frames are mirrored like the selfie preview; the clinical record shows the face as an
 * observer sees it, so the left side of the patient stays on the right of the image. Re-encoding
 * also drops any metadata.
 */
object UnmirroredJpegEncoder : FrameEncoder {

    private const val JPEG_QUALITY = 85

    override fun encode(frame: Bitmap): ByteArray? {
        if (frame.isRecycled) return null
        val unmirror = Matrix().apply { postScale(-1f, 1f, frame.width / 2f, frame.height / 2f) }
        val observerView = Bitmap.createBitmap(frame, 0, 0, frame.width, frame.height, unmirror, true)
        return ByteArrayOutputStream().use { output ->
            if (observerView.compress(Bitmap.CompressFormat.JPEG, JPEG_QUALITY, output)) output.toByteArray() else null
        }
    }
}
