package com.symma.app.presentation.auth.components

import com.symma.app.R
import androidx.compose.ui.res.stringResource
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.coerceAtMost
import androidx.compose.ui.unit.coerceIn
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private const val KEYS_PER_ROW = 3
private val PreferredKeySize = 80.dp
private val PreferredKeySpacing = 48.dp
private val MinKeySpacing = 16.dp

@Composable
fun NumericKeypad(
    onDigitClick: (Int) -> Unit,
    onBackspaceClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    BoxWithConstraints(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        val gapsPerRow = KEYS_PER_ROW - 1
        // On narrow screens the spacing shrinks before the keys do, so touch targets stay as large as possible.
        val keySpacing = ((maxWidth - PreferredKeySize * KEYS_PER_ROW) / gapsPerRow)
            .coerceIn(MinKeySpacing, PreferredKeySpacing)
        val keySize = ((maxWidth - keySpacing * gapsPerRow) / KEYS_PER_ROW)
            .coerceAtMost(PreferredKeySize)

        Column(
            verticalArrangement = Arrangement.spacedBy(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            for (rowIndex in 0 until 3) {
                Row(horizontalArrangement = Arrangement.spacedBy(keySpacing)) {
                    for (columnIndex in 1..KEYS_PER_ROW) {
                        val digit = rowIndex * KEYS_PER_ROW + columnIndex
                        KeypadButton(text = digit.toString(), size = keySize) { onDigitClick(digit) }
                    }
                }
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(keySpacing),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.size(keySize))

                KeypadButton(text = "0", size = keySize) { onDigitClick(0) }

                Box(
                    modifier = Modifier
                        .size(keySize)
                        .clip(CircleShape)
                        .clickable { onBackspaceClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = stringResource(R.string.login_backspace),
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@Composable
fun KeypadButton(
    text: String,
    size: Dp = PreferredKeySize,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(MaterialTheme.colorScheme.primaryContainer)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.headlineLarge.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 32.sp
            ),
            color = MaterialTheme.colorScheme.onPrimaryContainer
        )
    }
}
