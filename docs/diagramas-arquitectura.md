# Diagramas de Arquitectura — Symma Platform

**Proyecto:** Symma Platform — Ecosistema de Rehabilitación de Parálisis Facial  
**Versión:** 2.0.0  
**Fecha:** Mayo 2026

---

## 1. Arquitectura General del Sistema

El siguiente diagrama de nivel de contexto (C4 Model — Context Level) muestra los actores externos del sistema y las interacciones de alto nivel entre los tres subsistemas principales de Symma Platform: el Portal Web para terapeutas, la API REST central y la Aplicación Móvil para pacientes. El almacenamiento de datos se divide entre PostgreSQL (datos clínicos estructurados) y un servicio S3-compatible (evidencia fotográfica de las sesiones).

```mermaid
graph TD
    THERAPIST(["Terapeuta\n(Clínico)"])
    PATIENT(["Paciente\n(Usuario Móvil)"])

    subgraph SYMMA["Symma Platform"]
        WEB["Portal Web\nNext.js 14 — App Router\npuerto 4000"]
        API["API REST Central\nNestJS + Passport JWT\npuerto 4001"]
        MOBILE["App Móvil Android\nKotlin + Jetpack Compose\nSDK 26+"]
    end

    DB[("PostgreSQL 15\npuerto 5440 (Docker)\nsymma_db")]
    S3[("Almacenamiento S3-compatible\nFotografías de sesiones\nSnapshot de calibración")]

    THERAPIST -->|"HTTPS / Sesión Web\n(Auth.js)"| WEB
    WEB -->|"HTTP REST + JWT\npuerto 4001"| API
    API -->|"Prisma ORM\nSQL"| DB
    API -->|"Subida de imágenes\nHTTPS"| S3

    PATIENT -->|"Interacción directa\nAndroid"| MOBILE
    MOBILE -->|"HTTPS REST + JWT\nSincronización de sesiones"| API
    MOBILE -->|"Cámara frontal\n(procesamiento local)"| MOBILE

    WEB -.->|"Visualiza datos clínicos\ndel paciente"| THERAPIST
    MOBILE -.->|"Descarga rutina asignada\npor el terapeuta"| PATIENT
```

---

## 2. Diagrama de Componentes — Backend y Portal Web

El diagrama presenta la estructura interna del Backend (NestJS) y el Portal Web (Next.js). Cada módulo de NestJS sigue el patrón estándar del framework: un Controller que expone los endpoints REST, un Service que contiene la lógica de negocio y, cuando aplica, acceso directo a Prisma para la persistencia. El módulo `AppI18nModule` provee internacionalización global con soporte para inglés y español.

```mermaid
graph LR
    subgraph WEB_APP["Portal Web — Next.js 14 (puerto 4000)"]
        direction TB
        NC["Next.js App Router\nServer Components\nReact Compiler"]
        HTTP_CLIENT["HTTP Client\nfetch / axios"]
        SHADCN["Shadcn/ui\nTailwind CSS\nRecharts"]
        NC --> HTTP_CLIENT
        NC --> SHADCN
    end

    subgraph NEST_API["API REST — NestJS (puerto 4001)"]
        direction TB
        APP_MODULE["AppModule"]

        subgraph MODULES["Módulos de Negocio"]
            AUTH["AuthModule\nController · Service\nJWT Strategy\nPassport"]
            PATIENTS["PatientsModule\nController · Service"]
            ROUTINES["RoutinesModule\nController · Service"]
            EXERCISES["ExercisesModule\nController · Service"]
            SESSIONS["SessionsModule\nController · Service"]
            MOBILE["MobileModule\nController · Service\n(Endpoints para App)"]
            ANALYTICS["AnalyticsModule\nController · Service"]
            DASHBOARD["DashboardModule\nController · Service"]
        end

        subgraph INFRA["Infraestructura"]
            I18N["AppI18nModule\nnestjs-i18n\nes / en"]
            PRISMA["PrismaModule\nPrismaService\nPrisma ORM v5"]
            FILTER["I18nExceptionFilter\nManejo global de errores"]
        end

        APP_MODULE --> AUTH
        APP_MODULE --> PATIENTS
        APP_MODULE --> ROUTINES
        APP_MODULE --> EXERCISES
        APP_MODULE --> SESSIONS
        APP_MODULE --> MOBILE
        APP_MODULE --> ANALYTICS
        APP_MODULE --> DASHBOARD
        APP_MODULE --> I18N
        APP_MODULE --> PRISMA
        APP_MODULE --> FILTER

        AUTH --> PRISMA
        PATIENTS --> PRISMA
        ROUTINES --> PRISMA
        EXERCISES --> PRISMA
        SESSIONS --> PRISMA
        MOBILE --> PRISMA
        ANALYTICS --> PRISMA
        DASHBOARD --> PRISMA
    end

    DB[("PostgreSQL 15\nsymma_db")]

    HTTP_CLIENT -->|"REST API + Bearer JWT\npuerto 4001"| APP_MODULE
    PRISMA -->|"SQL / Prisma ORM"| DB
```

