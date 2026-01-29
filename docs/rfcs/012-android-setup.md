# RFC-012: Android Project Initialization & Architecture Setup (MOB-1)

| Metadata | Value |
| :--- | :--- |
| **Status** | **APPROVED FOR EXECUTION** |
| **Dependencies** | None (Greenfield Project) |
| **Scope** | Mobile Codebase (`apps/mobile`) |
| **Tech Stack** | Kotlin, Jetpack Compose, Hilt, Room, Retrofit |

## 1. Objective
Initialize the Android Application for "Symma".
The goal is to establish a robust, scalable architecture **before** writing any UI or Logic.
We will use **Clean Architecture** (MVVM) to separate concerns and ensure the app is testable and maintainable.

## 2. Technical Specifications

### 2.1 Project Config
* **Root Directory:** `apps/mobile` (Create this folder).
* **Package Name:** `com.symma.app`
* **Min SDK:** 26 (Android 8.0).
* **Target SDK:** 34 (Android 14).
* **Build System:** Gradle (Kotlin DSL - `.kts`).
* **Dependency Management:** Version Catalog (`libs.versions.toml`).

### 2.2 The Stack (Dependencies)
You must configure the `build.gradle.kts` files to include:
* **UI:** Jetpack Compose (Material 3).
* **DI:** Hilt (Dagger).
* **Network:** Retrofit + OkHttp + Gson/Moshi.
* **Local DB:** Room.
* **Async:** Coroutines + Flow.
* **Navigation:** Navigation Compose.
* **Hardware:** CameraX (Core, Camera2, Lifecycle, View).

### 2.3 Directory Structure (Clean Architecture)
The project must follow this strict package hierarchy:

```text
com.symma.app
├── core
│   ├── network         # Retrofit Modules, Interceptors
│   ├── database        # Room Database, TypeConverters
│   ├── di              # Global Hilt Modules (AppModule)
│   └── theme           # Color, Type, Shape (Symma Theme)
├── domain
│   ├── model           # Data Classes (Entity)
│   └── repository      # Interfaces
├── data
│   ├── repository      # Implementation of Repositories
│   ├── source          # Remote/Local Data Sources
│   └── mapper          # DTO to Domain Mappers
├── presentation
│   ├── MainActivity.kt # Single Activity Entry Point
│   ├── navigation      # NavHost & Route Definitions
│   ├── components      # Shared UI Components (Buttons, Inputs)
│   └── features
│       ├── auth        # Login Screen & ViewModel
│       ├── home        # Dashboard Screen & ViewModel
│       └── routine     # Player Logic
└── SymmaApp.kt         # @HiltAndroidApp
```

## 3. Implementation Steps (Agent Instructions)
---------------------------------------------

### 3.1.  **Scaffolding:**
    
    *   Initialize the Android project structure in apps/mobile.
        
    *   Set up libs.versions.toml with all the dependencies listed in Section 2.2.
        
    *   Apply the necessary plugins (com.android.application, kotlin-android, kapt/ksp, dagger.hilt).
        
### 3.2.  **Architecture Skeleton:**
    
    *   Create the package structure defined in Section 2.3.
        
    *   Create the SymmaApp.kt class extending Application and annotate with @HiltAndroidApp.
        
    *   Update AndroidManifest.xml to use this Application class.
        
### 3.3.  **Core Module Setup:**
    
    *   **Network:** Create a basic NetworkModule (Hilt) that provides a singleton Retrofit instance (Base URL can be placeholder http://10.0.2.2:3000/api/ for emulator).
        
    *   **Database:** Create an abstract SymmaDatabase (Room) and a DatabaseModule.
        
### 3.4.  **Verification:**
    
    *   Create a simple "Hello World" in MainActivity using Jetpack Compose to ensure the build passes and the app runs.

## 4. Acceptance Criteria
-----------------------

*   **\[ \] Build Success:** Running ./gradlew assembleDebug succeeds without errors.
    
*   **\[ \] Dependency Check:** libs.versions.toml is used. Hilt, Room, and Compose are present.
    
*   **\[ \] App Launch:** The app opens on an Emulator showing a blank screen or "Symma App", confirming MainActivity is correctly configured.
    
*   **\[ \] Architecture:** The folders core, data, domain, presentation exist.