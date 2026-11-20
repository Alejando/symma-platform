package com.symma.app.presentation.unlock

import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.provider.Settings
import androidx.biometric.BiometricPrompt
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.symma.app.R
import com.symma.app.core.security.DEVICE_UNLOCK_AUTHENTICATORS
import com.symma.app.presentation.auth.components.NumericKeypad
import com.symma.app.presentation.auth.components.PinIndicator
import com.symma.app.presentation.components.design.SymmaButton

@Composable
fun UnlockScreen(
    onSignInRequired: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: UnlockViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(state.method) {
        if (state.method == UnlockMethod.SIGN_IN_AGAIN) onSignInRequired()
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = stringResource(R.string.unlock_title),
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        when (state.method) {
            UnlockMethod.DEVICE_CREDENTIAL -> DeviceCredentialUnlock(onUnlocked = viewModel::onDeviceUnlockSucceeded)
            UnlockMethod.ACCESS_CODE -> AccessCodeUnlock(
                state = state,
                onDigit = viewModel::onDigitEntered,
                onBackspace = viewModel::onBackspace
            )
            UnlockMethod.SIGN_IN_AGAIN -> CircularProgressIndicator()
        }
    }
}

@Composable
private fun DeviceCredentialUnlock(onUnlocked: () -> Unit) {
    val activity = LocalContext.current.findFragmentActivity()
    val promptTitle = stringResource(R.string.unlock_prompt_title)
    val promptSubtitle = stringResource(R.string.unlock_prompt_subtitle)
    val showPrompt = { activity?.showDeviceUnlockPrompt(promptTitle, promptSubtitle, onUnlocked) }

    LaunchedEffect(Unit) { showPrompt() }

    Text(
        text = stringResource(R.string.unlock_device_explanation),
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
    )
    Spacer(modifier = Modifier.height(32.dp))
    SymmaButton(
        text = stringResource(R.string.unlock_button),
        onClick = { showPrompt() },
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
private fun AccessCodeUnlock(
    state: UnlockUiState,
    onDigit: (Int) -> Unit,
    onBackspace: () -> Unit
) {
    val context = LocalContext.current
    Text(
        text = stringResource(R.string.unlock_access_code_explanation),
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        textAlign = TextAlign.Center
    )
    state.attemptsLeft?.let { attemptsLeft ->
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = pluralStringResource(R.plurals.unlock_wrong_access_code, attemptsLeft, attemptsLeft),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center
        )
    }
    Spacer(modifier = Modifier.height(32.dp))
    if (state.isChecking) {
        CircularProgressIndicator()
    } else {
        PinIndicator(pinLength = state.enteredDigits.length)
    }
    Spacer(modifier = Modifier.height(32.dp))
    NumericKeypad(onDigitClick = onDigit, onBackspaceClick = onBackspace)
    Spacer(modifier = Modifier.height(16.dp))
    TextButton(onClick = { context.startActivity(Intent(Settings.ACTION_SECURITY_SETTINGS)) }) {
        Text(stringResource(R.string.unlock_set_up_screen_lock))
    }
}

private fun FragmentActivity.showDeviceUnlockPrompt(title: String, subtitle: String, onUnlocked: () -> Unit) {
    val callback = object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) = onUnlocked()
    }
    val promptInfo = BiometricPrompt.PromptInfo.Builder()
        .setTitle(title)
        .setSubtitle(subtitle)
        .setAllowedAuthenticators(DEVICE_UNLOCK_AUTHENTICATORS)
        .build()
    BiometricPrompt(this, ContextCompat.getMainExecutor(this), callback).authenticate(promptInfo)
}

private tailrec fun Context.findFragmentActivity(): FragmentActivity? = when (this) {
    is FragmentActivity -> this
    is ContextWrapper -> baseContext.findFragmentActivity()
    else -> null
}
