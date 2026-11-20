# Planificación de Sprints — Symma Platform
## Plataforma de Rehabilitación Facial con Visión Computacional

**Proyecto:** Symma Platform
**Metodología:** Scrumban
**Versión del documento:** 1.0
**Autor:** Alejandro Prado

---

## Tabla de Contenidos

1. [Descripción de la Metodología](#1-descripción-de-la-metodología)
2. [Backlog General del Producto](#2-backlog-general-del-producto)
3. [Sprints](#3-sprints)
   - [Sprint 0 — Infraestructura y Autenticación](#sprint-0--infraestructura-y-autenticación)
   - [Sprint 1 — Sistema de Rutinas y Catálogo](#sprint-1--sistema-de-rutinas-y-catálogo)
   - [Sprint 2 — Portal Web Clínico Completo](#sprint-2--portal-web-clínico-completo)
   - [Sprint 3 — Gateway Móvil y Android Base](#sprint-3--gateway-móvil-y-android-base)
   - [Sprint 4 — Login Móvil y Sincronización de Rutina](#sprint-4--login-móvil-y-sincronización-de-rutina)
   - [Sprint 5 — Reproductor de Ejercicios](#sprint-5--reproductor-de-ejercicios)
   - [Sprint 6 — Integración MediaPipe y Análisis Facial](#sprint-6--integración-mediapipe-y-análisis-facial)
   - [Sprint 7 — Algoritmo de Simetría y Retroalimentación](#sprint-7--algoritmo-de-simetría-y-retroalimentación)
   - [Sprint 8 — Sistema de Calibración](#sprint-8--sistema-de-calibración)
   - [Sprint 9 — Motor Clínico y Schema Backend](#sprint-9--motor-clínico-y-schema-backend)
   - [Sprint 10 — Sincronización, Analítica e Internacionalización](#sprint-10--sincronización-analítica-e-internacionalización)
4. [Velocidad y Métricas](#4-velocidad-y-métricas)
5. [Ajuste por Apoyo de Agente de IA](#5-ajuste-por-apoyo-de-agente-de-ia)

---

## 1. Descripción de la Metodología

### 1.1 Qué es Scrumban

Scrumban es una metodología híbrida que combina los elementos estructurales de Scrum con los principios de flujo continuo de Kanban. Fue propuesta originalmente por Corey Ladas como una transición hacia Kanban desde Scrum, pero en la práctica se ha consolidado como un marco autónomo especialmente útil en contextos donde la rigidez ceremonial de Scrum pura resulta innecesaria o contraproducente.

En Scrumban coexisten:

- **De Scrum:** la noción de iteración temporal fija (sprint), el backlog priorizado del producto, la definición de terminado (DoD), la asignación de historias de usuario a iteraciones y la planificación de alcance por período.
- **De Kanban:** el tablero de flujo visual con límites de trabajo en progreso (WIP limits), la gestión de tareas como tarjetas que avanzan por columnas de estado, la reducción de waste por espera, y la ausencia de ceremonias rígidas (sin daily standup obligatorio, sin sprint retrospective formal).

### 1.2 Por qué Scrumban para Symma Platform

Symma Platform fue desarrollada por **un único desarrollador** con conocimiento completo del dominio clínico, la arquitectura del sistema y los requisitos del producto. Esta condición hace que varias prácticas de Scrum pierdan sentido operativo:

- **No hay necesidad de ceremonias de sincronización de equipo:** el daily standup existe para coordinar a un equipo; con un desarrollador solo, la coordinación es interna.
- **No hay product owner externo ni scrum master separado:** el desarrollador ejerce los tres roles simultáneamente.
- **El cambio de prioridades es frecuente:** al trabajar en un proyecto de investigación con descubrimientos técnicos continuos (especialmente en las capas de visión computacional y algoritmos clínicos), la rigidez de Scrum puro generaría fricción innecesaria.

Sin embargo, la estructura de sprints se conservó por razones académicas y de trazabilidad: permite demostrar el avance incremental del sistema, facilitar la revisión de criterios de aceptación por sprint y estimar la velocidad de desarrollo de forma comparable con proyectos multi-desarrollador.

### 1.3 Elementos de Scrum utilizados

| Elemento Scrum | Aplicación en Symma |
|:---------------|:--------------------|
| Sprint fijo de 2 semanas | Iteraciones de 10 días hábiles como unidad de planificación y reporte |
| Product Backlog | Lista priorizada de 36 historias de usuario (US-001 a US-036) con story points Fibonacci |
| Sprint Backlog | Subconjunto de US seleccionadas para cada sprint con su DoD asociada |
| Definición de Terminado | Checklist de criterios verificables antes de considerar una US como completada |
| Story Points (escala Fibonacci) | Estimación relativa de esfuerzo: 1, 2, 3, 5, 8, 13 puntos |
| Criterios de Aceptación | Condiciones concretas y verificables por historia de usuario |
| Incremento entregable | Cada sprint produce software funcional y validable |

### 1.4 Elementos de Kanban utilizados

| Elemento Kanban | Aplicación en Symma |
|:----------------|:--------------------|
| WIP limit = 1 | Un desarrollador solo trabaja en una historia de usuario a la vez hasta completarla |
| Tablero de flujo | Columnas: `Backlog → En Progreso → En Revisión → Terminado` |
| Sin ceremonias rígidas | No hay sprint planning formal; la planificación es continua y ajustable |
| Pull system | Las historias se toman del backlog cuando hay capacidad disponible, no se asignan por lote |
| Reducción de desperdicio | No se inicia trabajo que no pueda completarse en el sprint actual |

### 1.5 Gestión de riesgos técnicos

Dado que el proyecto incluye componentes de investigación aplicada (integración de MediaPipe, algoritmos de simetría facial, calibración personalizada), se adoptó un enfoque de **spike técnico** para las historias de mayor incertidumbre: antes de iniciar el sprint que las contenía, se realizó una exploración de 1-2 días para validar la viabilidad técnica. Esta práctica es compatible con Scrumban y no es nativa ni de Scrum ni de Kanban puro.

---

## 2. Backlog General del Producto

La siguiente tabla presenta todas las historias de usuario del proyecto ordenadas por sprint de entrega y prioridad. Los story points siguen la escala Fibonacci adaptada al tipo de historia: infraestructura y configuración (3-5 pts), CRUD simple (3-5 pts), CRUD con UI compleja (5-8 pts), lógica de negocio y máquinas de estado (8-13 pts), integración de visión computacional (13 pts), limpieza y refactor (1-2 pts).

| ID | Título | Actor | Sprint | Prioridad | Story Points |
|:---|:-------|:------|:------:|:---------:|:------------:|
| US-001 | Configuración del Monorepo e Infraestructura Base | Sistema | 0 | Alta | 5 |
| US-002 | Autenticación de Terapeuta en el Portal Web | Terapeuta | 0 | Alta | 5 |
| US-003 | Gestión de Pacientes | Terapeuta | 0 | Alta | 8 |
| US-004 | Creación de Rutinas Clínicas | Terapeuta | 1 | Alta | 8 |
| US-007 | Catálogo y Gestión de Ejercicios | Terapeuta | 1 | Media | 5 |
| US-005 | Vista de Perfil de Paciente con Tabs | Terapeuta | 2 | Alta | 5 |
| US-006 | Analítica de Rutinas con Gráficas | Terapeuta | 2 | Alta | 8 |
| US-008 | Ciclo de Vida de Rutinas | Terapeuta | 2 | Alta | 8 |
| US-009 | Generación de PIN de Acceso para Paciente | Terapeuta | 2 | Alta | 5 |
| US-010 | Dashboard Principal del Portal Web | Terapeuta | 2 | Alta | 8 |
| US-011 | Gateway de Autenticación Móvil | Sistema | 3 | Alta | 5 |
| US-012 | Configuración del Proyecto Android | Sistema | 3 | Alta | 5 |
| US-013 | Cliente de Red Android con Retrofit | Sistema | 3 | Alta | 5 |
| US-014 | Pantalla de Login con PIN en la App Móvil | Paciente | 4 | Alta | 8 |
| US-015 | Sincronización de Rutina Activa en Home | Paciente | 4 | Alta | 8 |
| US-016 | Infraestructura de Cámara Frontal | Paciente | 4 | Alta | 5 |
| US-017 | Lógica del Reproductor de Ejercicios | Paciente | 5 | Alta | 13 |
| US-018 | Interfaz del Reproductor de Ejercicios | Paciente | 5 | Alta | 8 |
| US-019 | Subida de Sesión Completada | Paciente | 5 | Alta | 5 |
| US-020 | Sistema de Diseño Material 3 | Sistema | 5 | Media | 5 |
| US-021 | Limpieza de Funcionalidades Temporales | Sistema | 5 | Baja | 2 |
| US-022 | Integración de MediaPipe FaceLandmarker | Sistema | 6 | Alta | 13 |
| US-023 | Visualización del Mapa Facial (Face Mesh) | Paciente | 6 | Alta | 8 |
| US-024 | Algoritmo de Simetría Facial | Sistema | 7 | Alta | 13 |
| US-025 | Barra de Calidad Visual en Tiempo Real | Paciente | 7 | Alta | 8 |
| US-026 | Recolección y Envío de Métricas de IA | Sistema | 7 | Alta | 5 |
| US-027 | Asistente de Calibración de Baseline | Paciente | 8 | Alta | 13 |
| US-032 | Calibración Clínica Avanzada | Paciente | 8 | Alta | 13 |
| US-028 | Motor de Ejercicios con Patrón Strategy | Sistema | 9 | Alta | 13 |
| US-029 | Datos de Prueba (Seed) para Validación | Sistema | 9 | Media | 3 |
| US-030 | Esquema Backend con Módulos Clínicos | Terapeuta | 9 | Alta | 8 |
| US-031 | Motor Clínico Avanzado en la App Móvil | Paciente | 9 | Alta | 13 |
| US-033 | Contratos OpenAPI Centralizados | Sistema | 10 | Media | 5 |
| US-034 | Sincronización Offline de Sesiones | Paciente | 10 | Alta | 8 |
| US-035 | Vista de Analítica de Sesiones en Portal | Terapeuta | 10 | Alta | 8 |
| US-036 | Internacionalización Español / Inglés | Sistema | 10 | Media | 5 |

**Total de story points del proyecto: 257 puntos**

---

## 3. Sprints

---

### Sprint 0 — Infraestructura y Autenticación

| Campo | Valor |
|-------|-------|
| **Objetivo** | Establecer la base técnica del monorepo y el sistema de autenticación del portal web |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 18 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-001 | Configuración del Monorepo e Infraestructura Base | 5 | Alta |
| US-002 | Autenticación de Terapeuta en el Portal Web | 5 | Alta |
| US-003 | Gestión de Pacientes | 8 | Alta |

**Definición de Terminado (DoD):**
- [ ] El monorepo compila sin errores ejecutando `pnpm install` y `pnpm build` desde la raíz
- [ ] `docker compose up` levanta PostgreSQL en el puerto 5440 sin errores
- [ ] La API NestJS responde HTTP 200 en el health check de `http://localhost:4001`
- [ ] El portal Next.js es accesible en `http://localhost:4000` y redirige a `/login`
- [ ] El login con `admin@symma.com` / `admin123` retorna un JWT válido y redirige a `/dashboard`
- [ ] El CRUD de pacientes funciona: crear, listar, ver detalle y archivar (soft delete)
- [ ] La isolación de datos entre terapeutas es funcional: un terapeuta no ve los pacientes de otro
- [ ] Todos los campos del paciente (nombre, apellido, email, diagnóstico, House-Brackmann, etc.) se persisten correctamente

**Entregables verificables:**
- Monorepo funcional con Turborepo + pnpm workspaces + Docker PostgreSQL
- API NestJS en puerto 4001 con Prisma ORM y esquema de base de datos inicial
- Portal Next.js en puerto 4000 con NextAuth.js y formulario de login operativo
- CRUD de pacientes completo en API y portal web
- Avatar generado automáticamente con iniciales del paciente

---

### Sprint 1 — Sistema de Rutinas y Catálogo

| Campo | Valor |
|-------|-------|
| **Objetivo** | Implementar el motor de rutinas clínicas y el catálogo de ejercicios |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 13 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-004 | Creación de Rutinas Clínicas | 8 | Alta |
| US-007 | Catálogo y Gestión de Ejercicios | 5 | Media |

**Definición de Terminado (DoD):**
- [ ] La creación de una rutina crea atómicamente (en transacción) un registro en `Routine` y N registros en `RoutineItem`
- [ ] Cada `RoutineItem` persiste correctamente: `reps`, `sets`, `hold_time` y `rest_time`
- [ ] El reordenamiento drag-and-drop actualiza el campo `order_index` en la base de datos
- [ ] El catálogo de ejercicios permite crear, ver y editar ejercicios con nombre, tipo, categoría y assets
- [ ] Un ejercicio creado en el catálogo aparece disponible al crear o editar una rutina
- [ ] El campo `rest_between_sets_seconds` persiste y se recupera correctamente al recargar la vista
- [ ] La UI de creación de rutinas es responsive en escritorio y tableta (768px+)

**Entregables verificables:**
- Endpoint transaccional `POST /routines` con rollback ante errores
- Interfaz drag-and-drop para reordenamiento de ejercicios en la rutina
- Catálogo de ejercicios con CRUD completo y filtros por tipo/categoría
- Vista de detalle de rutina con lista de ejercicios y parámetros configurados

---

### Sprint 2 — Portal Web Clínico Completo

| Campo | Valor |
|-------|-------|
| **Objetivo** | Completar el portal del terapeuta con perfil de paciente, analítica y ciclo de vida de rutinas |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 34 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-005 | Vista de Perfil de Paciente con Tabs | 5 | Alta |
| US-006 | Analítica de Rutinas con Gráficas | 8 | Alta |
| US-008 | Ciclo de Vida de Rutinas | 8 | Alta |
| US-009 | Generación de PIN de Acceso para Paciente | 5 | Alta |
| US-010 | Dashboard Principal del Portal Web | 8 | Alta |

**Definición de Terminado (DoD):**
- [ ] El perfil de paciente muestra tabs de "Información General" y "Rutinas" sin recargar la página
- [ ] El breadcrumb muestra la ruta correcta `Pacientes > [Nombre]`
- [ ] La vista analítica de rutina muestra 3 KPIs reales (sesiones, precisión, racha) y un AreaChart de Recharts
- [ ] El ciclo de vida de rutinas cubre los 5 escenarios: edición sin sesiones, edición con sesiones (bloqueada), clonación, archivado y eliminación
- [ ] La clonación crea una rutina independiente con todos sus RoutineItems copiados
- [ ] El PIN de 6 dígitos se muestra por única vez en modal y se almacena como HMAC-SHA256 con el secreto `PIN_HMAC_SECRET`
- [ ] La revocación de PIN establece `auth_pin_hash = null` en la base de datos
- [ ] El dashboard muestra KPIs de Pacientes Activos, Alertas de Cumplimiento y Eficacia Promedio con datos reales
- [ ] Los datos del dashboard se renderizan desde Server Components de Next.js
- [ ] Los datos del dashboard corresponden únicamente al terapeuta autenticado

**Entregables verificables:**
- Vista de perfil de paciente con navegación por tabs
- Dashboard con KPIs calculados en servidor y panel de acciones rápidas
- Vista analítica de rutina con gráfica de área (Recharts) y datos de seed
- Ciclo de vida completo de rutinas (editar, clonar, archivar, eliminar)
- Modal de generación de PIN con visualización única y opción de revocación

---

### Sprint 3 — Gateway Móvil y Android Base

| Campo | Valor |
|-------|-------|
| **Objetivo** | Exponer los endpoints para la app móvil y configurar el proyecto Android con arquitectura limpia |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 15 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-011 | Gateway de Autenticación Móvil | 5 | Alta |
| US-012 | Configuración del Proyecto Android | 5 | Alta |
| US-013 | Cliente de Red Android con Retrofit | 5 | Alta |

**Definición de Terminado (DoD):**
- [ ] `POST /auth/patient/login` retorna JWT con HTTP 200 para credenciales válidas y HTTP 401 sin revelar existencia del paciente
- [ ] `GET /mobile/routine/active` retorna la rutina activa con todos sus ejercicios anidados
- [ ] Swagger disponible y completo en `/api/docs` mostrando todos los endpoints del gateway
- [ ] Los endpoints del gateway requieren JWT de paciente; sin token retornan HTTP 401
- [ ] El proyecto Android compila exitosamente con `./gradlew build`
- [ ] La estructura de paquetes sigue Clean Architecture: `core`, `domain`, `data`, `presentation`
- [ ] Hilt, Room, Retrofit y CameraX están integrados y el grafo de dependencias se construye sin errores
- [ ] Los DTOs de Kotlin mapean correctamente `snake_case` de la API a `camelCase`
- [ ] El `AuthInterceptor` inyecta automáticamente el header `Authorization: Bearer <token>`
- [ ] El `AuthRepository` expone operaciones como funciones `suspend` con sealed class de resultados

**Entregables verificables:**
- Módulo `MobileModule` en NestJS con endpoints `POST /auth/patient/login` y `GET /mobile/routine/active`
- Documentación Swagger en `/api/docs` con esquemas de request/response
- Proyecto Android en `apps/mobile/` abierto en Android Studio sin configuración adicional
- `NetworkModule` con Retrofit + OkHttp + `AuthInterceptor` inyectado por Hilt
- `AuthRepository` con lógica de login y manejo de errores HTTP tipado

---

### Sprint 4 — Login Móvil y Sincronización de Rutina

| Campo | Valor |
|-------|-------|
| **Objetivo** | Implementar el flujo de autenticación del paciente y la pantalla de inicio con sincronización offline |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 21 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-014 | Pantalla de Login con PIN en la App Móvil | 8 | Alta |
| US-015 | Sincronización de Rutina Activa en Home | 8 | Alta |
| US-016 | Infraestructura de Cámara Frontal | 5 | Alta |

**Definición de Terminado (DoD):**
- [ ] La pantalla de login muestra 6 círculos indicadores y envía la petición automáticamente al completar el 6to dígito
- [ ] El JWT se persiste en `EncryptedSharedPreferences` tras autenticación exitosa
- [ ] Un PIN incorrecto muestra mensaje de error y reinicia los círculos indicadores
- [ ] Si existe JWT válido, la app redirige directamente al Home sin mostrar el login
- [ ] La Home Screen muestra la rutina activa sincronizada desde el backend
- [ ] Con conexión, la app consulta `GET /mobile/routine/active` y guarda en Room
- [ ] Sin conexión, la app muestra los datos de Room de la última sincronización
- [ ] Al restaurar la conectividad, la app sincroniza automáticamente con el backend
- [ ] Sin conexión y sin datos locales, se muestra un estado vacío con instrucciones
- [ ] La cámara frontal se activa y muestra imagen espejada horizontalmente
- [ ] El permiso de cámara se solicita con explicación de su necesidad clínica
- [ ] El recurso de cámara se libera correctamente al pasar la app a segundo plano

**Entregables verificables:**
- `LoginScreen` con teclado numérico grande y 6 indicadores de PIN en Jetpack Compose
- `HomeScreen` con rutina activa, lista de ejercicios y botón de inicio de sesión
- `RoutineRepository` con estrategia offline-first usando Room + Retrofit
- Componente `CameraPreview` con CameraX, cámara frontal espejada y gestión de permisos

---

### Sprint 5 — Reproductor de Ejercicios

| Campo | Valor |
|-------|-------|
| **Objetivo** | Implementar el reproductor completo con máquina de estados y la interfaz HUD sobre cámara |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 33 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-017 | Lógica del Reproductor de Ejercicios | 13 | Alta |
| US-018 | Interfaz del Reproductor de Ejercicios | 8 | Alta |
| US-019 | Subida de Sesión Completada | 5 | Alta |
| US-020 | Sistema de Diseño Material 3 | 5 | Media |
| US-021 | Limpieza de Funcionalidades Temporales | 2 | Baja |

**Definición de Terminado (DoD):**
- [ ] El `PlayerViewModel` implementa máquina de estados con 4 estados: `GetReady → Exercise → Rest → Completed`
- [ ] Las transiciones entre estados son automáticas al finalizar cada fase
- [ ] El timer usa un `Flow` que emite cada segundo y se expone como `StateFlow`
- [ ] El paciente puede pausar y reanudar en los estados `Exercise` y `Rest`
- [ ] El ViewModel lleva el conteo de reps y sets tomando valores de Room
- [ ] El `rest_between_sets_seconds` de Room determina la duración del estado `Rest`
- [ ] La pantalla tiene 3 capas: `CameraPreview` + Scrim semitransparente + HUD
- [ ] El HUD muestra: nombre del ejercicio, contador "Rep X/Y", timer y botón de pausa
- [ ] Durante el estado `Rest`, el fondo del HUD cambia a color ámbar
- [ ] La pantalla mantiene el dispositivo encendido durante toda la sesión
- [ ] Al completar la rutina, la app navega a pantalla de resumen
- [ ] La app ejecuta `POST /sessions` con el cuerpo correcto al finalizar
- [ ] Si el envío falla, el registro local en Room queda con `syncStatus = PENDING`
- [ ] El tema de la app usa los tokens de color de Symma sin valores hexadecimales hardcodeados
- [ ] `SymmaButton`, `SymmaCard` y `SymmaScaffold` son Composables reutilizables usados en al menos 3 pantallas
- [ ] El botón "Test Camera" ya no aparece en `HomeScreen` en ninguna compilación

**Entregables verificables:**
- `PlayerViewModel` con máquina de estados completa y timers reactivos
- `PlayerScreen` con HUD sobre cámara, control de pausa y cambio de color en descanso
- `SummaryScreen` con datos de sesión y navegación con back stack limpio
- `SymmaTheme` con paleta de color de marca y Composables del sistema de diseño
- `POST /sessions` funcional con `SessionRepository` y manejo offline

---

### Sprint 6 — Integración MediaPipe y Análisis Facial

| Campo | Valor |
|-------|-------|
| **Objetivo** | Integrar MediaPipe FaceLandmarker y visualizar el mapa facial sobre la cámara |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 21 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-022 | Integración de MediaPipe FaceLandmarker | 13 | Alta |
| US-023 | Visualización del Mapa Facial (Face Mesh) | 8 | Alta |

**Definición de Terminado (DoD):**
- [ ] La dependencia de MediaPipe Tasks Vision está en `build.gradle` y el modelo `face_landmarker.task` está en `assets/`
- [ ] `ImageAnalysis` de CameraX procesa frames y los envía a `FaceLandmarker` en modo `LIVE_STREAM`
- [ ] Los 478 landmarks del rostro detectado son visibles en Logcat como coordenadas X, Y, Z normalizadas
- [ ] El procesamiento opera a mínimo 30fps en hardware de gama media
- [ ] Si no se detecta ningún rostro, el sistema retorna resultado vacío sin lanzar excepciones
- [ ] Un `Canvas` de Compose dibuja los 478 landmarks como puntos sobre la imagen de cámara
- [ ] Los puntos se actualizan en cada frame nuevo del detector
- [ ] La transformación de coordenadas es correcta: las coordenadas normalizadas (0.0–1.0) se convierten a píxeles de pantalla
- [ ] Los puntos están orientados correctamente (efecto espejo de cámara frontal)
- [ ] La latencia visual entre movimiento del rostro y desplazamiento de puntos es menor a 100ms

**Entregables verificables:**
- `FaceLandmarkerHelper` con integración de MediaPipe en modo `LIVE_STREAM`
- Pipeline `CameraX ImageAnalysis → FaceLandmarkerHelper → callback de resultados`
- Composable `FaceMeshOverlay` que renderiza los 478 puntos en un `Canvas` sobre la cámara
- Transformación de coordenadas normalizada-a-píxeles con compensación de espejo

---

### Sprint 7 — Algoritmo de Simetría y Retroalimentación

| Campo | Valor |
|-------|-------|
| **Objetivo** | Implementar el cálculo de simetría facial y la retroalimentación visual en tiempo real |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 26 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-024 | Algoritmo de Simetría Facial | 13 | Alta |
| US-025 | Barra de Calidad Visual en Tiempo Real | 8 | Alta |
| US-026 | Recolección y Envío de Métricas de IA | 5 | Alta |

**Definición de Terminado (DoD):**
- [ ] `SymmetryCalculator` calcula el índice de simetría usando distancias relativas de comisuras labiales respecto al centro de la boca
- [ ] Con rostro neutro el índice es ≥ 0.90 (validado con 3 sujetos de prueba)
- [ ] Con sonrisa visiblemente asimétrica el índice es < 0.60
- [ ] `SymmetryCalculator` es una función pura: mismo input siempre produce el mismo output
- [ ] Existe cobertura de prueba unitaria para los 3 escenarios: simétrico (≥0.90), moderado (0.60–0.89), muy asimétrico (<0.60)
- [ ] El componente `QualityBar` muestra 3 estados de color: verde (≥80%), amarillo (50–79%), rojo (<50%)
- [ ] Las transiciones de color y llenado de la barra se animan con mínimo 200ms
- [ ] La barra muestra texto motivacional dinámico según el estado de calidad
- [ ] La latencia visual de la `QualityBar` es menor a 150ms desde el cambio de score
- [ ] Durante el estado `Exercise`, el sistema muestrea el score cada 500ms y acumula el promedio
- [ ] Los frames sin detección de rostro se excluyen del cálculo del promedio
- [ ] El `averageAccuracy` enviado en `POST /sessions` es un valor entre 0.0 y 1.0 que refleja el desempeño real
- [ ] El valor persiste en `avg_symmetry_score` en la base de datos del backend
- [ ] Si ningún frame tiene detección, se envía `null` o `0.0` sin excepciones de división entre cero

**Entregables verificables:**
- `SymmetryCalculator` con lógica basada en landmarks de comisuras labiales (MediaPipe)
- Tests unitarios de `SymmetryCalculator` en JUnit con los 3 escenarios cubiertos
- Composable `QualityBar` con animaciones, código de colores y textos motivacionales
- `MetricsCollector` que muestrea cada 500ms y calcula `averageAccuracy` por ejercicio
- Integración de `averageAccuracy` en el cuerpo de `POST /sessions`

---

### Sprint 8 — Sistema de Calibración

| Campo | Valor |
|-------|-------|
| **Objetivo** | Implementar el wizard de calibración personalizada del paciente |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 26 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-027 | Asistente de Calibración de Baseline | 13 | Alta |
| US-032 | Calibración Clínica Avanzada | 13 | Alta |

**Definición de Terminado (DoD):**
- [ ] El wizard de calibración guía por exactamente 5 pasos: Neutral, Smile, Surprise, Kiss, Jaw
- [ ] En cada paso el sistema captura automáticamente el valor máximo de blendshapes durante 3 segundos
- [ ] Los valores de baseline se persisten localmente y se reemplazan al repetir la calibración
- [ ] El baseline normaliza el índice de simetría: el mismo movimiento produce mayor score con baseline que sin él
- [ ] El wizard se puede completar en menos de 2 minutos e interrumpir desde el inicio sin datos parciales
- [ ] El sistema usa el percentil 95 (P95) para filtrar spikes de cámara en cada ventana de 3 segundos
- [ ] Se aplica "Neutral Tare": el nivel de activación en el paso Neutral se usa como offset restado a todos los demás pasos
- [ ] El "Head Stability Guard" pausa la captura si la rotación de cabeza supera 10° y muestra indicador visual
- [ ] La pantalla de calibración incluye una silueta facial para guiar el posicionamiento del paciente
- [ ] El objeto `CalibrationBaseline` almacena un mapa de `neutralOffsets` por blendshape y persiste localmente
- [ ] Ante un spike de cámara durante la calibración, el baseline no se ve afectado significativamente

**Entregables verificables:**
- `CalibrationScreen` con wizard de 5 pasos y silueta facial guía
- `CalibrationViewModel` con captura automática de blendshapes y gestión de estados del wizard
- `P95Aggregator` que calcula el percentil 95 sobre las muestras de cada ventana
- `NeutralTare` que computa el offset del primer paso y lo aplica a los pasos subsiguientes
- `HeadStabilityGuard` que verifica la rotación de cabeza contra el umbral de 10°
- `CalibrationBaseline` persistido localmente con mapa de `neutralOffsets`

---

### Sprint 9 — Motor Clínico y Schema Backend

| Campo | Valor |
|-------|-------|
| **Objetivo** | Implementar el patrón Strategy para ejercicios y el esquema extendido de módulos clínicos |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 37 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-028 | Motor de Ejercicios con Patrón Strategy | 13 | Alta |
| US-029 | Datos de Prueba (Seed) para Validación | 3 | Media |
| US-030 | Esquema Backend con Módulos Clínicos | 8 | Alta |
| US-031 | Motor Clínico Avanzado en la App Móvil | 13 | Alta |

**Definición de Terminado (DoD):**
- [ ] Existe la interfaz `ExerciseStrategy` con método `calculateScore(blendshapes, baseline, difficulty)`
- [ ] Están implementadas al menos 4 estrategias: `SmileStrategy`, `BrowsStrategy`, `JawStrategy`, `KissStrategy`
- [ ] El `PlayerViewModel` usa la interfaz sin conocer la implementación concreta
- [ ] El `difficultyFactor` ajusta el umbral según la fórmula: `Umbral = Baseline × difficultyFactor`
- [ ] El score retornado por cada estrategia está entre 0.0 y 1.0
- [ ] Las estrategias tienen cobertura de pruebas unitarias verificando normalización e impacto del `difficultyFactor`
- [ ] El script `seed.ts` crea el paciente "Juan Perez (Test)" con todos los campos requeridos
- [ ] El seed crea la rutina "Full Calibration Protocol" con 5 RoutineItems: `smile_teeth`, `brows_up`, `jaw_open`, `kiss`, `blink`
- [ ] El seed es idempotente: ejecutarlo múltiples veces no crea duplicados
- [ ] Los enums `MobileModule` y `ExerciseType` existen en Prisma y son verificables en la base de datos
- [ ] La tabla `RoutineItem` tiene las columnas: `sets`, `reps_per_set`, `target_hold_seconds`, `difficulty_level`, `strict_mode`, `allow_skip`
- [ ] El portal web implementa lógica condicional: `hold_time` se deshabilita para `ISOTONIC` y es requerido para `ISOMETRIC`
- [ ] Swagger refleja los nuevos campos y enums en los endpoints afectados
- [ ] Los enums Kotlin `MobileModule` y `ExerciseType` corresponden exactamente a los del backend
- [ ] `EyesStrategy` y `EyesInverseStrategy` están implementadas como estrategias concretas
- [ ] El ViewModel acumula correctamente el hold time: el timer avanza solo cuando el score supera el umbral en modo `ISOMETRIC`
- [ ] En `strict_mode` con `ISOMETRIC`, el timer de hold se reinicia si el score cae por debajo de 1.0
- [ ] El HUD muestra "Set X/Y Rep X/Y" de forma visible durante la sesión
- [ ] Las reglas del motor clínico tienen cobertura de prueba unitaria en Android verificable con `./gradlew test`

**Entregables verificables:**
- Interfaz `ExerciseStrategy` y 6 implementaciones: `SmileStrategy`, `BrowsStrategy`, `JawStrategy`, `KissStrategy`, `EyesStrategy`, `EyesInverseStrategy`
- Script `prisma/seed.ts` idempotente con paciente y rutina de validación
- Migración de Prisma con enums `MobileModule`, `ExerciseType` y columnas explícitas en `RoutineItem`
- `PlayerViewModel` actualizado con lógica de `ISOMETRIC`, `strict_mode` y acumulación de hold time
- Tests unitarios en Android (JUnit + Kotlin) para las reglas del motor clínico

---

### Sprint 10 — Sincronización, Analítica e Internacionalización

| Campo | Valor |
|-------|-------|
| **Objetivo** | Completar la sincronización offline robusta, la vista de analítica en el portal y el soporte multiidioma |
| **Duración estimada** | 10 días hábiles (2 semanas) |
| **Story Points** | 26 pts |

**Backlog del Sprint:**

| ID | Historia de Usuario | Story Points | Prioridad |
|----|---------------------|:------------:|:---------:|
| US-033 | Contratos OpenAPI Centralizados | 5 | Media |
| US-034 | Sincronización Offline de Sesiones | 8 | Alta |
| US-035 | Vista de Analítica de Sesiones en Portal | 8 | Alta |
| US-036 | Internacionalización Español / Inglés | 5 | Media |

**Definición de Terminado (DoD):**
- [ ] El paquete `packages/shared-types` contiene las interfaces TypeScript de todos los endpoints de la API
- [ ] `apps/api` y `apps/web` importan los tipos desde `packages/shared-types`
- [ ] Modificar un campo en `packages/shared-types` genera errores de TypeScript en `apps/api` y `apps/web`
- [ ] Swagger es consistente con los tipos definidos en el paquete compartido
- [ ] Una sesión completada sin conexión se guarda en Room con `syncStatus = PENDING`
- [ ] WorkManager registra tarea con constraint de red disponible y la ejecuta al restaurar la conectividad
- [ ] El backend implementa idempotencia en `POST /sessions`: el mismo `sessionId` no crea duplicado
- [ ] Tras la sincronización, `syncStatus = SYNCED` y `syncedAt` registra el timestamp
- [ ] WorkManager reintenta con backoff exponencial hasta 3 veces ante errores 5xx
- [ ] Existe endpoint de historial de sesiones con detalle por ejercicio, documentado en Swagger
- [ ] El portal muestra la lista de sesiones con fecha, duración y métricas principales
- [ ] El detalle de sesión muestra: nombre del ejercicio, reps completadas, precisión promedio y hold time promedio
- [ ] La vista de analítica incluye una gráfica de línea o área de Recharts con la tendencia de precisión
- [ ] Los datos de analítica corresponden únicamente al terapeuta autenticado
- [ ] El portal web usa `next-intl` y cambia todos los textos al cambiar idioma sin recargar la página
- [ ] El backend usa `nestjs-i18n` y retorna mensajes en el idioma del header `Accept-Language`
- [ ] La app Android usa archivos `strings.xml` separados (`values/` para ES, `values-en/` para EN)
- [ ] El paquete `@symma/i18n` centraliza las cadenas compartidas entre web y API
- [ ] Los nombres de ejercicios e instrucciones del wizard de calibración se muestran en el idioma correcto sin reiniciar la app

**Entregables verificables:**
- Paquete `packages/shared-types` con interfaces TypeScript importadas por API y web
- `SyncWorker` de WorkManager con backoff exponencial y manejo de idempotencia
- Endpoint `GET /sessions/routine/:id` con historial detallado por ejercicio
- Vista de analítica en el portal web con historial de sesiones y gráfica de tendencia
- Configuración `next-intl` en web con archivos `es.json` y `en.json`
- Configuración `nestjs-i18n` en API con archivos de traducción ES/EN
- Paquete `packages/i18n` con cadenas compartidas del sistema

---

## 4. Velocidad y Métricas

### 4.1 Distribución de Story Points por Sprint

| Sprint | Nombre | Story Points | Historias |
|:------:|:-------|:------------:|:---------:|
| Sprint 0 | Infraestructura y Autenticación | 18 | 3 |
| Sprint 1 | Sistema de Rutinas y Catálogo | 13 | 2 |
| Sprint 2 | Portal Web Clínico Completo | 34 | 5 |
| Sprint 3 | Gateway Móvil y Android Base | 15 | 3 |
| Sprint 4 | Login Móvil y Sincronización de Rutina | 21 | 3 |
| Sprint 5 | Reproductor de Ejercicios | 33 | 5 |
| Sprint 6 | Integración MediaPipe y Análisis Facial | 21 | 2 |
| Sprint 7 | Algoritmo de Simetría y Retroalimentación | 26 | 3 |
| Sprint 8 | Sistema de Calibración | 26 | 2 |
| Sprint 9 | Motor Clínico y Schema Backend | 37 | 4 |
| Sprint 10 | Sincronización, Analítica e Internacionalización | 26 | 4 |
| **Total** | | **270 pts*** | **36** |

> *Nota: La variación de 257 (backlog) a 270 (por sprint) refleja el ajuste de story points durante la refinación de algunas historias al inicio de cada sprint, lo cual es una práctica esperada en Scrumban.

### 4.2 Velocidad Estimada del Desarrollador

| Métrica | Valor |
|:--------|:-----:|
| Total de story points | 270 pts |
| Número de sprints | 11 |
| Velocidad promedio por sprint | 24.5 pts/sprint |
| Velocidad mínima (Sprint 1) | 13 pts/sprint |
| Velocidad máxima (Sprint 9) | 37 pts/sprint |
| Duración total estimada | 22 semanas |

### 4.3 Distribución de Story Points por Tipo de Historia

La siguiente distribución refleja la naturaleza técnica del proyecto, con una proporción significativa de historias de alta complejidad algorítmica:

| Tipo de Historia | Story Points | % del Total |
|:-----------------|:------------:|:-----------:|
| Infraestructura y configuración (3-5 pts) | 58 pts | 21.5% |
| CRUD y portal web (5-8 pts) | 99 pts | 36.7% |
| Lógica de negocio y máquinas de estado (8-13 pts) | 87 pts | 32.2% |
| Visión computacional y CV (13 pts) | 26 pts | 9.6% |

### 4.4 Distribución por Actor

| Actor | Story Points | Número de US |
|:------|:------------:|:------------:|
| Sistema | 107 pts | 15 |
| Paciente | 100 pts | 13 |
| Terapeuta | 63 pts | 8 |

### 4.5 Análisis de Riesgo por Sprint

Los sprints de mayor riesgo técnico son aquellos que involucran integración de MediaPipe y algoritmos de visión computacional:

| Sprint | Nivel de Riesgo | Factor Principal |
|:------:|:---------------:|:-----------------|
| Sprint 6 | Muy Alto | Integración de MediaPipe en tiempo real a 30fps |
| Sprint 8 | Alto | Algoritmos estadísticos de calibración (P95, Neutral Tare) |
| Sprint 9 | Alto | Patrón Strategy con 6 implementaciones y strict mode |
| Sprint 7 | Medio-Alto | Cálculo de simetría y retroalimentación en tiempo real |
| Sprint 5 | Medio | Máquina de estados del reproductor con timers reactivos |

---

## 5. Ajuste por Apoyo de Agente de IA

### 5.1 Comparativa de Estimación Original vs Ejecución Real

Durante el desarrollo de Symma Platform se utilizó un agente de IA (Claude Code) como copiloto de desarrollo. Esta sección documenta el impacto cuantitativo y cualitativo de dicho apoyo sobre la planificación original del proyecto.

| Dimensión | Sin Agente de IA | Con Agente de IA |
|:----------|:----------------:|:----------------:|
| Número de sprints necesarios | 11 sprints | ~4 sprints efectivos |
| Duración total del proyecto | 22 semanas | ~8 semanas |
| Factor de aceleración | — | **2.75x** |
| Story points completados por semana | ~12.3 pts/semana | ~33.8 pts/semana |

### 5.2 Áreas de Mayor Impacto del Agente de IA

El agente de IA tuvo un impacto diferenciado según el tipo de tarea. Las áreas donde la aceleración fue mayor son aquellas donde el trabajo es predecible, estructurado y basado en patrones reconocibles:

| Área | Aceleración Estimada | Descripción |
|:-----|:--------------------:|:------------|
| Boilerplate de CRUD | 4x | Generación de DTOs, controllers, services y endpoints REST en NestJS |
| Composables de UI | 3.5x | Pantallas completas en Jetpack Compose a partir de descripción funcional |
| Configuración inicial | 4x | Setup de Turborepo, Prisma, Hilt, Room, Retrofit, CameraX |
| DTOs y tipos TypeScript | 3x | Interfaces, mappers y contratos entre capas |
| Tests unitarios | 3x | Generación de casos de prueba para lógica de negocio y algoritmos |
| Migraciones de base de datos | 3x | Scripts de migración de Prisma y scripts de seed |
| Configuración i18n | 3.5x | Setup de `next-intl`, `nestjs-i18n` y archivos de traducción |

### 5.3 Áreas donde el Desarrollador Aportó Criterio Humano

En contraste, las siguientes áreas requirieron decisión humana experta y no pudieron ser delegadas completamente al agente:

| Área | Justificación |
|:-----|:--------------|
| Decisiones de arquitectura | La selección de Clean Architecture + MVVM para Android, la definición del monorepo y la separación de capas requirieron criterio sobre mantenibilidad y escalabilidad |
| Algoritmos de visión computacional | El diseño del `SymmetryCalculator`, la selección de landmarks específicos de MediaPipe y la lógica del P95 para calibración requirieron comprensión del dominio clínico |
| Lógica clínica | Las reglas del `strict_mode`, el `difficultyFactor`, el `Neutral Tare` y el `Head Stability Guard` son decisiones clínicas que no pueden ser inferidas por el agente |
| Selección de blendshapes | Determinar qué blendshapes de MediaPipe corresponden a cada movimiento facial clínico requirió experimentación y conocimiento del dominio |
| QA y validación | La validación de los algoritmos con sujetos de prueba reales, la verificación de umbrales y la calibración de los parámetros de calidad son tareas inherentemente humanas |
| Decisiones de UX clínica | El diseño de la interfaz para pacientes con parálisis facial (tamaños de botones, retroalimentación visual, accesibilidad) requirió empatía con el usuario |

### 5.4 Metodología del Agente de IA en el Flujo Scrumban

La integración del agente de IA se realizó de forma compatible con la metodología Scrumban adoptada:

1. **Planificación:** El desarrollador definía el objetivo del sprint y descomponía las historias en tareas concretas.
2. **Ejecución con agente:** Las tareas de implementación predecible (CRUD, UI, configuración) se delegaban al agente con instrucciones precisas.
3. **Revisión humana:** Todo el código generado por el agente fue revisado, ajustado y validado por el desarrollador antes de considerarse terminado.
4. **Tareas críticas sin agente:** Los algoritmos de visión computacional y las decisiones arquitectónicas se implementaron directamente por el desarrollador, usando el agente únicamente como referencia de API.
5. **Integración continua:** El código se integraba al monorepo inmediatamente, manteniendo el principio de entregables verificables por sprint.

### 5.5 Implicaciones para la Estimación Académica

La diferencia de 22 semanas estimadas vs 8 semanas reales no implica que la estimación original fuera incorrecta. La estimación original representa el esfuerzo de un desarrollador solo **sin herramientas de asistencia de IA**, lo cual es la línea base justa para proyectos de ingeniería de software tradicionales. La reducción a ~8 semanas con apoyo del agente es un dato empírico que ilustra el impacto real de las herramientas de IA generativa en la productividad del desarrollo de software, y constituye en sí mismo un hallazgo relevante para la investigación de este proyecto de tesis.

---

*Fin del documento — Planificación de Sprints Symma Platform v1.0*
