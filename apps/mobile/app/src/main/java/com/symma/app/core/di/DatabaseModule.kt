package com.symma.app.core.di

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
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
    version = 5,
    exportSchema = false
)
abstract class SymmaDatabase : RoomDatabase() {
    abstract fun routineDao(): RoutineDao
    abstract fun sessionDao(): SessionDao
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

