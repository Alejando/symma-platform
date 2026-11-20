package com.symma.app.core.database

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class DatabasePassphraseStoreTest {

    private val context = ApplicationProvider.getApplicationContext<Context>()

    private fun preferences(name: String) = context.getSharedPreferences(name, Context.MODE_PRIVATE)

    @Test
    fun `the passphrase is 256 random bits written as hex so it is safe inside SQL`() {
        val passphrase = DatabasePassphraseStore(preferences("first")).getOrCreate()

        assertTrue(passphrase.matches(Regex("[0-9a-f]{64}")))
    }

    @Test
    fun `the same passphrase is returned on every launch`() {
        val first = DatabasePassphraseStore(preferences("stable")).getOrCreate()
        val second = DatabasePassphraseStore(preferences("stable")).getOrCreate()

        assertEquals(first, second)
    }

    @Test
    fun `each installation gets its own passphrase`() {
        assertNotEquals(
            DatabasePassphraseStore(preferences("device-a")).getOrCreate(),
            DatabasePassphraseStore(preferences("device-b")).getOrCreate()
        )
    }
}
