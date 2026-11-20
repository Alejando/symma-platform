package com.symma.app.core.network

import com.symma.app.data.remote.dto.routine.RoutineDto
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class NullOnEmptyConverterFactoryTest {

    private val retrofit = Retrofit.Builder()
        .baseUrl("https://api.example.test/")
        .addConverterFactory(NullOnEmptyConverterFactory())
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val routineConverter = retrofit.responseBodyConverter<RoutineDto?>(RoutineDto::class.java, emptyArray())

    @Test
    fun `empty body converts to null`() {
        assertNull(routineConverter.convert("".toResponseBody()))
    }

    @Test
    fun `non-empty body is parsed by the next converter`() {
        val routine = routineConverter.convert("""{"id":"routine-1","name":"Daily","items":[]}""".toResponseBody())

        assertEquals("routine-1", routine?.id)
    }
}
