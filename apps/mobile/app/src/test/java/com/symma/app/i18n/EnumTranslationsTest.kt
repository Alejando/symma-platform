package com.symma.app.i18n

import com.symma.app.domain.model.ExerciseCategory
import com.symma.app.domain.model.ExerciseType
import com.symma.app.domain.model.Gender
import com.symma.app.domain.model.MobileModule
import com.symma.app.domain.model.PatientStatus
import com.symma.app.domain.model.Role
import com.symma.app.domain.model.RoutineStatus
import org.junit.Assert.assertEquals
import org.junit.Test

class EnumTranslationsTest {

    private fun assertDistinctResources(resources: List<Int>) {
        assertEquals(resources.size, resources.toSet().size)
    }

    @Test
    fun `every enum value has its own string resource`() {
        assertDistinctResources(Role.values().map { it.displayNameRes() })
        assertDistinctResources(Gender.values().map { it.displayNameRes() })
        assertDistinctResources(PatientStatus.values().map { it.displayNameRes() })
        assertDistinctResources(ExerciseType.values().map { it.displayNameRes() })
        assertDistinctResources(ExerciseCategory.values().map { it.displayNameRes() })
        assertDistinctResources(RoutineStatus.values().map { it.displayNameRes() })
        assertDistinctResources(MobileModule.values().map { it.displayNameRes() })
    }
}
