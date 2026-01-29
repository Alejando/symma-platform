package com.symma.app.presentation.components.design

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun SymmaButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    variant: SymmaButtonVariant = SymmaButtonVariant.Primary
) {
    val shape = RoundedCornerShape(12.dp)
    val heightModifier = modifier.height(56.dp)

    when (variant) {
        SymmaButtonVariant.Primary -> {
            Button(
                onClick = onClick,
                modifier = heightModifier,
                enabled = enabled,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) {
                Text(
                    text = text,
                    style = MaterialTheme.typography.labelLarge
                )
            }
        }
        SymmaButtonVariant.Secondary -> {
            OutlinedButton(
                onClick = onClick,
                modifier = heightModifier,
                enabled = enabled,
                shape = shape,
                // OutlinedButton uses outline color by default, we can customize if needed
            ) {
                Text(
                    text = text,
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

enum class SymmaButtonVariant {
    Primary,
    Secondary
}
