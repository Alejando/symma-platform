package com.symma.app.presentation.components.feedback

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

/**
 * A visual quality bar that indicates symmetry score.
 * - Green: >= 80%
 * - Yellow: 50% - 79%
 * - Red: < 50%
 */
@Composable
fun QualityBar(
    score: Float,
    modifier: Modifier = Modifier
) {
    // Normalize score to 0.0 - 1.0 for the progress bar
    val normalizedProgress = (score / 100f).coerceIn(0f, 100f)
    
    val animatedProgress by animateFloatAsState(
        targetValue = normalizedProgress,
        animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
        label = "ProgressAnimation"
    )

    // Determine color based on original score (0-100)
    val targetColor = when {
        score >= 80f -> Color(0xFF4CAF50) // Green
        score >= 50f -> Color(0xFFFFC107) // Yellow
        else -> Color(0xFFF44336)         // Red
    }

    val animatedColor by animateColorAsState(
        targetValue = targetColor,
        animationSpec = tween(durationMillis = 300),
        label = "ColorAnimation"
    )

    LinearProgressIndicator(
        progress = { animatedProgress },
        modifier = modifier
            .fillMaxWidth()
            .height(12.dp)
            .clip(RoundedCornerShape(8.dp)),
        color = animatedColor,
        trackColor = Color.LightGray.copy(alpha = 0.3f),
    )
}

@Preview
@Composable
fun PreviewQualityBar() {
    Column {
        QualityBar(score = 90f) // Green
        QualityBar(score = 65f) // Yellow
        QualityBar(score = 30f) // Red
    }
}
