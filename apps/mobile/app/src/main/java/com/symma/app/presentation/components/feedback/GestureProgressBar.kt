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

/** Progress of the current gesture toward its calibrated target: green from 80 %, yellow from 50 %, red below. */
@Composable
fun GestureProgressBar(
    percent: Float,
    modifier: Modifier = Modifier
) {
    val normalizedProgress = (percent / 100f).coerceIn(0f, 1f)
    
    val animatedProgress by animateFloatAsState(
        targetValue = normalizedProgress,
        animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
        label = "ProgressAnimation"
    )

    val targetColor = when {
        percent >= 80f -> Color(0xFF4CAF50)
        percent >= 50f -> Color(0xFFFFC107)
        else -> Color(0xFFF44336)
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
fun PreviewGestureProgressBar() {
    Column {
        GestureProgressBar(percent = 90f)
        GestureProgressBar(percent = 65f)
        GestureProgressBar(percent = 30f)
    }
}
