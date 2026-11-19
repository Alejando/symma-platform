package com.symma.app.domain.model

sealed class LoginFailure : Exception() {
    class InvalidAccessCode : LoginFailure()
    class TooManyAttempts : LoginFailure()
    class NoConnection : LoginFailure()
    class ServerUnavailable : LoginFailure()
}
