package com.symma.app.presentation.components.feedback

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

enum class FeedbackCue(val tone: Int, val toneDurationMs: Int, val vibrationMs: Long) {
    COUNTDOWN_TICK(ToneGenerator.TONE_PROP_BEEP, toneDurationMs = 80, vibrationMs = 0),
    REP_COMPLETED(ToneGenerator.TONE_PROP_ACK, toneDurationMs = 200, vibrationMs = 80),
    SESSION_COMPLETED(ToneGenerator.TONE_CDMA_CONFIRM, toneDurationMs = 400, vibrationMs = 300),
    CALIBRATION_STEP_COMPLETED(ToneGenerator.TONE_PROP_ACK, toneDurationMs = 150, vibrationMs = 100)
}

/**
 * Holds one [ToneGenerator] for the lifetime of the screen: releasing it right after
 * startTone() stops the tone before it is heard.
 */
class FeedbackPlayer(context: Context) {

    private val toneGenerator: ToneGenerator? = try {
        ToneGenerator(AudioManager.STREAM_MUSIC, ToneGenerator.MAX_VOLUME)
    } catch (e: RuntimeException) {
        Log.w(TAG, "Tone feedback unavailable: ${e.message}")
        null
    }
    private val vibrator: Vibrator? = context.defaultVibrator()

    fun play(cue: FeedbackCue) {
        toneGenerator?.startTone(cue.tone, cue.toneDurationMs)
        if (cue.vibrationMs > 0 && vibrator?.hasVibrator() == true) {
            vibrator.vibrate(VibrationEffect.createOneShot(cue.vibrationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        }
    }

    fun release() {
        toneGenerator?.release()
    }

    private fun Context.defaultVibrator(): Vibrator? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }

    private companion object {
        const val TAG = "FeedbackPlayer"
    }
}

@Composable
fun rememberFeedbackPlayer(): FeedbackPlayer {
    val context = LocalContext.current
    val feedbackPlayer = remember { FeedbackPlayer(context.applicationContext) }
    DisposableEffect(feedbackPlayer) {
        onDispose { feedbackPlayer.release() }
    }
    return feedbackPlayer
}
