package com.symma.app.i18n

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import com.symma.app.domain.model.ExerciseCategory
import com.symma.app.domain.model.ExerciseType
import com.symma.app.domain.model.Gender
import com.symma.app.domain.model.MobileModule
import com.symma.app.domain.model.PatientStatus
import com.symma.app.domain.model.Role
import com.symma.app.domain.model.RoutineStatus

@Composable
fun EnumText(
    role: Role,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    style: TextStyle = TextStyle.Default
) {
    Text(
        text = role.toDisplayName(),
        modifier = modifier,
        color = color,
        style = style
    )
}

@Composable
fun EnumText(
    gender: Gender,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    style: TextStyle = TextStyle.Default
) {
    Text(
        text = gender.toDisplayName(),
        modifier = modifier,
        color = color,
        style = style
    )
}

@Composable
fun EnumText(
    status: PatientStatus,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    style: TextStyle = TextStyle.Default
) {
    Text(
        text = status.toDisplayName(),
        modifier = modifier,
        color = color,
        style = style
    )
}

@Composable
fun EnumText(
    type: ExerciseType,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    style: TextStyle = TextStyle.Default
) {
    Text(
        text = type.toDisplayName(),
        modifier = modifier,
        color = color,
        style = style
    )
}

@Composable
fun EnumText(
    category: ExerciseCategory,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    style: TextStyle = TextStyle.Default
) {
    Text(
        text = category.toDisplayName(),
        modifier = modifier,
        color = color,
        style = style
    )
}

@Composable
fun EnumText(
    status: RoutineStatus,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    style: TextStyle = TextStyle.Default
) {
    Text(
        text = status.toDisplayName(),
        modifier = modifier,
        color = color,
        style = style
    )
}

@Composable
fun EnumText(
    module: MobileModule,
    modifier: Modifier = Modifier,
    color: Color = Color.Unspecified,
    style: TextStyle = TextStyle.Default
) {
    Text(
        text = module.toDisplayName(),
        modifier = modifier,
        color = color,
        style = style
    )
}
