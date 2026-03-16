package com.symma.app.i18n

import com.symma.app.domain.model.Role
import com.symma.app.domain.model.Gender
import com.symma.app.domain.model.PatientStatus
import com.symma.app.domain.model.ExerciseType
import com.symma.app.domain.model.ExerciseCategory
import com.symma.app.domain.model.RoutineStatus
import com.symma.app.domain.model.MobileModule
import org.junit.Assert.assertEquals
import org.junit.Test

class EnumTranslationsTest {

    @Test
    fun `Role translates correctly`() {
        assertEquals("Administrador", Role.ADMIN.toDisplayName())
        assertEquals("Terapeuta", Role.THERAPIST.toDisplayName())
    }

    @Test
    fun `PatientStatus translates correctly`() {
        assertEquals("Activo", PatientStatus.ACTIVE.toDisplayName())
        assertEquals("Inactivo", PatientStatus.INACTIVE.toDisplayName())
        assertEquals("Archivado", PatientStatus.ARCHIVED.toDisplayName())
    }

    @Test
    fun `ExerciseType translates correctly`() {
        assertEquals("Isotónico", ExerciseType.ISOTONIC.toDisplayName())
        assertEquals("Isométrico", ExerciseType.ISOMETRIC.toDisplayName())
    }
}
