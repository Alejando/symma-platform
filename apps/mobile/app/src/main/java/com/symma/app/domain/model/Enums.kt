package com.symma.app.domain.model

enum class Role {
    ADMIN,
    THERAPIST
}

enum class Gender {
    MALE,
    FEMALE,
    OTHER
}

enum class PatientStatus {
    ACTIVE,
    INACTIVE,
    ARCHIVED
}

enum class ExerciseCategory {
    WARMUP,
    CORE,
    COOLDOWN
}

enum class RoutineStatus {
    ACTIVE,
    ARCHIVED
}
