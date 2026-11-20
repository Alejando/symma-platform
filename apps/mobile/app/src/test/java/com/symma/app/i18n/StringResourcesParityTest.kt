package com.symma.app.i18n

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.w3c.dom.Element
import java.io.File
import javax.xml.parsers.DocumentBuilderFactory

class StringResourcesParityTest {

    private val spanish = readStrings("src/main/res/values/strings.xml")
    private val english = readStrings("src/main/res/values-en/strings.xml")

    @Test
    fun `english catalog has exactly the same keys as the spanish default`() {
        assertTrue(spanish.isNotEmpty())
        assertEquals("Missing in English", emptySet<String>(), spanish.keys - english.keys)
        assertEquals("Missing in Spanish", emptySet<String>(), english.keys - spanish.keys)
    }

    @Test
    fun `both catalogs use the same format arguments for each key`() {
        spanish.forEach { (key, value) ->
            assertEquals("Format arguments of $key", formatArguments(value), formatArguments(english.getValue(key)))
        }
    }

    @Test
    fun `no translation is left empty`() {
        (spanish + english.mapKeys { "en:${it.key}" }).forEach { (key, value) ->
            assertTrue("$key is empty", value.isNotBlank())
        }
    }

    private fun formatArguments(text: String): List<String> =
        Regex("""%(\d+\$)?[sd]""").findAll(text).map { it.value }.sorted().toList()

    private fun readStrings(path: String): Map<String, String> {
        val document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(File(path))
        val nodes = document.getElementsByTagName("string")
        return (0 until nodes.length).associate { index ->
            val element = nodes.item(index) as Element
            element.getAttribute("name") to element.textContent
        }
    }
}
