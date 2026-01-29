package com.symma.app.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import dagger.hilt.android.AndroidEntryPoint
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.symma.app.presentation.auth.LoginScreen
import com.symma.app.presentation.home.HomeScreen
import com.symma.app.presentation.camera.CameraTestScreen
import com.symma.app.presentation.player.PlayerScreen
import com.symma.app.presentation.summary.SummaryScreen
import com.symma.app.core.theme.SymmaTheme
import com.symma.app.core.security.TokenManager
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var tokenManager: TokenManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Determine start destination based on existing token
        val startDestination = if (tokenManager.getToken() != null) "home" else "login"
        
        setContent {
            SymmaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    NavHost(navController = navController, startDestination = startDestination) {
                        composable("login") {
                            LoginScreen(
                                onNavigateToHome = {
                                    navController.navigate("home") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("home") {
                            HomeScreen(
                                onNavigateToSession = {
                                    navController.navigate("player")
                                },
                                onNavigateToCamera = {
                                    navController.navigate("camera_test")
                                }
                            )
                        }
                        composable("camera_test") {
                            CameraTestScreen(
                                onNavigateBack = {
                                    navController.popBackStack()
                                }
                            )
                        }

                        composable("player") {
                            PlayerScreen(
                                onNavigateBack = {
                                    navController.popBackStack()
                                },
                                onNavigateToSummary = { routineId, duration ->
                                    navController.navigate("summary/$routineId/$duration") {
                                        // Pop up to home to clear player from backstack
                                        popUpTo("home") { inclusive = false }
                                    }
                                }
                            )
                        }
                        
                        composable(
                            route = "summary/{routineId}/{duration}",
                            arguments = listOf(
                                navArgument("routineId") { type = NavType.StringType },
                                navArgument("duration") { type = NavType.LongType }
                            )
                        ) {
                            SummaryScreen(
                                onNavigateHome = {
                                    // Navigate back to home and clear everything in between
                                    navController.navigate("home") {
                                        popUpTo("home") { inclusive = true }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