---

## 3. Diagrama de Componentes — Aplicación Móvil Android

El diagrama ilustra la arquitectura Clean Architecture de la aplicación Android. La regla de dependencia fluye en una sola dirección: la capa de Presentación depende de la capa de Dominio, y la capa de Datos implementa las interfaces definidas en el Dominio. El Core provee la infraestructura de inyección de dependencias (Hilt), la red (Retrofit) y la base de datos local (Room + SQLCipher). MediaPipe procesa los frames de la cámara completamente en el dispositivo, sin enviar video al servidor.

```mermaid
graph TD
    subgraph PRESENTATION["Capa de Presentación — Jetpack Compose + ViewModels"]
        direction LR
        MAIN["MainActivity\nNavHost\nHilt Entry Point"]
        SCREENS["Pantallas (Screens)\nLoginScreen\nHomeScreen\nCalibrationScreen\nPlayerScreen\nSummaryScreen"]
        VIEWMODELS["ViewModels\nAuthViewModel\nHomeViewModel\nCalibrationViewModel\nPlayerViewModel\nSummaryViewModel"]
        CAMERA_COMP["Componentes de Cámara\nCameraPreview\nFaceLandmarkerHelper\nFaceMeshOverlay"]
        MAIN --> SCREENS
        SCREENS --> VIEWMODELS
        SCREENS --> CAMERA_COMP
    end

    subgraph DOMAIN["Capa de Dominio — Interfaces y Modelos Puros (Kotlin)"]
        direction LR
        REPO_INTERFACES["Interfaces de Repository\nAuthRepository\nRoutineRepository\nSessionRepository\nCalibrationRepository"]
        DOMAIN_MODELS["Modelos de Dominio\nRoutine · RoutineItem\nSession · SessionItem\nCalibrationBaseline\nExerciseConfig"]
        STRATEGIES["Patrón Strategy — ExerciseStrategy\nSmileStrategy\nBrowsStrategy\nJawStrategy\nKissStrategy\nEyesStrategy\nEyesInverseStrategy"]
        USE_CASES["Use Cases\nSaveAndSyncSessionUseCase"]
        REPO_INTERFACES --- DOMAIN_MODELS
        DOMAIN_MODELS --- STRATEGIES
        STRATEGIES --- USE_CASES
    end

    subgraph DATA["Capa de Datos — Implementaciones y Fuentes"]
        direction LR
        REPO_IMPL["Implementaciones de Repository\nAuthRepositoryImpl\nRoutineRepositoryImpl\nSessionRepositoryImpl\nCalibrationRepositoryImpl"]
        REMOTE["Remote Data Source\nSymmaApiService (Retrofit)\nAuthInterceptor (JWT)"]
        LOCAL["Local Data Source (Room)\nRoutineDao\nSessionDao"]
        ENTITIES["Entidades Room\nRoutineEntity\nRoutineItemEntity\nSessionEntity\nSessionItemEntity"]
        MAPPERS["Mappers\nRoutineMapper\nSessionMapper"]
        REPO_IMPL --> REMOTE
        REPO_IMPL --> LOCAL
        LOCAL --> ENTITIES
        REPO_IMPL --> MAPPERS
    end

    subgraph CORE["Core — Infraestructura (Hilt Modules)"]
        direction LR
        NET_MODULE["NetworkModule (Hilt)\nRetrofit + OkHttp\nTokenManager"]
        DB_MODULE["DatabaseModule (Hilt)\nRoom Database\nSQLCipher"]
        WM_MODULE["WorkManagerModule (Hilt)\nSyncSessionsWorker"]
        MEDIAPIPE["FaceLandmarkerHelper\nMediaPipe Tasks Vision\n478 puntos faciales\n30 fps — On-Device"]
        NET_MODULE --- DB_MODULE
        DB_MODULE --- WM_MODULE
        WM_MODULE --- MEDIAPIPE
    end

    PRESENTATION -->|"depende de interfaces"| DOMAIN
    DATA -->|"implementa interfaces"| DOMAIN
    CORE -->|"provee infraestructura a"| DATA
    CORE -->|"provee MediaPipe a"| PRESENTATION

    REMOTE -->|"HTTPS REST + JWT"| API_EXT["API NestJS\npuerto 4001"]
    LOCAL -->|"SQLite / Room"| ROOM_DB[("Room DB\n(SQLCipher)")]
    WM_MODULE -->|"sincroniza sesiones\npendientes"| API_EXT
```

