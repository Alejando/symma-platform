package com.symma.app.domain.logic

import com.symma.app.domain.model.MobileModule
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.cos
import kotlin.math.sin

class FacialSymmetryTest {

    @Test
    fun `a mirror-symmetric smile scores 100`() {
        val face = SymmetricFace().build()

        assertEquals(100f, FacialSymmetry.percentFor(MobileModule.SMILE, face)!!, 0.01f)
    }

    @Test
    fun `a one-sided smile drops the score`() {
        val face = SymmetricFace(leftMouthCornerOffset = FacePoint(40f, -30f, 0f)).build()

        val score = FacialSymmetry.percentFor(MobileModule.SMILE, face)!!

        assertTrue("expected a clearly asymmetric score, got $score", score < 70f)
    }

    @Test
    fun `brow raise compares the brow to eyelid distance on each side`() {
        val symmetric = SymmetricFace().build()
        val oneBrowRaised = SymmetricFace(leftBrowLift = 30f).build()

        assertEquals(100f, FacialSymmetry.percentFor(MobileModule.BROWS, symmetric)!!, 0.01f)
        assertTrue(FacialSymmetry.percentFor(MobileModule.BROWS, oneBrowRaised)!! < 80f)
    }

    @Test
    fun `both eyes closed is symmetric even though the apertures are only tracking noise`() {
        val face = SymmetricFace(rightEyeAperture = 1f, leftEyeAperture = 2f).build()

        assertTrue(FacialSymmetry.percentFor(MobileModule.EYES, face)!! > 90f)
    }

    @Test
    fun `one eye closed and the other open is fully asymmetric`() {
        val face = SymmetricFace(rightEyeAperture = 0f, leftEyeAperture = 30f).build()

        assertEquals(0f, FacialSymmetry.percentFor(MobileModule.EYES, face)!!, 0.01f)
    }

    @Test
    fun `eyes wide uses the same eyelid aperture comparison`() {
        val face = SymmetricFace(rightEyeAperture = 30f, leftEyeAperture = 24f).build()

        assertEquals(80f, FacialSymmetry.percentFor(MobileModule.EYES_INVERSE, face)!!, 0.01f)
    }

    @Test
    fun `turning a symmetric face does not read as asymmetry because depth is included`() {
        val turned = SymmetricFace().build().map { it.rotatedAroundVerticalAxis(degrees = 20f) }

        assertEquals(100f, FacialSymmetry.percentFor(MobileModule.SMILE, turned)!!, 0.01f)
        assertEquals(100f, FacialSymmetry.percentFor(MobileModule.BROWS, turned)!!, 0.01f)
    }

    @Test
    fun `normalized landmarks of a non-square frame are scaled to an isotropic space`() {
        val pixelFace = SymmetricFace(leftMouthCornerOffset = FacePoint(10f, -15f, 0f)).build()
        val width = 640
        val height = 480
        val normalized = pixelFace.map { NormalizedPoint(it.x / width, it.y / height, it.z / width) }

        val fromNormalized = FacialSymmetry.percentFor(
            MobileModule.SMILE,
            normalized.map { facePointFromNormalized(it.x, it.y, it.z, width, height) }
        )

        assertEquals(FacialSymmetry.percentFor(MobileModule.SMILE, pixelFace)!!, fromNormalized!!, 0.01f)
    }

    @Test
    fun `missing landmarks or a module without bilateral movement yield no score`() {
        assertNull(FacialSymmetry.percentFor(MobileModule.SMILE, emptyList()))
        assertNull(FacialSymmetry.percentFor(MobileModule.SMILE, SymmetricFace().build().take(200)))
        assertNull(FacialSymmetry.percentFor(MobileModule.UNKNOWN, SymmetricFace().build()))
    }

    private data class NormalizedPoint(val x: Float, val y: Float, val z: Float)

    private fun FacePoint.rotatedAroundVerticalAxis(degrees: Float): FacePoint {
        val radians = Math.toRadians(degrees.toDouble())
        val centeredX = x - CENTER_X
        return FacePoint(
            x = (centeredX * cos(radians) + z * sin(radians)).toFloat() + CENTER_X,
            y = y,
            z = (-centeredX * sin(radians) + z * cos(radians)).toFloat()
        )
    }

    /** A face mesh in pixels, mirror-symmetric about x = CENTER_X unless an offset says otherwise. */
    private class SymmetricFace(
        val leftMouthCornerOffset: FacePoint = FacePoint(0f, 0f, 0f),
        val leftBrowLift: Float = 0f,
        val rightEyeAperture: Float = 20f,
        val leftEyeAperture: Float = 20f
    ) {
        fun build(): List<FacePoint> {
            val face = MutableList(MESH_SIZE) { FacePoint(CENTER_X, 300f, 0f) }
            face[0] = FacePoint(CENTER_X, 400f, -20f)
            face[61] = FacePoint(CENTER_X - 60f, 420f, 10f)
            face[291] = FacePoint(
                CENTER_X + 60f + leftMouthCornerOffset.x,
                420f + leftMouthCornerOffset.y,
                10f + leftMouthCornerOffset.z
            )
            face[33] = FacePoint(CENTER_X - 110f, 250f, 20f)
            face[263] = FacePoint(CENTER_X + 110f, 250f, 20f)
            face[159] = FacePoint(CENTER_X - 70f, 240f, 0f)
            face[386] = FacePoint(CENTER_X + 70f, 240f, 0f)
            face[145] = FacePoint(CENTER_X - 70f, 240f + rightEyeAperture, 0f)
            face[374] = FacePoint(CENTER_X + 70f, 240f + leftEyeAperture, 0f)
            face[105] = FacePoint(CENTER_X - 75f, 200f, -5f)
            face[334] = FacePoint(CENTER_X + 75f, 200f - leftBrowLift, -5f)
            return face
        }
    }

    private companion object {
        const val MESH_SIZE = 478
        const val CENTER_X = 320f
    }
}
