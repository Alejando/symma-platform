package com.symma.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import androidx.test.core.app.ApplicationProvider
import com.symma.app.data.local.calibration.LegacyCalibrationPreferences
import com.symma.app.data.local.calibration.calibrationFromStoredJson
import com.symma.app.data.local.calibration.toStoredJson
import com.symma.app.domain.model.CalibrationBaseline
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** The Keystore is not available on the JVM; the encrypted store is stood in for by plain preferences. */
@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class CalibrationRepositoryImplTest {

    private val context = ApplicationProvider.getApplicationContext<Context>()
    private lateinit var encryptedStore: SharedPreferences
    private lateinit var legacyStore: SharedPreferences

    @Before
    fun setUp() {
        encryptedStore = context.getSharedPreferences("encrypted-standin", Context.MODE_PRIVATE).apply { edit().clear().commit() }
        legacyStore = context.getSharedPreferences("symma_prefs", Context.MODE_PRIVATE).apply { edit().clear().commit() }
    }

    private fun repository(legacyModifiedAt: Long? = LEGACY_MODIFIED_AT) =
        CalibrationRepositoryImpl(encryptedStore, LegacyCalibrationPreferences(legacyStore, legacyModifiedAt))

    private fun writeLegacyCalibration() {
        legacyStore.edit()
            .putFloat("calibration_mouth_smile_max", 0.61f)
            .putFloat("calibration_brow_raise_max", 0.32f)
            .putFloat("calibration_eyes_wide_max", 0.27f)
            .putString("calibration_neutral_offsets", """{"smile":0.04,"browRaise":0.02}""")
            .commit()
    }

    @Test
    fun `a plaintext calibration from an earlier version moves to the encrypted store`() {
        writeLegacyCalibration()

        val baseline = repository().getBaseline()!!

        assertEquals(0.61f, baseline.mouthSmileMax, 0.0001f)
        assertEquals(0.32f, baseline.browRaiseMax, 0.0001f)
        assertEquals(0.27f, baseline.eyesWideMax, 0.0001f)
        assertEquals(mapOf("smile" to 0.04f, "browRaise" to 0.02f), baseline.neutralOffsets)
        assertEquals(LEGACY_MODIFIED_AT, baseline.capturedAtMillis)
        assertEquals(baseline, calibrationFromStoredJson(encryptedStore.getString("calibration_baseline", null)))
    }

    @Test
    fun `no calibration value remains in plaintext after the move`() {
        writeLegacyCalibration()

        repository()

        assertFalse(legacyStore.all.keys.any { it.startsWith("calibration_") })
    }

    @Test
    fun `an encrypted calibration is never overwritten by a stale plaintext copy`() {
        val current = CalibrationBaseline(mouthSmileMax = 0.9f, capturedAtMillis = 5L)
        encryptedStore.edit().putString("calibration_baseline", current.toStoredJson()).commit()
        writeLegacyCalibration()

        val baseline = repository().getBaseline()

        assertEquals(current, baseline)
        assertFalse(legacyStore.contains("calibration_mouth_smile_max"))
    }

    @Test
    fun `a saved calibration is read back by a new repository`() = runBlocking {
        val saved = CalibrationBaseline(
            mouthOpenMax = 0.7f,
            eyesClosedMax = 0.66f,
            neutralOffsets = mapOf("jawOpen" to 0.03f),
            capturedAtMillis = 1_700_000_000_000L
        )
        repository().saveBaseline(saved)

        assertEquals(saved, repository().getBaseline())
    }

    @Test
    fun `a patient who never calibrated has no calibration`() {
        assertNull(repository().getBaseline())
    }

    private companion object {
        const val LEGACY_MODIFIED_AT = 1_699_000_000_000L
    }
}
