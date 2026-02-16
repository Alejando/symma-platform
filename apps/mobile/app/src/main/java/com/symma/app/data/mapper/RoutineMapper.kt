package com.symma.app.data.mapper

import com.symma.app.data.local.entity.ExerciseEntity
import com.symma.app.data.local.entity.RoutineEntity
import com.symma.app.data.local.entity.RoutineItemEntity
import com.symma.app.data.local.entity.RoutineItemWithExercise
import com.symma.app.data.local.entity.RoutineWithItemsAndExercises
import com.symma.app.data.remote.dto.exercise.ExerciseDto
import com.symma.app.data.remote.dto.routine.RoutineDto
import com.symma.app.data.remote.dto.routine.RoutineItemDto
import com.symma.app.domain.model.Exercise
import com.symma.app.domain.model.Routine
import com.symma.app.domain.model.RoutineItem

// ============ DTO -> Domain (existing) ============

fun RoutineDto.toDomain(): Routine {
    return Routine(
        id = id,
        name = name,
        startDate = startDate,
        endDate = endDate,
        status = status,
        items = items.map { it.toDomain() }
    )
}

fun RoutineItemDto.toDomain(): RoutineItem {
    return RoutineItem(
        id = id,
        orderIndex = orderIndex,
        targetRepetitions = targetRepetitions,
        targetSets = targetSets,
        holdTimeSeconds = holdTimeSeconds,
        restBetweenSetsSeconds = restBetweenSetsSeconds,
        exercise = exercise.toDomain()
    )
}

fun ExerciseDto.toDomain(): Exercise {
    return Exercise(
        id = id,
        name = name,
        keyName = keyName,
        description = description,
        type = type,
        category = category,
        mobileModule = mobileModule,
        assetAnimationUrl = assetAnimationUrl,
        assetTutorialVideoUrl = assetTutorialVideoUrl
    )
}

// ============ DTO -> Entity ============

fun RoutineDto.toEntity(): RoutineEntity {
    return RoutineEntity(
        id = id,
        name = name,
        startDate = startDate,
        endDate = endDate,
        status = status
    )
}

fun ExerciseDto.toEntity(): ExerciseEntity {
    return ExerciseEntity(
        id = id,
        name = name,
        keyName = keyName,
        description = description,
        type = type,
        category = category,
        mobileModule = mobileModule,
        assetAnimationUrl = assetAnimationUrl,
        assetTutorialVideoUrl = assetTutorialVideoUrl
    )
}

fun RoutineItemDto.toEntity(routineId: String): RoutineItemEntity {
    return RoutineItemEntity(
        id = id,
        routineId = routineId,
        exerciseId = exercise.id,
        orderIndex = orderIndex,
        targetRepetitions = targetRepetitions,
        targetSets = targetSets,
        holdTimeSeconds = holdTimeSeconds,
        restBetweenSetsSeconds = restBetweenSetsSeconds,
        difficultyLevel = difficultyLevel,
        strictMode = strictMode
    )
}

// ============ Entity -> Domain ============

fun ExerciseEntity.toDomain(): Exercise {
    return Exercise(
        id = id,
        name = name,
        keyName = keyName,
        description = description,
        type = type,
        category = category,
        mobileModule = mobileModule,
        assetAnimationUrl = assetAnimationUrl,
        assetTutorialVideoUrl = assetTutorialVideoUrl
    )
}

fun RoutineItemWithExercise.toDomain(): RoutineItem {
    return RoutineItem(
        id = routineItem.id,
        orderIndex = routineItem.orderIndex,
        targetRepetitions = routineItem.targetRepetitions,
        targetSets = routineItem.targetSets,
        holdTimeSeconds = routineItem.holdTimeSeconds,
        restBetweenSetsSeconds = routineItem.restBetweenSetsSeconds,
        difficulty = routineItem.difficultyLevel.toFloat(),
        strictMode = routineItem.strictMode,
        exercise = exercise.toDomain()
    )
}

fun RoutineWithItemsAndExercises.toDomain(): Routine {
    return Routine(
        id = routine.id,
        name = routine.name,
        startDate = routine.startDate,
        endDate = routine.endDate,
        status = routine.status,
        items = itemsWithExercises
            .sortedBy { it.routineItem.orderIndex }
            .map { it.toDomain() }
    )
}

