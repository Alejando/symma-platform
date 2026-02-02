package com.symma.app.domain.repository

import com.symma.app.domain.model.CalibrationBaseline
import kotlinx.coroutines.flow.Flow

interface CalibrationRepository {
    
    suspend fun saveBaseline(baseline: CalibrationBaseline)
    
    fun getBaselineFlow(): Flow<CalibrationBaseline?>
    
    fun getBaseline(): CalibrationBaseline?
}
