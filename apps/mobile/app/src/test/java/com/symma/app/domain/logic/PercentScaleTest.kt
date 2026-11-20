package com.symma.app.domain.logic

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PercentScaleTest {

    @Test
    fun `unit scores become percentages`() {
        assertEquals(0f, unitScoreToPercent(0f), 0.0001f)
        assertEquals(87.4f, unitScoreToPercent(0.874f), 0.0001f)
        assertEquals(100f, unitScoreToPercent(1f), 0.0001f)
    }

    @Test
    fun `percentages never leave the 0 to 100 range`() {
        assertEquals(100f, unitScoreToPercent(1.3f), 0.0001f)
        assertEquals(0f, unitScoreToPercent(-0.2f), 0.0001f)
    }

    @Test
    fun `only finite values between 0 and 100 are valid percentages`() {
        assertTrue(0f.isValidPercent())
        assertTrue(100f.isValidPercent())
        assertFalse(100.01f.isValidPercent())
        assertFalse((-1f).isValidPercent())
        assertFalse(Float.NaN.isValidPercent())
    }
}
