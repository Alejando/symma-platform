package com.symma.app.core.di

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.biometric.BiometricManager
import com.symma.app.core.security.DeviceUnlockAvailability
import com.symma.app.core.security.EncryptedPreferences
import com.symma.app.core.security.OfflinePinVerifier
import com.symma.app.core.security.deviceUnlockAvailability
import com.symma.app.data.local.calibration.LegacyCalibrationPreferences
import com.symma.app.data.local.snapshot.EncryptedSnapshotStore
import com.symma.app.data.local.snapshot.KeystoreSnapshotFileCipher
import com.symma.app.domain.repository.LocalSnapshotStore
import com.symma.app.presentation.components.camera.FrameEncoder
import com.symma.app.presentation.components.camera.UnmirroredJpegEncoder
import kotlinx.coroutines.CoroutineDispatcher
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import java.io.File
import javax.inject.Qualifier
import javax.inject.Singleton

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class EncryptedCalibrationPreferences

private const val TAG = "SecurityModule"
private const val CALIBRATION_PREFERENCES_FILE = "secure_calibration"
private const val CALIBRATION_KEY_ALIAS = "symma_calibration_key"
private const val LEGACY_PREFERENCES_FILE = "symma_prefs"
private const val OFFLINE_AUTH_PREFERENCES_FILE = "secure_offline_auth"
private const val OFFLINE_AUTH_KEY_ALIAS = "symma_offline_auth_key"
private const val SNAPSHOT_DIRECTORY = "snapshots"

@Module
@InstallIn(SingletonComponent::class)
object SecurityModule {

    /** A calibration can be repeated by the patient, so an unreadable store is reset instead of blocking the app. */
    @Provides
    @Singleton
    @EncryptedCalibrationPreferences
    fun provideEncryptedCalibrationPreferences(app: Application): SharedPreferences =
        try {
            EncryptedPreferences.open(app, CALIBRATION_PREFERENCES_FILE, CALIBRATION_KEY_ALIAS)
        } catch (e: Exception) {
            Log.e(TAG, "Encrypted calibration store unreadable, resetting it", e)
            EncryptedPreferences.delete(app, CALIBRATION_PREFERENCES_FILE, CALIBRATION_KEY_ALIAS)
            EncryptedPreferences.open(app, CALIBRATION_PREFERENCES_FILE, CALIBRATION_KEY_ALIAS)
        }

    /** Losing the stored hash only means the patient signs in online once more. */
    @Provides
    @Singleton
    fun provideOfflinePinVerifier(app: Application): OfflinePinVerifier {
        val preferences = try {
            EncryptedPreferences.open(app, OFFLINE_AUTH_PREFERENCES_FILE, OFFLINE_AUTH_KEY_ALIAS)
        } catch (e: Exception) {
            Log.e(TAG, "Offline unlock store unreadable, resetting it", e)
            EncryptedPreferences.delete(app, OFFLINE_AUTH_PREFERENCES_FILE, OFFLINE_AUTH_KEY_ALIAS)
            EncryptedPreferences.open(app, OFFLINE_AUTH_PREFERENCES_FILE, OFFLINE_AUTH_KEY_ALIAS)
        }
        return OfflinePinVerifier(preferences)
    }

    @Provides
    fun provideDeviceUnlockAvailability(app: Application): DeviceUnlockAvailability =
        BiometricManager.from(app).deviceUnlockAvailability()

    @Provides
    @Singleton
    fun provideLocalSnapshotStore(app: Application, @IoDispatcher ioDispatcher: CoroutineDispatcher): LocalSnapshotStore =
        EncryptedSnapshotStore(File(app.noBackupFilesDir, SNAPSHOT_DIRECTORY), KeystoreSnapshotFileCipher(app), ioDispatcher)

    @Provides
    fun provideFrameEncoder(): FrameEncoder = UnmirroredJpegEncoder

    @Provides
    @Singleton
    fun provideLegacyCalibrationPreferences(app: Application): LegacyCalibrationPreferences {
        val legacyFile = File(app.filesDir.parentFile, "shared_prefs/$LEGACY_PREFERENCES_FILE.xml")
        return LegacyCalibrationPreferences(
            preferences = app.getSharedPreferences(LEGACY_PREFERENCES_FILE, Context.MODE_PRIVATE),
            lastModifiedMillis = legacyFile.takeIf { it.exists() }?.lastModified()
        )
    }
}
