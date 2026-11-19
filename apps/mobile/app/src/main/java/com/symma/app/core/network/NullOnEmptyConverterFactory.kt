package com.symma.app.core.network

import okhttp3.ResponseBody
import retrofit2.Converter
import retrofit2.Retrofit
import java.lang.reflect.Type

/** The API answers "no active routine" with 200 and an empty body, which Gson cannot parse. */
class NullOnEmptyConverterFactory : Converter.Factory() {

    override fun responseBodyConverter(
        type: Type,
        annotations: Array<out Annotation>,
        retrofit: Retrofit
    ): Converter<ResponseBody, *> {
        val delegate = retrofit.nextResponseBodyConverter<Any>(this, type, annotations)
        return Converter<ResponseBody, Any?> { body ->
            if (body.contentLength() == 0L) null else delegate.convert(body)
        }
    }
}
