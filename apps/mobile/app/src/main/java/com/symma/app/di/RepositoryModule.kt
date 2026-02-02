package com.symma.app.di

import com.symma.app.data.repository.AuthRepositoryImpl
import com.symma.app.data.repository.CalibrationRepositoryImpl
import com.symma.app.data.repository.RoutineRepositoryImpl
import com.symma.app.domain.repository.AuthRepository
import com.symma.app.domain.repository.CalibrationRepository
import com.symma.app.domain.repository.RoutineRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository

    @Binds
    @Singleton
    abstract fun bindRoutineRepository(
        routineRepositoryImpl: RoutineRepositoryImpl
    ): RoutineRepository

    @Binds
    @Singleton
    abstract fun bindSessionRepository(
        sessionRepositoryImpl: com.symma.app.data.repository.SessionRepositoryImpl
    ): com.symma.app.domain.repository.SessionRepository

    @Binds
    @Singleton
    abstract fun bindCalibrationRepository(
        calibrationRepositoryImpl: CalibrationRepositoryImpl
    ): CalibrationRepository
}

