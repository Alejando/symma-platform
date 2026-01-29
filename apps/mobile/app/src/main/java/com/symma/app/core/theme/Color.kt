package com.symma.app.core.theme

import androidx.compose.ui.graphics.Color

val Teal600 = Color(0xFF0D9488)
val Slate800 = Color(0xFF1E293B)
val Slate50 = Color(0xFFF8FAFC)
val Rose600 = Color(0xFFE11D48)
val Amber500 = Color(0xFFF59E0B)

val White = Color(0xFFFFFFFF)
val Black = Color(0xFF000000)

val md_theme_light_primary = Teal600
val md_theme_light_onPrimary = White
val md_theme_light_primaryContainer = Color(0xFFE6F6F5) // Approximate lighter teal
val md_theme_light_onPrimaryContainer = Color(0xFF00201E)
val md_theme_light_secondary = Slate800
val md_theme_light_onSecondary = White
val md_theme_light_background = Slate50
val md_theme_light_onBackground = Slate800
val md_theme_light_surface = Slate50
val md_theme_light_onSurface = Slate800
val md_theme_light_error = Rose600
val md_theme_light_onError = White

// Dark theme handling (auto-generated mappings or simple inversions if needed,
// for now focusing on light theme as per RFC specs, but providing fallbacks)
val md_theme_dark_primary = Teal600
val md_theme_dark_onPrimary = White
val md_theme_dark_background = Color(0xFF0F172A) // Dark slate
val md_theme_dark_onBackground = Color(0xFFE2E8F0) // Light slate
val md_theme_dark_surface = Color(0xFF0F172A)
val md_theme_dark_onSurface = Color(0xFFE2E8F0)