---

## 4. Flujo de una Sesión de Terapia

El diagrama de secuencia describe el ciclo de vida completo de una sesión de terapia, desde que el paciente abre la aplicación hasta que el terapeuta puede visualizar los resultados en el Portal Web. Se destacan los dos caminos posibles al terminar: sincronización exitosa inmediata y el mecanismo de reintento offline a través de WorkManager.

```mermaid
sequenceDiagram
    actor Paciente
    participant HomeScreen
    participant WorkManager as WorkManager (SyncSessionsWorker)
    participant API as API NestJS (puerto 4001)
    participant RoomDB as Room DB (SQLite + SQLCipher)
    participant CalibrationVM as CalibrationViewModel
    participant MediaPipe as FaceLandmarkerHelper (MediaPipe On-Device)
    participant PlayerVM as PlayerViewModel
    participant SummaryVM as SummaryViewModel
    participant PostgreSQL
    actor Terapeuta

    Paciente->>HomeScreen: Abre la aplicación
    HomeScreen->>RoomDB: Consulta rutina activa (RoutineDao)
    RoomDB-->>HomeScreen: Retorna Routine (offline)
    HomeScreen->>WorkManager: Programa sincronización en background
    WorkManager->>API: GET /mobile/routine (si hay red)
    API-->>WorkManager: Rutina actualizada (JSON)
    WorkManager->>RoomDB: Persiste rutina y ejercicios

    Paciente->>HomeScreen: Presiona "Iniciar Sesión"
    HomeScreen->>CalibrationVM: navega a CalibrationScreen (routineId)
    CalibrationVM->>RoomDB: Carga pasos de calibración desde rutina
    CalibrationVM->>MediaPipe: Solicita análisis de frames (30fps)
    MediaPipe-->>CalibrationVM: FaceLandmarkerResult (478 landmarks + blendshapes)

    Note over CalibrationVM,MediaPipe: POSITIONING: valida distancia y posición (1s hold)<br/>NEUTRAL_CAPTURE: 60 frames con rostro neutro<br/>ACTIVE_CAPTURE: 90 frames por gesto activo (P95)

    CalibrationVM->>RoomDB: saveBaseline(CalibrationBaseline)
    CalibrationVM-->>Paciente: "¡Calibración Completa!" — navega a PlayerScreen

    loop Por cada ejercicio en la rutina
        PlayerVM->>MediaPipe: Analiza frame de cámara
        MediaPipe-->>PlayerVM: blendshapes (ej: mouthSmileLeft, browInnerUp)
        PlayerVM->>PlayerVM: ExerciseStrategyFactory.getStrategy(module)
        PlayerVM->>PlayerVM: strategy.calculateScore(shapes, baseline, difficulty)
        PlayerVM-->>Paciente: Actualiza QualityBar + estado (GetReady → Exercise → Rest → Completed)
    end

    PlayerVM-->>Paciente: Todos los ejercicios completados
    Paciente->>SummaryVM: navega a SummaryScreen (routineId, duration)
    SummaryVM->>RoomDB: Guarda Session + SessionItems (is_synced = false)

    alt Hay conexión a internet
        SummaryVM->>API: POST /sessions (Session + resultados)
        API->>PostgreSQL: INSERT session, session_results
        PostgreSQL-->>API: OK (session.id)
        API-->>SummaryVM: 201 Created
        SummaryVM->>RoomDB: Marca sesión como is_synced = true
    else Sin conexión
        SummaryVM->>RoomDB: Sesión queda pendiente (is_synced = false)
        RoomDB-->>SummaryVM: Guardado local confirmado
        SummaryVM-->>Paciente: "Sesión guardada. Se sincronizará cuando haya conexión."
        Note over WorkManager,RoomDB: WorkManager detecta red disponible<br/>→ lee sesiones pendientes<br/>→ POST /sessions a la API<br/>→ actualiza is_synced = true
    end

    Terapeuta->>API: GET /patients/:id/sessions (Portal Web)
    API->>PostgreSQL: SELECT sessions WHERE patient_id = :id
    PostgreSQL-->>API: Historial de sesiones
    API-->>Terapeuta: Dashboard con progreso clínico (analytics)
```

---

## 5. Decisiones Arquitectónicas Clave

