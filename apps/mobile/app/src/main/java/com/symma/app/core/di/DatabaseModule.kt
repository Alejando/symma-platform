package com.symma.app.core.di

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.symma.app.core.database.DatabasePassphraseStore
import com.symma.app.core.database.PlaintextDatabaseMigration
import com.symma.app.core.database.SqlCipherExporter
import com.symma.app.core.security.EncryptedPreferences
import com.symma.app.data.local.dao.RoutineDao
import com.symma.app.data.local.dao.SessionDao
import com.symma.app.data.local.entity.ExerciseEntity
import com.symma.app.data.local.entity.RoutineEntity
import com.symma.app.data.local.entity.RoutineItemEntity
import com.symma.app.data.local.entity.SessionEntity
import com.symma.app.data.local.entity.SessionItemEntity
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import net.zetetic.database.sqlcipher.SupportOpenHelperFactory
import javax.inject.Singleton

@Database(
    entities = [
        RoutineEntity::class,
        ExerciseEntity::class,
        RoutineItemEntity::class,
        SessionEntity::class,
        SessionItemEntity::class
    ],
    version = 7,
    exportSchema = true
)
abstract class SymmaDatabase : RoomDatabase() {
    abstract fun routineDao(): RoutineDao
    abstract fun sessionDao(): SessionDao
}

/**
 * Migration from version 5 to 6: Remove difficulty column from session_items table.
 * The difficulty is now obtained from the RoutineItem instead of being stored per SessionItem.
 */
val MIGRATION_5_6 = object : Migration(5, 6) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // SQLite doesn't support DROP COLUMN directly, so we need to:
        // 1. Create a new table without the difficulty column
        // 2. Copy data from old table
        // 3. Drop old table
        // 4. Rename new table
        db.execSQL("""
            CREATE TABLE session_items_new (
                id TEXT NOT NULL PRIMARY KEY,
                session_id TEXT NOT NULL,
                exercise_id TEXT NOT NULL,
                reps_completed INTEGER NOT NULL,
                average_accuracy REAL,
                series_data TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        """.trimIndent())
        
        db.execSQL("""
            INSERT INTO session_items_new (id, session_id, exercise_id, reps_completed, average_accuracy, series_data)
            SELECT id, session_id, exercise_id, reps_completed, average_accuracy, series_data
            FROM session_items
        """.trimIndent())
        
        db.execSQL("DROP TABLE session_items")
        db.execSQL("ALTER TABLE session_items_new RENAME TO session_items")
        db.execSQL("CREATE INDEX index_session_items_session_id ON session_items(session_id)")
    }
}

/** Accuracy moved from a 0–1 to a 0–100 scale; a stored value of at most 1 can only be a 0–1 score. */
val MIGRATION_6_7 = object : Migration(6, 7) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("UPDATE session_items SET average_accuracy = average_accuracy * 100 WHERE average_accuracy <= 1")
        db.execSQL("UPDATE sessions SET score = score * 100 WHERE score <= 1")
        db.execSQL("ALTER TABLE session_items ADD COLUMN symmetry_score REAL")
        db.execSQL("ALTER TABLE session_items ADD COLUMN average_hold_seconds REAL")
        db.execSQL("ALTER TABLE sessions ADD COLUMN calibration TEXT")
        db.execSQL("ALTER TABLE session_items ADD COLUMN snapshot_path TEXT")
        db.execSQL("ALTER TABLE session_items ADD COLUMN snapshot_key TEXT")
    }
}

private const val DATABASE_NAME = "symma_db"
private const val DATABASE_KEY_PREFERENCES_FILE = "secure_database"
private const val DATABASE_KEY_ALIAS = "symma_database_key"
private const val SQLCIPHER_LIBRARY = "sqlcipher"
private const val TAG = "DatabaseModule"

/** Pre-release schemas with no migration path; any later version must be migrated so pending sessions survive. */
private val VERSIONS_WITHOUT_MIGRATION_PATH = intArrayOf(1, 2, 3, 4)

fun symmaDatabaseBuilder(context: Context, name: String = DATABASE_NAME): RoomDatabase.Builder<SymmaDatabase> =
    Room.databaseBuilder(context, SymmaDatabase::class.java, name)
        .addMigrations(MIGRATION_5_6, MIGRATION_6_7)
        .fallbackToDestructiveMigrationFrom(*VERSIONS_WITHOUT_MIGRATION_PATH)

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabasePassphraseStore(app: Application): DatabasePassphraseStore =
        DatabasePassphraseStore(openDatabaseKeyPreferences(app))

    @Provides
    @Singleton
    fun provideDatabase(app: Application, passphraseStore: DatabasePassphraseStore): SymmaDatabase {
        System.loadLibrary(SQLCIPHER_LIBRARY)
        val passphrase = passphraseStore.getOrCreate()
        val builder = symmaDatabaseBuilder(app)
        if (encryptExistingDatabase(app, passphrase)) {
            builder.openHelperFactory(SupportOpenHelperFactory(passphrase.toByteArray(Charsets.UTF_8)))
        }
        return builder.build()
    }

    /** A failed encryption keeps the plaintext database usable and is retried on the next launch. */
    private fun encryptExistingDatabase(app: Application, passphrase: String): Boolean =
        try {
            PlaintextDatabaseMigration(app.getDatabasePath(DATABASE_NAME), SqlCipherExporter).encryptIfPlaintext(passphrase)
        } catch (e: Exception) {
            Log.e(TAG, "Could not encrypt the existing database, opening it unencrypted for now", e)
            false
        }

    /**
     * Without its Keystore key the passphrase, and with it an encrypted database, can never be read
     * again; starting over is the only way the app keeps working. A plaintext database is kept.
     */
    private fun openDatabaseKeyPreferences(app: Application): SharedPreferences =
        try {
            EncryptedPreferences.open(app, DATABASE_KEY_PREFERENCES_FILE, DATABASE_KEY_ALIAS)
        } catch (e: Exception) {
            Log.e(TAG, "Database key store unreadable, discarding the encrypted database", e)
            EncryptedPreferences.delete(app, DATABASE_KEY_PREFERENCES_FILE, DATABASE_KEY_ALIAS)
            val databaseFile = app.getDatabasePath(DATABASE_NAME)
            if (databaseFile.exists() && !PlaintextDatabaseMigration.isPlaintextSqlite(databaseFile)) {
                app.deleteDatabase(DATABASE_NAME)
            }
            EncryptedPreferences.open(app, DATABASE_KEY_PREFERENCES_FILE, DATABASE_KEY_ALIAS)
        }

    @Provides
    @Singleton
    fun provideRoutineDao(database: SymmaDatabase): RoutineDao {
        return database.routineDao()
    }

    @Provides
    @Singleton
    fun provideSessionDao(database: SymmaDatabase): SessionDao {
        return database.sessionDao()
    }
}

