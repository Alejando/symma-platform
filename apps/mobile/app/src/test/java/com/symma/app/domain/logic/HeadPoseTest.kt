package com.symma.app.domain.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class HeadPoseTest {

    @Test
    fun `identity matrix is a frontal pose`() {
        val pose = HeadPose.fromTransformationMatrix(HeadRotationMatrices.rotation())!!

        assertEquals(0f, pose.yawDegrees, 0.01f)
        assertEquals(0f, pose.pitchDegrees, 0.01f)
    }

    @Test
    fun `yaw rotation is recovered in degrees`() {
        val pose = HeadPose.fromTransformationMatrix(HeadRotationMatrices.rotation(yawDegrees = 15f))!!

        assertEquals(15f, pose.yawDegrees, 0.01f)
        assertEquals(0f, pose.pitchDegrees, 0.01f)
    }

    @Test
    fun `pitch rotation is recovered in degrees`() {
        val pose = HeadPose.fromTransformationMatrix(HeadRotationMatrices.rotation(pitchDegrees = -12f))!!

        assertEquals(0f, pose.yawDegrees, 0.01f)
        assertEquals(-12f, pose.pitchDegrees, 0.01f)
    }

    @Test
    fun `scale in the matrix does not change the angles`() {
        val pose = HeadPose.fromTransformationMatrix(HeadRotationMatrices.rotation(yawDegrees = 8f, pitchDegrees = 5f, scale = 3f))!!

        assertEquals(8f, pose.yawDegrees, 0.01f)
        assertEquals(5f, pose.pitchDegrees, 0.01f)
    }

    @Test
    fun `yaw or pitch above ten degrees from the camera axis counts as turned away`() {
        assertTrue(HeadPose(yawDegrees = 10.5f, pitchDegrees = 0f).isTurnedAwayFromCamera())
        assertTrue(HeadPose(yawDegrees = -12f, pitchDegrees = 0f).isTurnedAwayFromCamera())
        assertTrue(HeadPose(yawDegrees = 0f, pitchDegrees = 11f).isTurnedAwayFromCamera())
        assertTrue(HeadPose(yawDegrees = 0f, pitchDegrees = -11f).isTurnedAwayFromCamera())
    }

    @Test
    fun `pose within ten degrees of the camera axis faces the camera`() {
        assertFalse(HeadPose(yawDegrees = 0f, pitchDegrees = 0f).isTurnedAwayFromCamera())
        assertFalse(HeadPose(yawDegrees = 10f, pitchDegrees = -10f).isTurnedAwayFromCamera())
        assertFalse(HeadPose(yawDegrees = -9.5f, pitchDegrees = 9.5f).isTurnedAwayFromCamera())
    }

    @Test
    fun `incomplete matrix yields no pose`() {
        assertNull(HeadPose.fromTransformationMatrix(FloatArray(9)))
    }
}
