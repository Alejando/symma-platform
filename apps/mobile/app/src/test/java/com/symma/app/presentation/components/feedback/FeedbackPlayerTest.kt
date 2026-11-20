package com.symma.app.presentation.components.feedback

import android.content.Context
import android.os.Vibrator
import androidx.test.core.app.ApplicationProvider
import com.symma.app.presentation.player.PlayerEvent
import com.symma.app.presentation.player.feedbackCue
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowToneGenerator

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [30])
class FeedbackPlayerTest {

    private val context = ApplicationProvider.getApplicationContext<Context>()
    @Suppress("DEPRECATION")
    private val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

    @Before
    fun setUp() {
        ShadowToneGenerator.reset()
    }

    @Test
    fun `completed rep plays a tone and vibrates`() {
        val feedbackPlayer = FeedbackPlayer(context)

        feedbackPlayer.play(PlayerEvent.PlayDing.feedbackCue())

        assertEquals(FeedbackCue.REP_COMPLETED.tone, ShadowToneGenerator.getPlayedTones().single().type())
        assertTrue(shadowOf(vibrator).isVibrating)
        assertEquals(FeedbackCue.REP_COMPLETED.vibrationMs, shadowOf(vibrator).milliseconds)
    }

    @Test
    fun `countdown tick only plays a tone`() {
        val feedbackPlayer = FeedbackPlayer(context)

        feedbackPlayer.play(PlayerEvent.PlayTick.feedbackCue())

        assertEquals(1, ShadowToneGenerator.getPlayedTones().size)
        assertFalse(shadowOf(vibrator).isVibrating)
    }

    @Test
    fun `tones keep playing across cues until the player is released`() {
        val feedbackPlayer = FeedbackPlayer(context)

        feedbackPlayer.play(FeedbackCue.CALIBRATION_STEP_COMPLETED)
        feedbackPlayer.play(FeedbackCue.SESSION_COMPLETED)
        feedbackPlayer.release()

        assertEquals(2, ShadowToneGenerator.getPlayedTones().size)
    }

    @Test
    fun `every player event maps to a cue`() {
        assertEquals(FeedbackCue.COUNTDOWN_TICK, PlayerEvent.PlayTick.feedbackCue())
        assertEquals(FeedbackCue.REP_COMPLETED, PlayerEvent.PlayDing.feedbackCue())
        assertEquals(FeedbackCue.SESSION_COMPLETED, PlayerEvent.PlaySuccess.feedbackCue())
    }
}
