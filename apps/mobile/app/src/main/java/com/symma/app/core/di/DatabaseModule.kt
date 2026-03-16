package com.symma.app.core.di

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
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
import javax.inject.Singleton

@Database(
    entities = [
        RoutineEntity::class,
        ExerciseEntity::class,
        RoutineItemEntity::class,
        SessionEntity::class,
        SessionItemEntity::class
    ],
    version = 6,
    exportSchema = false
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

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(app: Application): SymmaDatabase {
        return Room.databaseBuilder(
            app,
            SymmaDatabase::class.java,
            "symma_db"
        )
            .addMigrations(MIGRATION_5_6)
            .fallbackToDestructiveMigration()
            .build()
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

    @Provides
    @Singleton
    fun provideSharedPreferences(app: Application): SharedPreferences {
        return app.getSharedPreferences("symma_prefs", Context.MODE_PRIVATE)
    }
}

