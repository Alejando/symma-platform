package com.symma.app.core.di

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import androidx.test.core.app.ApplicationProvider
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class DatabaseMigrationTest {

    private val context = ApplicationProvider.getApplicationContext<Context>()
    private var database: SymmaDatabase? = null

    @Before
    fun setUp() {
        context.deleteDatabase(DATABASE_NAME)
    }

    @After
    fun tearDown() {
        database?.close()
        context.deleteDatabase(DATABASE_NAME)
    }

    @Test
    fun `opening a database from every exported version keeps its PENDING sessions`() = runBlocking {
        val versions = exportedVersions()
        assertTrue("No exported schemas found in $SCHEMA_DIRECTORY", versions.isNotEmpty())

        versions.forEach { version ->
            context.deleteDatabase(DATABASE_NAME)
            createDatabaseFromExportedSchema(version).use { legacy ->
                insertPendingSession(legacy)
                legacy.execSQL(
                    "INSERT INTO session_items (id, session_id, exercise_id, reps_completed, average_accuracy, series_data) " +
                        "VALUES ('item-1', 'pending-session', 'exercise-1', 10, 0.9, NULL)"
                )
            }

            val upgraded = openWithRoom()
            val pending = upgraded.sessionDao().getPendingSessions()
            val items = upgraded.sessionDao().getItemsForSession("pending-session")
            upgraded.close()

            assertEquals("Upgrading from version $version", listOf("pending-session"), pending.map { it.id })
            assertEquals("Upgrading from version $version", 1, items.size)
        }
    }

    @Test
    fun `upgrading from version 5 keeps PENDING sessions and their items`() = runBlocking {
        createDatabaseFromExportedSchema(6, version = 5, sessionItemsCreateSql = VERSION_5_SESSION_ITEMS).use { legacy ->
            insertPendingSession(legacy)
            legacy.execSQL(
                "INSERT INTO session_items (id, session_id, exercise_id, reps_completed, difficulty, average_accuracy, series_data) " +
                    "VALUES ('item-1', 'pending-session', 'exercise-1', 10, 2, 0.9, NULL)"
            )
        }

        val upgraded = openWithRoom()

        assertEquals(listOf("pending-session"), upgraded.sessionDao().getPendingSessions().map { it.id })
        assertEquals(10, upgraded.sessionDao().getItemsForSession("pending-session").single().repsCompleted)
    }

    @Test
    fun `upgrading from version 6 rescales accuracy and score to 0-100 and adds the symmetry, hold, calibration and snapshot columns`() = runBlocking {
        createDatabaseFromExportedSchema(6).use { legacy ->
            insertPendingSession(legacy)
            legacy.execSQL(
                "INSERT INTO session_items (id, session_id, exercise_id, reps_completed, average_accuracy, series_data) " +
                    "VALUES ('item-1', 'pending-session', 'exercise-1', 10, 0.9, NULL), " +
                    "('item-2', 'pending-session', 'exercise-2', 4, NULL, NULL)"
            )
        }

        val upgraded = openWithRoom()
        val accuracyByItem = upgraded.sessionDao().getItemsForSession("pending-session").associate { it.id to it.averageAccuracy }
        val migratedSession = upgraded.sessionDao().getPendingSessions().single()
        val score = migratedSession.score
        assertEquals(null, migratedSession.calibrationJson)

        val migratedItem = upgraded.sessionDao().getItemsForSession("pending-session").first { it.id == "item-1" }
        assertEquals(null, migratedItem.symmetryScore)
        assertEquals(null, migratedItem.averageHoldSeconds)
        assertEquals(null, migratedItem.snapshotReference)
        assertEquals(null, migratedItem.snapshotKey)
        assertEquals(90f, accuracyByItem.getValue("item-1")!!, 0.001f)
        assertEquals(null, accuracyByItem.getValue("item-2"))
        assertEquals(80f, score, 0.001f)
    }

    private fun insertPendingSession(db: SQLiteDatabase) {
        db.execSQL(
            "INSERT INTO sessions (id, routine_id, start_time, end_time, duration_seconds, score, sync_status, synced_at, created_at) " +
                "VALUES ('pending-session', 'routine-1', 1000, 2000, 1, 0.8, 'PENDING', NULL, 1000)"
        )
    }

    private fun openWithRoom(): SymmaDatabase =
        symmaDatabaseBuilder(context, DATABASE_NAME)
            .allowMainThreadQueries()
            .build()
            .also { database = it }

    private fun exportedVersions(): List<Int> =
        SCHEMA_DIRECTORY.listFiles().orEmpty().mapNotNull { it.nameWithoutExtension.toIntOrNull() }.sorted()

    private fun createDatabaseFromExportedSchema(
        exportedVersion: Int,
        version: Int = exportedVersion,
        sessionItemsCreateSql: String? = null
    ): SQLiteDatabase {
        val schema = JSONObject(File(SCHEMA_DIRECTORY, "$exportedVersion.json").readText()).getJSONObject("database")
        val db = context.openOrCreateDatabase(DATABASE_NAME, Context.MODE_PRIVATE, null)
        val entities = schema.getJSONArray("entities")
        for (index in 0 until entities.length()) {
            val entity = entities.getJSONObject(index)
            val tableName = entity.getString("tableName")
            val createSql = if (tableName == "session_items" && sessionItemsCreateSql != null) {
                sessionItemsCreateSql
            } else {
                entity.getString("createSql").replace(TABLE_NAME_PLACEHOLDER, tableName)
            }
            db.execSQL(createSql)
            val indices = entity.optJSONArray("indices") ?: continue
            for (indexPosition in 0 until indices.length()) {
                db.execSQL(indices.getJSONObject(indexPosition).getString("createSql").replace(TABLE_NAME_PLACEHOLDER, tableName))
            }
        }
        val setupQueries = schema.getJSONArray("setupQueries")
        for (index in 0 until setupQueries.length()) {
            db.execSQL(setupQueries.getString(index))
        }
        db.version = version
        return db
    }

    private companion object {
        const val DATABASE_NAME = "migration-test.db"
        const val TABLE_NAME_PLACEHOLDER = "\${TABLE_NAME}"
        val SCHEMA_DIRECTORY = File("schemas/com.symma.app.core.di.SymmaDatabase")

        /** Version 5 is version 6 plus session_items.difficulty, which MIGRATION_5_6 drops. */
        const val VERSION_5_SESSION_ITEMS =
            "CREATE TABLE IF NOT EXISTS `session_items` (`id` TEXT NOT NULL, `session_id` TEXT NOT NULL, " +
                "`exercise_id` TEXT NOT NULL, `reps_completed` INTEGER NOT NULL, `difficulty` INTEGER NOT NULL, " +
                "`average_accuracy` REAL, `series_data` TEXT, PRIMARY KEY(`id`), " +
                "FOREIGN KEY(`session_id`) REFERENCES `sessions`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE )"
    }
}