### 5.1 Monorepo con Turborepo y pnpm

El proyecto adopta una estrategia de monorepo gestionada con **Turborepo** (orchestrador de tareas) y **pnpm** (gestor de dependencias con workspaces). Esto permite compartir definiciones de tipos TypeScript (`packages/shared-types`) y el esquema Prisma (`packages/database`) entre el Backend y el Portal Web, eliminando la duplicación de contratos y reduciendo los errores de integración entre capas.

La aplicación Android se aloja de manera co-localizada en `apps/mobile/` para facilitar la generación de tipos y mantener la coherencia del repositorio, aunque el ecosistema de build de Android (Gradle) es independiente del pipeline de Node.js.

### 5.2 Estrategia Offline-First en la App Móvil

La aplicación adopta un modelo **offline-first** donde la base de datos Room (SQLite cifrada con SQLCipher) es la fuente de verdad local. El flujo de datos sigue el patrón:

1. El paciente puede realizar sesiones completas sin conexión a internet.
2. La rutina asignada se descarga previamente y se persiste en Room.
3. Al finalizar una sesión, los resultados se guardan localmente con `is_synced = false`.
4. **WorkManager** monitorea la conectividad y ejecuta `SyncSessionsWorker` cuando hay red disponible, enviando las sesiones pendientes a la API en lotes.
5. La autenticación offline se resuelve mediante un PIN local cifrado almacenado en Room.

### 5.3 Visión por Computadora On-Device con MediaPipe

El motor de Computer Vision utiliza **MediaPipe Tasks Vision** (FaceLandmarker) ejecutándose **completamente en el dispositivo Android**, sin transmitir video o imágenes al servidor. Esto tiene dos implicaciones fundamentales:

- **Privacidad:** No se almacena ningún video. Solo se persiste un snapshot fotográfico del mejor intento por ejercicio.
- **Latencia cero de red:** El análisis ocurre a 30 fps sobre el stream en vivo de la cámara frontal, extrayendo 52 blendshapes que representan la geometría facial (ej. `mouthSmileLeft`, `browInnerUp`, `eyeBlinkRight`).

El modelo FaceLandmarker opera con 478 puntos de referencia facial y entrega los blendshapes normalizados que alimentan directamente las estrategias de ejercicio.

### 5.4 Clean Architecture en Android

La aplicación móvil implementa Clean Architecture con tres capas y la regla de dependencia estricta (las capas externas dependen de las internas, nunca al revés):

| Capa | Responsabilidad | Tecnología |
|---|---|---|
| **Presentación** | UI reactiva, estado de pantalla | Jetpack Compose, ViewModel, StateFlow |
| **Dominio** | Reglas de negocio, interfaces de repositorio | Kotlin puro, sin dependencias Android |
| **Datos** | Acceso a red y base de datos local | Retrofit, Room, DataStore |

La inyección de dependencias es gestionada por **Hilt** (Dagger 2) a través de módulos declarativos (`NetworkModule`, `DatabaseModule`, `WorkManagerModule`, `RepositoryModule`).

### 5.5 Patrón Strategy para el Motor de Ejercicios

El núcleo del motor de rehabilitación implementa el **Patrón Strategy** para abstraer el algoritmo de puntuación de cada tipo de ejercicio facial. La interfaz `ExerciseStrategy` define un único método `calculateScore(shapes, baseline, difficulty): Float`, y cada ejercicio tiene su propia implementación concreta:

| Estrategia | Ejercicio | Blendshapes evaluados |
|---|---|---|
| `SmileStrategy` | Sonrisa simétrica | `mouthSmileLeft`, `mouthSmileRight` |
| `BrowsStrategy` | Elevación de cejas | `browInnerUp`, `browOuterUpLeft`, `browOuterUpRight` |
| `JawStrategy` | Apertura mandibular | `jawOpen` |
| `KissStrategy` | Fruncimiento de labios | `mouthPucker` |
| `EyesStrategy` | Cierre de ojos | `eyeBlinkLeft`, `eyeBlinkRight` |
| `EyesInverseStrategy` | Apertura asimétrica | `eyeBlinkLeft`, `eyeBlinkRight` (invertida) |

`ExerciseStrategyFactory` selecciona la estrategia correcta en tiempo de ejecución según el `MobileModule` del `RoutineItem`, permitiendo extender el catálogo de ejercicios sin modificar el código del `PlayerViewModel`. El score calculado se normaliza contra el `CalibrationBaseline` del paciente (valor P95 capturado al inicio de cada sesión), lo que personaliza el umbral de éxito a la capacidad motora individual de cada usuario.
