package com.symma.app.core.security

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL

/** Biometrics or the screen lock PIN, pattern or password; weak biometrics are the only kind combinable with the screen lock on Android 9 and 10. */
const val DEVICE_UNLOCK_AUTHENTICATORS = BIOMETRIC_WEAK or DEVICE_CREDENTIAL

fun interface DeviceUnlockAvailability {
    fun isAvailable(): Boolean
}

fun BiometricManager.deviceUnlockAvailability() = DeviceUnlockAvailability {
    canAuthenticate(DEVICE_UNLOCK_AUTHENTICATORS) == BiometricManager.BIOMETRIC_SUCCESS
}
