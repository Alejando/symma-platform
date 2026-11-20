# Tickets de cumplimiento — Symma Platform

Lista de trabajo derivada del análisis "lo que promete la tesis vs. lo que hace el código" (auditoría del 2026-11-18 contra `docs/requerimientos-funcionales.md`, `docs/requerimientos-no-funcionales.md` y `docs/thecnical_brief.md`).

**Última actualización:** 2026-11-19

## Cómo usar este documento

- El **estado** de cada ticket vive solo en la tabla índice; el detalle de abajo no lo repite.
- Estados: `Pendiente` · `En progreso` · `Hecho` · `Bloqueado` · `Descartado`.
- Prioridad: **P0** invalida datos clínicos o expone datos de pacientes · **P1** promesa central incumplida · **P2** promesa secundaria o deuda · **P3** limpieza.
- "Decisión" marca tickets donde primero hay que elegir entre cambiar el código o cambiar la tesis.
- Las líneas citadas son las de la auditoría; pueden desplazarse al editar.

Abreviaturas de rutas:

- `api/` = `apps/api/src/`
- `web/` = `apps/web/src/`
- `mobile/` = `apps/mobile/app/src/main/java/com/symma/app/`

## Decisiones tomadas (2026-11-19)

| Ticket | Decisión |
|---|---|
| SYM-003 | El login del paciente sigue siendo solo PIN, con límite de intentos; RF-035 se corrige. El PIN se guarda con HMAC con secreto (SYM-004). |
| SYM-008 | Se calcula simetría real izquierda/derecha y se envía como métrica aparte de `averageAccuracy`. |
| SYM-012 | La escala única de `averageAccuracy` es 0–100 en contrato y base de datos. |
| SYM-020 | Se cambia el código: ventana de calibración de 3 s y wizard de 5 pasos, como dice la documentación. |
| SYM-021 | Se implementa: la calibración se cifra en el dispositivo y se envía al backend con la sesión. |
| SYM-032 | Se agrega el estado DRAFT; el clon queda en borrador hasta que el terapeuta lo activa. |
| SYM-041 | Se implementa: SQLCipher y autenticación offline. |
| SYM-042 | Se implementa: almacenamiento S3 y snapshot del mejor intento. |
| SYM-045 | Se implementa: solo ADMIN modifica el catálogo global. |
| SYM-013 | Máximo 3 intentos de sincronización en total (RF-060), no 3 reintentos. |
| SYM-018 | El ángulo de la cabeza se mide en absoluto respecto a la cámara, no contra la pose inicial. |
| SYM-028 | El JWT de la API deja de ser accesible desde JS del cliente: las llamadas pasan por el servidor de Next. |

## Fase 2 (2026-11-19, sin commitear)

Trabajo hecho sobre las decisiones de arriba. Verificado: API 131 unitarias y 117 e2e; web 107 tests; móvil 280 tests; portal probado en vivo contra la API real en una base aparte.

Lo que mantiene tickets en `En progreso`:

| Ticket | Qué falta |
|---|---|
| SYM-008 | Probar la simetría con rostros reales. RF-052 describe una barra en vivo coloreada por simetría; la barra muestra progreso del gesto y la simetría aparece en el resumen. |
| SYM-020 | RF-053 documenta 5 pasos; las rutinas con módulos de ojos agregan 1 o 2 pasos más. Decidir si se documentan 7 pasos. |
| SYM-025, SYM-036, SYM-037 | Comprobación en dispositivo (idiomas, vibración y tonos, medición de fps). |
| SYM-034 | Parte móvil: tests de `TokenManager`, `syncRoutine()` en `HomeViewModelTest`, errores de MediaPipe, k6 y tests instrumentados. |
| SYM-039 | Decidir si el backend expondrá `engageThreshold`/`releaseThreshold`. |
| SYM-041 | Probar en dispositivo la migración a SQLCipher y el desbloqueo biométrico. |
| SYM-042 | Probar la subida real del snapshot contra MinIO/S3 desde el dispositivo. |
| SYM-044 | Revisión legal del aviso de privacidad; el tema de Android sigue usando `#0D9488`. |
| SYM-047 | Puntos sin decisión: RF-039/RNF-029 (módulos Gradle), "Server Components por defecto", foto de perfil de RF-011, RNF-033 (el limitador de intentos vive en memoria). |
| SYM-048 | El workflow no se ha corrido en GitHub; `packages/i18n` no tiene configuración de eslint y el paso de lint fallará. |

Pasos manuales en la base de desarrollo: agregar `PIN_HMAC_SECRET` a `apps/api/.env`, correr `prisma migrate deploy` y `pnpm migrate:access-codes` (detalle en `apps/api/README.md`).

## Índice

| ID | Título | Área | Prioridad | Estado |
|---|---|---|---|---|
| SYM-001 | Proteger los endpoints de analítica | API | P0 | Hecho |
| SYM-002 | Validar propiedad de la rutina en `POST /sessions` | API | P0 | Hecho |
| SYM-003 | Login de paciente con identificador y límite de intentos | API + Móvil | P0 | Hecho |
| SYM-004 | Dejar de exponer el hash del PIN y endurecer su generación | API | P0 | Hecho |
| SYM-005 | Revocar acceso de verdad (PIN revocado, paciente archivado, terapeuta inactivo) | API | P0 | Hecho |
| SYM-006 | Quitar secretos por defecto y completar `.env.example` | API + Infra | P0 | Hecho |
| SYM-007 | Móvil: quitar logs con PIN/JWT, tráfico en claro y backup de datos clínicos | Móvil | P0 | Hecho |
| SYM-008 | Resolver la métrica de simetría facial (Decisión) | Móvil + Tesis | P0 | En progreso |
| SYM-009 | EYES_INVERSE se cumple con los ojos en reposo | Móvil | P0 | Hecho |
| SYM-010 | Gráfica de evolución en orden cronológico invertido | Web + API | P0 | Hecho |
| SYM-011 | Quitar datos clínicos fijos en el portal | Web | P0 | Hecho |
| SYM-012 | Unificar la escala de `averageAccuracy` y el KPI de eficacia | API + Móvil | P0 | Hecho |
| SYM-013 | Backoff exponencial y máximo de 3 intentos en la sincronización | Móvil | P1 | Hecho |
| SYM-014 | Sesiones atascadas en ERROR y 5xx sin reintento | Móvil | P1 | Hecho |
| SYM-015 | Quitar la migración destructiva de Room | Móvil | P1 | Hecho |
| SYM-016 | Home: no borrar la caché ante errores y mostrarla de inmediato | Móvil | P1 | Hecho |
| SYM-017 | Idempotencia robusta en `POST /sessions` | API | P1 | Hecho |
| SYM-018 | Guardia de rotación de cabeza en calibración | Móvil | P1 | Hecho |
| SYM-019 | La calibración dinámica sobrescribe el baseline con valores por defecto | Móvil | P1 | Hecho |
| SYM-020 | Ventana de 3 s vs. 90 muestras en calibración (Decisión) | Móvil + Tesis | P1 | En progreso |
| SYM-021 | Persistencia de la calibración: cifrar y enviar al backend (Decisión) | Móvil + API | P1 | Hecho |
| SYM-022 | Reparar `CalibrationViewModelTest` (los tests no compilan) | Móvil | P1 | Hecho |
| SYM-023 | Web: selector de idioma y catálogo en inglés completo | Web + i18n | P1 | Hecho |
| SYM-024 | API: mensajes de error traducidos según `Accept-Language` | API + i18n | P1 | Hecho |
| SYM-025 | Android: textos en recursos y soporte de inglés | Móvil | P1 | En progreso |
| SYM-026 | Reparar tests, typecheck y lint del portal web | Web | P1 | Hecho |
| SYM-027 | Mostrar al usuario los errores que hoy se tragan | Web | P1 | Hecho |
| SYM-028 | Manejo consistente de sesión expirada (401/403) | Web | P1 | Hecho |
| SYM-029 | Paginación de pacientes, ejercicios e historial de sesiones | Web + API | P1 | Hecho |
| SYM-030 | Restringir edición y borrado de ejercicios en uso | API + Web | P1 | Hecho |
| SYM-031 | Agregaciones de analítica en la base de datos | API | P1 | Hecho |
| SYM-032 | El clon de rutina queda ACTIVE | API | P1 | Hecho |
| SYM-033 | El contenedor de la API no arranca con Docker Compose | Infra | P1 | Hecho |
| SYM-034 | Escribir los tests que los RNF citan como evidencia | API + Móvil | P1 | En progreso |
| SYM-035 | Mapear errores de Prisma a respuestas HTTP correctas | API | P2 | Hecho |
| SYM-036 | Retroalimentación háptica y sonora que no funciona | Móvil | P2 | En progreso |
| SYM-037 | Rendimiento del pipeline de visión y medición de fps | Móvil | P2 | En progreso |
| SYM-038 | Carrera de datos entre el hilo de MediaPipe y el Player | Móvil | P2 | Hecho |
| SYM-039 | Parámetros de la rutina que se pierden en Room | Móvil | P2 | En progreso |
| SYM-040 | Pantalla de resumen sin métricas por ejercicio | Móvil | P2 | Hecho |
| SYM-041 | SQLCipher y autenticación offline (Decisión) | Móvil + Tesis | P2 | En progreso |
| SYM-042 | Almacenamiento S3 y snapshot del mejor intento (Decisión) | API + Móvil + Tesis | P2 | En progreso |
| SYM-043 | Dependencias que rompen Clean Architecture en Android | Móvil | P2 | Pendiente |
| SYM-044 | Web: aviso de privacidad, contraste, `browserslist` y Zod | Web | P2 | En progreso |
| SYM-045 | Aplicar el rol ADMIN en el catálogo global | API | P2 | Hecho |
| SYM-046 | Login móvil: distinguir error de red de PIN inválido | Móvil | P2 | Hecho |
| SYM-047 | Alinear la documentación consigo misma y con el código | Tesis | P2 | En progreso |
| SYM-048 | Pipeline de CI | Infra | P2 | En progreso |
| SYM-049 | Panel de depuración visible en calibración | Móvil | P3 | Hecho |
| SYM-050 | Limpieza de código muerto y controles sin función | Web + Repo | P3 | Hecho |
| SYM-051 | Teclas del PIN deformadas en la tercera columna | Móvil | P1 | Hecho |
| SYM-052 | Tema claro por defecto y colores del tema coherentes | Móvil | P2 | Hecho |

---

## P0 — Seguridad de datos clínicos

### SYM-001 · Proteger los endpoints de analítica
- **Requerimientos:** RF-008, RF-009, RNF-014.
- **Problema:** `GET /routines/:id/stats` y `GET /routines/:id/history` no tienen guard ni filtro por terapeuta. Cualquiera con un id de rutina lee el historial clínico sin token.
- **Evidencia:** `api/analytics/analytics.controller.ts:5-10,85`. El test `apps/api/test/sessions.e2e-spec.ts:153-155` llama sin token y espera 200.
- **Qué hacer:** agregar el guard JWT de terapeuta y verificar que la rutina pertenece a un paciente del terapeuta autenticado.
- **Listo cuando:** sin token responde 401; con token de otro terapeuta responde 403/404; hay test e2e de ambos casos.

### SYM-002 · Validar propiedad de la rutina en `POST /sessions`
- **Requerimientos:** RF-009, RF-037, RNF-014.
- **Problema:** `SessionsService.create` recibe `patientId` y no lo usa. Un paciente puede registrar sesiones en rutinas de otro paciente, y la rama idempotente devuelve una sesión ajena si se conoce su UUID.
- **Evidencia:** `api/sessions/sessions.service.ts:93-110`.
- **Qué hacer:** comprobar que `routine.patientId` coincide con el paciente del JWT, también en la rama idempotente; rechazar rutinas ARCHIVED.
- **Listo cuando:** enviar una sesión a una rutina ajena responde 403 y hay test que lo cubre.

### SYM-003 · Login de paciente con identificador y límite de intentos
- **Requerimientos:** RF-035, RF-006.
- **Problema:** el login es solo un PIN de 6 dígitos buscado entre todos los pacientes, sin identificador y sin límite de intentos. Con N pacientes activos bastan ~900 000/N intentos en promedio.
- **Evidencia:** `api/auth/patient-auth.service.ts:20-31`, `api/auth/dto/mobile-login.dto.ts`; no hay Throttler en el proyecto.
- **Qué hacer:** agregar rate limiting al endpoint como mínimo. Decidir si además se exige un identificador de paciente (RF-035 lo pide), lo que implica cambiar la pantalla de login móvil.
- **Listo cuando:** tras N intentos fallidos el endpoint responde 429; la decisión sobre el identificador queda reflejada en RF-035 y en el código.

### SYM-004 · Dejar de exponer el hash del PIN y endurecer su generación
- **Requerimientos:** RF-003, RF-004, RNF-012, RNF-015.
- **Problema:** `accessCodeHash` (SHA-256 sin sal de 6 dígitos, reversible en menos de un segundo) se devuelve en las respuestas de pacientes y en los `include: { patient: true }` de rutinas. El PIN se genera con `Math.random`.
- **Evidencia:** `api/patients/patients.service.ts:17,101-114,130,163-186`; `api/routines/routines.service.ts:67,137,233,293`.
- **Qué hacer:** excluir `accessCodeHash` de toda respuesta; generar el PIN con `crypto.randomInt`. El cambio de algoritmo de hash depende de SYM-003 (con identificador se puede usar bcrypt; sin él hace falta un hash determinista con secreto, p. ej. HMAC).
- **Listo cuando:** ninguna respuesta de la API contiene `accessCodeHash` y hay test que lo verifica.

### SYM-005 · Revocar acceso de verdad
- **Requerimientos:** RF-005, RF-007, RNF-040.
- **Problema:** revocar el PIN no invalida los JWT ya emitidos (7 días); un paciente ARCHIVED sigue entrando; la estrategia del terapeuta no revisa `isActive`. Paciente y terapeuta comparten secreto y caducidad.
- **Evidencia:** `api/auth/strategies/patient-jwt.strategy.ts:19-32`, `api/auth/jwt.strategy.ts:22-32`, `api/auth/auth.module.ts:21`.
- **Qué hacer:** en `validate` de cada estrategia, rechazar si el paciente no tiene PIN activo o está archivado, y si el terapeuta está inactivo. Separar la caducidad por tipo de usuario.
- **Listo cuando:** tras revocar el PIN, el token anterior recibe 401.

### SYM-006 · Quitar secretos por defecto y completar `.env.example`
- **Requerimientos:** RNF-042.
- **Problema:** fallback `'super-secret'` para el JWT; valores por defecto de `JWT_SECRET`, `POSTGRES_PASSWORD` y `AUTH_SECRET` en compose; `.env.example` no lista `JWT_SECRET`; `apps/web/.env.example` está ignorado por git y le faltan `AUTH_SECRET` y `AUTH_URL`.
- **Evidencia:** `api/auth/auth.module.ts:20`, `api/auth/strategies/patient-jwt.strategy.ts:15`, `docker-compose.yml:32`, `apps/web/.gitignore:34`.
- **Qué hacer:** fallar al arrancar si falta el secreto; completar y versionar los `.env.example`.
- **Listo cuando:** la API no arranca sin `JWT_SECRET` y siguiendo `.env.example` el proyecto levanta.

### SYM-007 · Móvil: quitar logs con PIN/JWT, tráfico en claro y backup de datos clínicos
- **Requerimientos:** RNF-011, RNF-013, RNF-038.
- **Problema:** `HttpLoggingInterceptor` en nivel BODY en todas las builds (vuelca PIN y JWT a logcat); `usesCleartextTraffic="true"`; no se fuerza TLS; `allowBackup="true"` incluye la base clínica y la calibración.
- **Evidencia:** `mobile/core/di/NetworkModule.kt:30-36`, `apps/mobile/app/src/main/AndroidManifest.xml:13,21`, `res/xml/backup_rules.xml`.
- **Qué hacer:** logging solo en debug y sin cuerpos; cleartext solo en debug (network security config); `ConnectionSpec.MODERN_TLS` en release; excluir base de datos y preferencias del backup.
- **Listo cuando:** una build release no registra cuerpos, rechaza HTTP y no respalda datos clínicos.
- **Avance (2026-11-19, sin commitear):** release sin logging, solo TLS moderno y sin cleartext; backup deshabilitado. **Ojo:** el `API_BASE_URL` por defecto es HTTP; una build release necesita `api.baseUrl` con HTTPS.

## P0 — Validez de los datos clínicos

### SYM-008 · Resolver la métrica de simetría facial (Decisión)
- **Requerimientos:** RF-051, RF-052, RF-029, RF-034.
- **Problema:** `SymmetryCalculator` es código muerto. Lo que se envía como `averageAccuracy`, lo que alimenta la barra de calidad y lo que el portal grafica es el puntaje del ejercicio respecto al umbral calibrado, no una comparación izquierda/derecha.
- **Evidencia:** `mobile/domain/logic/SymmetryCalculator.kt:29-67`, `mobile/presentation/player/PlayerViewModel.kt:67,736-748`, `mobile/presentation/components/feedback/QualityBar.kt`.
- **Qué decidir:** (a) calcular y enviar simetría real como métrica aparte, o (b) reescribir en la tesis lo que mide `averageAccuracy` y renombrar lo que hoy se llama simetría.
- **Listo cuando:** la tesis y el código describen la misma métrica, con el mismo nombre.

### SYM-009 · EYES_INVERSE se cumple con los ojos en reposo
- **Requerimientos:** RF-056.
- **Problema:** `eyesOpenMin` nunca se calibra (queda en 0.1) y la estrategia no resta la tara neutral, así que el objetivo se alcanza sin hacer el gesto.
- **Evidencia:** `mobile/domain/model/CalibrationBaseline.kt:10`, `mobile/domain/logic/ExerciseStrategies.kt:94-108`.
- **Qué hacer:** calibrar el valor que usa la estrategia (paso de apertura ocular) y aplicar la tara como en el resto.
- **Listo cuando:** un test muestra que con el rostro en reposo el puntaje queda por debajo del umbral.
- **Avance (2026-11-19, sin commitear):** la estrategia usa `eyeWide` con tara y un paso de calibración propio (`eyesWideMax`), con test en reposo. **Falta:** validar en dispositivo la amplitud de la señal; los pacientes ya calibrados deben recalibrar.

### SYM-010 · Gráfica de evolución en orden cronológico invertido
- **Requerimientos:** RF-034.
- **Problema:** la API devuelve el historial en orden descendente y la gráfica lo dibuja sin ordenar: una mejora real se ve como caída. Solo entran las últimas 20 sesiones y el prop `data` se ignora.
- **Evidencia:** `web/components/analytics/ProgressChart.tsx:101,110-117`, `api/analytics/analytics.controller.ts:96-100`.
- **Qué hacer:** graficar en orden ascendente usando los datos de `stats.chartData`.
- **Listo cuando:** la sesión más antigua queda a la izquierda y hay test que lo verifica.
- **Avance (2026-11-19, sin commitear):** la gráfica ordena ascendente y usa `stats.chartData`, con test. **Falta (API):** `/routines/:id/history` sigue devolviendo solo las 20 sesiones más recientes, así que las vistas por ejercicio, repeticiones y tiempo se limitan a esas 20.

### SYM-011 · Quitar datos clínicos fijos en el portal
- **Requerimientos:** RF-015, RF-031.
- **Problema:** adherencia "85%" y "12" sesiones fijas; ejercicios prescritos "Smile Stretch / Brow Raise" y rango "Jan 01 - Jan 30" fijos; badge "Activo" fijo aunque el paciente esté archivado.
- **Evidencia:** `web/app/dashboard/patients/[id]/page.tsx:108,113`, `web/app/dashboard/patients/[id]/routines/[routineId]/page.tsx:123-124,141-153`, `web/app/dashboard/patients/[id]/layout.tsx:112-114,127`.
- **Qué hacer:** mostrar datos reales de la API o quitar el bloque si no hay fuente.
- **Listo cuando:** no queda ningún valor clínico literal en esas pantallas.
- **Avance (2026-11-19, sin commitear):** los valores vienen de la API; se quitó el bloque "Estadísticas rápidas" porque ningún endpoint da adherencia ni sesiones por paciente.

### SYM-012 · Unificar la escala de `averageAccuracy` y el KPI de eficacia
- **Requerimientos:** RF-029.
- **Problema:** el móvil y el seed usan 0–1; el contrato y el DTO dicen 0–100; analítica multiplica por 100 y el dashboard no, así que el KPI muestra 0–1 %. `averageAccuracy` no tiene `@Min/@Max` y el móvil puede enviar valores mayores a 1.
- **Evidencia:** `api/dashboard/dashboard.service.ts:113-121`, `api/analytics/analytics.controller.ts:72,79`, `api/sessions/dto/create-session.dto.ts:28-34`.
- **Qué hacer:** fijar una sola escala en el contrato, validarla en el DTO y convertir en un solo lugar.
- **Listo cuando:** dashboard y analítica muestran el mismo porcentaje para los mismos datos.

## P1 — Sincronización y modo offline

### SYM-013 · Backoff exponencial y máximo de 3 intentos en la sincronización
- **Requerimientos:** RF-060, RNF-008.
- **Problema:** `BACKOFF_DELAY` está declarado pero no se usa; no hay `setBackoffCriteria` ni tope de intentos ni paso a ERROR por agotamiento.
- **Evidencia:** `mobile/core/sync/SyncSessionsWorker.kt:61-73`, `mobile/domain/usecase/SaveAndSyncSessionUseCase.kt:73-75`.
- **Qué hacer:** configurar `BackoffPolicy.EXPONENTIAL` con 30 s y usar `runAttemptCount` para el tope. Definir qué pasa con la sesión tras agotar intentos (ver SYM-014).
- **Listo cuando:** existe el test de 3 fallos de red seguidos de éxito que pide RNF-008.
- **Avance (2026-11-19, sin commitear):** backoff exponencial de 30 s y tope de 3 reintentos (4 intentos), con el test de RNF-008. **Falta (decisión):** RF-060 dice "máximo tres intentos" y RNF-008 "3 reintentos"; se siguió RNF-008.

### SYM-014 · Sesiones atascadas en ERROR y 5xx sin reintento
- **Requerimientos:** RNF-007.
- **Problema:** un 401 o cualquier 4xx deja la sesión en ERROR para siempre (solo se reintentan las PENDING); un 5xx no programa reintento. Las inserciones de sesión e ítems no son transaccionales.
- **Evidencia:** `mobile/data/repository/SessionRepositoryImpl.kt:51-52,99-113`.
- **Qué hacer:** tratar 401 y 5xx como reintentables; dar una vía de recuperación a las sesiones en ERROR; insertar sesión e ítems en una transacción.
- **Listo cuando:** ninguna respuesta del servidor deja una sesión sin posibilidad de reenvío.
- **Avance (2026-11-19, sin commitear):** 401, 408, 429 y 5xx se reintentan; las sesiones en ERROR vuelven a PENDING en cada corrida nueva; inserción transaccional. Se corrigió además que WorkManager no usaba `HiltWorkerFactory` (el worker no se podía instanciar).

### SYM-015 · Quitar la migración destructiva de Room
- **Requerimientos:** RNF-007, RF-041.
- **Problema:** `fallbackToDestructiveMigration()` borra las sesiones pendientes al subir la versión de la base; `exportSchema=false`.
- **Evidencia:** `mobile/core/di/DatabaseModule.kt:24-38,88`.
- **Qué hacer:** exportar el esquema y escribir migraciones explícitas.
- **Listo cuando:** subir la versión de la base conserva las sesiones PENDING.
- **Avance (2026-11-19, sin commitear):** esquema exportado en `apps/mobile/app/schemas/` (sin trackear; debe commitearse) y test de migración v5 → v6 que conserva las sesiones PENDING.

### SYM-016 · Home: no borrar la caché ante errores y mostrarla de inmediato
- **Requerimientos:** RF-044, RNF-006.
- **Problema:** cualquier respuesta no-2xx (401, 404, 500) borra la rutina local; la pantalla muestra "cargando" hasta que responde la red en lugar de mostrar la caché.
- **Evidencia:** `mobile/data/repository/RoutineRepositoryImpl.kt:31-36`, `mobile/presentation/home/HomeViewModel.kt:29,42`.
- **Qué hacer:** borrar la caché solo cuando el servidor confirma que no hay rutina activa; emitir primero lo que hay en Room.
- **Listo cuando:** con el servidor caído o sin red, la rutina en caché sigue visible.
- **Avance (2026-11-19, sin commitear):** la caché solo se borra cuando el servidor confirma que no hay rutina; Home muestra primero la caché. Se corrigió que la respuesta vacía de "sin rutina activa" lanzaba excepción.

### SYM-017 · Idempotencia robusta en `POST /sessions`
- **Requerimientos:** RF-038, RNF-009.
- **Problema:** `id` es opcional; hay carrera entre `findUnique` y `create` (dos envíos simultáneos acaban en 500); responde 201 en vez del 200 del RF. Se aceptan `endTime < startTime`, `items` vacío y `exerciseId` inexistente.
- **Evidencia:** `api/sessions/sessions.service.ts:95-163`; `specs/001-api-contracts/contracts/sessions.yaml` no declara `id`.
- **Qué hacer:** hacer `id` obligatorio, capturar la violación de unicidad y devolver la sesión existente, validar el resto del DTO.
- **Listo cuando:** existe el test e2e de doble POST con el mismo UUID que pide RNF-009.

## P1 — Calibración

### SYM-018 · Guardia de rotación de cabeza en calibración
- **Requerimientos:** RF-055.
- **Problema:** no se estima ningún ángulo. Solo se compara el desplazamiento del centro de la cara entre frames (15 px); girar la cabeza sin trasladarla no se detecta.
- **Evidencia:** `mobile/domain/logic/CalibrationUtils.kt:41,98-115`.
- **Qué hacer:** estimar yaw/pitch (matriz de transformación de MediaPipe o landmarks) y pausar la captura por encima de 10°.
- **Listo cuando:** hay test con una rotación simulada mayor a 10° que pausa la captura.
- **Avance (2026-11-19, sin commitear):** yaw/pitch desde la matriz de transformación facial, pausa por encima de 10°, con tests. **Falta:** probar en dispositivo. **Decisión:** el ángulo se mide contra la pose del primer frame de la captura, no en absoluto.

### SYM-019 · La calibración dinámica sobrescribe el baseline con valores por defecto
- **Problema:** si la rutina no se encuentra, la calibración termina sin gestos y guarda los valores por defecto (0.5) sobre la calibración previa. Los módulos que no se calibran también se pisan con 0.5. EYES_INVERSE se mapea a un paso que no calibra lo que su estrategia usa.
- **Evidencia:** `mobile/presentation/features/calibration/CalibrationViewModel.kt:63,84-111` (cambios sin commitear).
- **Qué hacer:** partir del baseline guardado, no guardar si no se calibró ningún gesto, y usar la secuencia completa como respaldo.
- **Listo cuando:** calibrar una rutina parcial conserva los valores de los módulos no calibrados.

### SYM-020 · Ventana de 3 s vs. 90 muestras en calibración (Decisión)
- **Requerimientos:** RF-053, RF-054.
- **Problema:** la doc promete ventana de 3 segundos y wizard de 5 pasos; el código cierra cada paso al juntar 90 muestras válidas y tiene neutral + 5 gestos (o pasos según la rutina). El P95 sí es correcto.
- **Evidencia:** `mobile/presentation/features/calibration/CalibrationViewModel.kt:32-33,398-421`, `mobile/domain/logic/CalibrationUtils.kt:66-75`.
- **Qué decidir:** actualizar RF-053/054 al comportamiento real (recomendado) o cambiar el código a ventana temporal.
- **Listo cuando:** doc y código coinciden.

### SYM-021 · Persistencia de la calibración: cifrar y enviar al backend (Decisión)
- **Requerimientos:** brief §5 (`calibration_vector`).
- **Problema:** la calibración se guarda en `SharedPreferences` sin cifrar y nunca llega al backend; el esquema de Prisma ya no tiene `calibration_vector`.
- **Evidencia:** `mobile/data/repository/CalibrationRepositoryImpl.kt:24-37`, `mobile/core/di/DatabaseModule.kt:106-108`.
- **Qué decidir:** si el terapeuta necesita ver la calibración (entonces se envía con la sesión) o si se retira del modelo de datos de la tesis.
- **Listo cuando:** la decisión está reflejada en el brief y, si aplica, en el contrato de sesiones.

### SYM-022 · Reparar `CalibrationViewModelTest`
- **Problema:** los cambios sin commitear ampliaron el constructor de `CalibrationViewModel` a 3 parámetros y el test usa el anterior; toda la suite de Android deja de compilar. En HEAD pasan 110/110.
- **Evidencia:** `apps/mobile/app/src/test/java/com/symma/app/presentation/features/calibration/CalibrationViewModelTest.kt:43`.
- **Qué hacer:** actualizar el test y agregar casos de P95, tara y `processFrame`, que hoy no existen.
- **Listo cuando:** `./gradlew testDebugUnitTest` pasa en el working tree.

## P1 — Internacionalización

### SYM-023 · Web: selector de idioma y catálogo en inglés completo
- **Requerimientos:** RF-061, RNF-035, RNF-036.
- **Problema:** el locale está fijo en `es`, no hay selector, y el inglés tiene 37 de 243 claves; `enums`, `errors` y `validation` en inglés están vacíos. Fechas fijas en `es-MX` en 10 lugares.
- **Evidencia:** `web/i18n/request.ts:6`, `packages/i18n/src/locales/en/`.
- **Qué hacer:** completar `en`, agregar selector con persistencia y formatear fechas según el locale.
- **Listo cuando:** se cambia de idioma sin recarga completa y no aparecen claves crudas; un test compara claves entre `es` y `en`.

### SYM-024 · API: mensajes de error traducidos según `Accept-Language`
- **Requerimientos:** RF-061, RNF-037.
- **Problema:** las excepciones usan literales en inglés en vez de claves; el filtro nunca traduce; `en/errors.json` está vacío; la API copia los JSON en `prebuild` y las copias trackeadas están desactualizadas.
- **Evidencia:** `api/common/filters/i18n-exception.filter.ts:22`, `api/i18n/i18n.module.ts:9-26`, `api/i18n/locales/en/`.
- **Qué hacer:** usar claves `errors.*` en las excepciones, llenar ambos idiomas y consumir `@symma/i18n` sin copias trackeadas.
- **Listo cuando:** la misma petición devuelve el error en español o inglés según la cabecera, con test.

### SYM-025 · Android: textos en recursos y soporte de inglés
- **Requerimientos:** RF-061, RNF-035, RNF-036.
- **Problema:** había ~46 textos fijos en código (muchos en inglés) y no existe `values-en`.
- **Avance (2026-11-19, sin commitear):** los textos de login, reproductor, resumen y error de sincronización pasaron a `res/values/strings.xml` en español.
- **Avance (2026-11-19, sin commitear):** `values-en/strings.xml` completo (154 claves) con test de paridad; `EnumTranslations.kt` usa recursos; "Serie N" se arma en la UI.
- **Falta:** ver ambos idiomas en dispositivo; `packages/i18n/scripts/sync-mobile.ts` sigue siendo un stub.
- **Listo cuando:** la app se ve completa en ambos idiomas según el idioma del sistema.

## P1 — Portal web y API

### SYM-026 · Reparar tests, typecheck y lint del portal web
- **Requerimientos:** RNF-032.
- **Problema:** 7 de 24 tests fallan tras la migración a i18n (no envuelven con `NextIntlClientProvider`); `tsc` tiene 1 error; lint tiene 1 error.
- **Evidencia:** `web/i18n/config.test.ts:17`, `web/app/dashboard/layout.tsx:20`; fallan `ProgressChart.test`, `routine-builder.test`, `[routineId]/page.test` y `sessions/[sessionId]/page.test`.
- **Listo cuando:** `vitest run`, `tsc --noEmit` y `eslint` pasan limpios.

### SYM-027 · Mostrar al usuario los errores que hoy se tragan
- **Problema:** un alta o edición de paciente fallida cierra el modal sin aviso; crear/editar/clonar/borrar rutina, borrar ejercicio y generar/revocar PIN solo hacen `console.error`. El dashboard muestra 0 alertas y "todo en orden" si la API falla.
- **Evidencia:** `web/app/dashboard/patients/page.tsx:69-84`, `web/components/patients/patient-dialog.tsx:178-179`, `web/components/patients/patient-access-card.tsx:51-53,66-68`, `web/app/dashboard/page.tsx:36-48`.
- **Listo cuando:** cada operación fallida muestra un mensaje y conserva el formulario.

### SYM-028 · Manejo consistente de sesión expirada (401/403)
- **Requerimientos:** RF-008.
- **Problema:** el 403 se trata como sesión expirada; solo 2 páginas manejan el 401; el JWT de la API es accesible desde JS del cliente.
- **Evidencia:** `web/lib/api.ts:35-38`, `web/app/dashboard/exercises/page.tsx:16`.
- **Listo cuando:** un 401 en cualquier página redirige a login y un 403 muestra "sin permiso".
- **Avance (2026-11-19, sin commitear):** 401 cierra sesión y redirige a login en todas las páginas; 403 muestra "sin permiso". **Falta (decisión):** el JWT de la API sigue accesible desde JS del cliente; quitarlo implica pasar las llamadas por rutas de servidor de Next.

### SYM-029 · Paginación de pacientes, ejercicios e historial de sesiones
- **Requerimientos:** RF-011, RF-032.
- **Problema:** la UI solo muestra la primera página (20); el historial de sesiones es un `take: 20` fijo sin parámetros. `limit` no numérico produce un 500.
- **Evidencia:** `web/app/dashboard/patients/page.tsx:23-40`, `api/analytics/analytics.controller.ts:100`, `api/patients/patients.service.ts:30`.
- **Listo cuando:** las tres listas se pueden recorrer completas y la API valida `page`/`limit`.
- **Avance (2026-11-19, sin commitear):** pacientes y ejercicios se paginan en la web. **Falta (API):** `page`/`limit` en el historial de sesiones y validación de `page`/`limit` (un valor no numérico aún da 500).

### SYM-030 · Restringir edición y borrado de ejercicios en uso
- **Requerimientos:** RF-017, RF-018.
- **Problema:** no hay restricción de edición; el borrado solo lo frena la FK y sale como 500 genérico; la UI no muestra el error.
- **Evidencia:** `api/exercises/exercises.service.ts:49-60`, `web/app/dashboard/exercises/page.tsx:48-57`.
- **Listo cuando:** borrar o editar un ejercicio en una rutina activa devuelve 409 con mensaje descriptivo y la UI lo muestra.
- **Avance (2026-11-19, sin commitear):** la web muestra el error de la API al borrar o editar. **Falta (API):** la regla de ejercicio en uso y el 409 con mensaje descriptivo.

### SYM-031 · Agregaciones de analítica en la base de datos
- **Requerimientos:** RNF-004, RF-031.
- **Problema:** promedios y conteos se calculan con `findMany` + `reduce` en memoria; el dashboard hace N+1 consultas; la racha usa ventanas de 24 h en vez de días calendario.
- **Evidencia:** `api/analytics/analytics.controller.ts:20-68`, `api/dashboard/dashboard.service.ts:73-121`.
- **Listo cuando:** se usan `aggregate`/`groupBy` y la racha cuenta días calendario.

### SYM-032 · El clon de rutina queda ACTIVE
- **Requerimientos:** RF-024.
- **Problema:** el clon se crea ACTIVE con fecha de hoy, dejando dos rutinas activas; el móvil toma el clon. La doc dice DRAFT, estado que no existe en el esquema.
- **Evidencia:** `api/routines/routines.service.ts:261-296`.
- **Qué hacer:** definir el estado del clon (agregar DRAFT o archivar la original) y garantizar una sola rutina activa por paciente.
- **Listo cuando:** clonar no cambia la rutina que recibe el paciente hasta que el terapeuta la activa.

### SYM-033 · El contenedor de la API no arranca con Docker Compose
- **Requerimientos:** RNF-034.
- **Problema (inferido, no se construyó la imagen):** el `Dockerfile` ejecuta `dist/main.js` pero la build emite `dist/src/main.js`; el runner copia solo el `node_modules` raíz; no se ejecuta `prisma migrate deploy`.
- **Evidencia:** `apps/api/Dockerfile`.
- **Listo cuando:** `docker-compose up` en limpio deja los tres servicios funcionando con la base migrada.

### SYM-034 · Escribir los tests que los RNF citan como evidencia
- **Problema:** varios criterios de medición nombran tests que no existen o no prueban lo que dicen.
- **Faltan:** acceso con JWT de otro terapeuta → 403 (RNF-014); crear paciente sin JWT → 401 (RNF-040); unitarios de `AuthService` (RNF-012); `TokenManager` (RNF-013); resultados vacíos y errores de MediaPipe (RNF-010); `syncRoutine()` en `HomeViewModelTest` (RNF-005); medición de tiempos en `mobile.e2e-spec.ts` y k6 (RNF-003, RNF-004). Sin cobertura: auth y mobile en la API; login, pacientes, PIN y middleware en web; ningún test instrumentado en Android.
- **Listo cuando:** cada RNF que cita un test apunta a uno que existe y pasa, o el criterio se reescribe.

## P2

### SYM-035 · Mapear errores de Prisma a respuestas HTTP correctas
- **Problema:** `keyName` duplicado, FK rotas y PATCH/DELETE sobre ids inexistentes devuelven 500; `GET /exercises/:id` inexistente devuelve 200 `null`; los DELETE devuelven 200 en vez del 204 documentado.
- **Evidencia:** `api/exercises/exercises.service.ts:49-60`, `api/routines/routines.service.ts:49-59`.
- **Listo cuando:** hay un filtro de excepciones de Prisma (P2002 → 409, P2003 → 400/409, P2025 → 404).

### SYM-036 · Retroalimentación háptica y sonora que no funciona
- **Requerimientos:** RNF-024.
- **Problema:** falta el permiso `VIBRATE`, así que la vibración nunca ocurre (la excepción se silencia); el Player no tiene háptica; `ToneGenerator.release()` se llama justo después de `startTone` y probablemente corta el tono.
- **Evidencia:** `mobile/presentation/features/calibration/CalibrationScreen.kt:555-580`, `mobile/presentation/player/PlayerScreen.kt:107-116`.
- **Listo cuando:** vibración y tonos se perciben en dispositivo en calibración y en repeticiones.
- **Avance (2026-11-19, sin commitear):** permiso `VIBRATE`, un solo `ToneGenerator` por pantalla y háptica en el Player. **Falta:** percibirlo en dispositivo.

### SYM-037 · Rendimiento del pipeline de visión y medición de fps
- **Requerimientos:** RNF-001, RNF-002, RF-049.
- **Problema:** el analyzer corre en el hilo principal; `FaceLandmarker` nunca se cierra (fuga nativa); delegate CPU; `inferenceTime` se calcula pero nadie lo consume, así que los 30 fps no están medidos.
- **Evidencia:** `mobile/presentation/components/camera/CameraPreview.kt:105`, `mobile/presentation/components/camera/FaceLandmarkerHelper.kt:32,42,109`.
- **Listo cuando:** el análisis corre en un executor propio, el landmarker se libera, y hay una medición registrada de fps y latencia en un dispositivo de referencia para citar en la tesis.
- **Avance (2026-11-19, sin commitear):** analyzer en executor propio, `FaceLandmarker` se cierra, y fps/latencia se registran cada 5 s (tag `VisionPerformance`). **Falta:** la medición en un dispositivo de referencia; el delegate sigue en CPU.

### SYM-038 · Carrera de datos entre el hilo de MediaPipe y el Player
- **Problema (inferido):** `onResults` llega desde el hilo de MediaPipe y muta estado del Player en paralelo con `skip()` y los temporizadores del hilo principal.
- **Evidencia:** `mobile/presentation/player/PlayerViewModel.kt:708-752`.
- **Listo cuando:** todas las mutaciones del estado del Player ocurren en un solo dispatcher.

### SYM-039 · Parámetros de la rutina que se pierden en Room
- **Problema:** `engageThreshold` y `releaseThreshold` llegan del backend pero la entidad de Room no los guarda; el tipo de ejercicio se deduce de `holdTimeSeconds > 0` ignorando `exercise.type`. El modo estricto reinicia por un solo frame bajo el umbral, sin margen.
- **Evidencia:** `mobile/data/mapper/RoutineMapper.kt:84-127`, `mobile/domain/model/RoutineItem.kt:28`, `mobile/presentation/player/PlayerViewModel.kt:324-327`.
- **Listo cuando:** el Player usa los umbrales y el tipo que definió el terapeuta.
- **Avance (2026-11-19, sin commitear):** el tipo sale de `exercise.type` y el modo estricto tolera 300 ms. **Reclamo falso:** `engageThreshold`/`releaseThreshold` no llegan del backend (no existen en la API ni en Prisma). **Falta (decisión):** si el backend los expondrá; confirmar los 300 ms y el hold mínimo de 1 s.

### SYM-040 · Pantalla de resumen sin métricas por ejercicio
- **Requerimientos:** RF-048, RF-033.
- **Problema:** el resumen solo muestra "sesión completada". El detalle de sesión en web tampoco muestra hold promedio porque el campo no existe en el esquema.
- **Evidencia:** `mobile/presentation/summary/SummaryScreen.kt`, `packages/shared-types/src/sessions.ts`.
- **Listo cuando:** el resumen lista repeticiones y precisión por ejercicio.
- **Avance (2026-11-19, sin commitear):** el resumen lista repeticiones y precisión por ejercicio. El porcentaje asume escala 0–1 (SYM-012). **Falta:** hold promedio en web, que requiere un campo nuevo en el esquema.

### SYM-041 · SQLCipher y autenticación offline (Decisión)
- **Requerimientos:** brief §4B.
- **Problema:** no hay cifrado de la base local ni biometría/PIN offline; solo autologin si existe token.
- **Qué decidir:** implementarlo o retirarlo del brief como trabajo futuro.

### SYM-042 · Almacenamiento S3 y snapshot del mejor intento (Decisión)
- **Requerimientos:** RNF-017, brief §4C y §7.
- **Problema:** no hay integración S3, ni subida de imágenes, ni campos de snapshot; RNF-017 se cumple solo porque no existe ninguna imagen.
- **Qué decidir:** implementarlo o retirarlo de la tesis como trabajo futuro.

### SYM-043 · Dependencias que rompen Clean Architecture en Android
- **Requerimientos:** RF-039, RNF-029.
- **Problema:** es un solo módulo Gradle (la doc promete cuatro); `domain` importa DTOs de `data`, WorkManager, `android.*` y MediaPipe; `PlayerViewModel` importa `data`.
- **Evidencia:** `mobile/domain/repository/SessionRepository.kt:3`, `mobile/domain/usecase/SaveAndSyncSessionUseCase.kt:3-10`, `mobile/domain/logic/CalibrationUtils.kt:3-4`, `mobile/presentation/player/PlayerViewModel.kt:25`.
- **Listo cuando:** el grep del criterio de RNF-029 sale vacío, y RF-039 dice "paquetes" o existen los módulos.

### SYM-044 · Web: aviso de privacidad, contraste, `browserslist` y Zod
- **Requerimientos:** RNF-016, RNF-020, RNF-032, brief WEB-04.
- **Problema:** no hay aviso de privacidad; `#0D9488` sobre blanco da 3.74:1 (RNF-020 afirma 4.55:1) y hay grises a 2.54:1; no hay `browserslist`; los formularios validan a mano, sin Zod. 11 de 15 páginas son `'use client'` contra "Server Components por defecto".
- **Listo cuando:** cada punto está implementado o corregido en el requerimiento.
- **Avance (2026-11-19, sin commitear):** `browserslist`, tokens de contraste (`brand` #0f766e, 5.47:1), Zod en formularios de paciente y ejercicio, y página `/privacy`. **Falta:** revisión legal del aviso y datos del responsable; corregir el 4.55:1 de RNF-020; el punto de Server Components.

### SYM-045 · Aplicar el rol ADMIN en el catálogo global
- **Problema:** no existe `RolesGuard`; cualquier terapeuta puede editar o borrar ejercicios del catálogo que usan otros.
- **Evidencia:** `api/exercises/exercises.controller.ts`.
- **Listo cuando:** solo ADMIN modifica el catálogo, o la tesis documenta que es compartido.

### SYM-046 · Login móvil: distinguir error de red de PIN inválido
- **Problema:** cualquier fallo, incluida la falta de red, muestra "Código de acceso inválido". No hay manejo de 401 ni cierre de sesión en el interceptor.
- **Evidencia:** `mobile/presentation/auth/AuthViewModel.kt:56`, `mobile/core/network/AuthInterceptor.kt:19-21`.
- **Listo cuando:** sin red el mensaje habla de conexión, y un 401 en cualquier pantalla lleva al login.
- **Avance (2026-11-19, sin commitear):** mensajes distintos para código inválido, demasiados intentos, sin conexión y servidor no disponible; un 401 lleva al login.

### SYM-047 · Alinear la documentación consigo misma y con el código
- **Problema:** contradicciones internas y desfase con el código.
- **Pendientes:** hash del PIN (RF-003 bcrypt vs. RNF-012 SHA-256); identificador en login (RF-035 vs. doc de API); idempotencia (RF-038 vs. RNF-009 vs. doc de API); 468 vs. 478 landmarks; TLS "exclusivamente 1.3" y "no anterior a 1.2" (RNF-011); estados DRAFT/COMPLETED inexistentes; modelo de datos del brief vs. `schema.prisma` (Session cuelga de rutina, SessionItem, campos eliminados); contratos OpenAPI desincronizados (`GET /sessions/:id` ausente, `id` ausente en `CreateSessionRequest`, respuestas sin `description`); `README.md` raíz es el de la plantilla de Turborepo.
- **Listo cuando:** cada punto está resuelto en `docs/` y los YAML pasan validación.

### SYM-048 · Pipeline de CI
- **Requerimientos:** RNF-030.
- **Problema:** no existe `.github`; nada ejecuta tests, lint ni `prisma migrate deploy` automáticamente.
- **Listo cuando:** cada push corre build, tests de API/web/paquetes y migraciones contra una base vacía.

## P3

### SYM-049 · Panel de depuración visible en calibración
- **Problema:** la pantalla de calibración incluye un panel "DEBUG - Calibration" en inglés.
- **Evidencia:** `mobile/presentation/features/calibration/CalibrationScreen.kt:434-526`.
- **Listo cuando:** solo aparece en builds debug.

### SYM-050 · Limpieza de código muerto y controles sin función
- **Problema:** `web/app/page.tsx` es el boilerplate de create-next-app; `web/app/dashboard/routines/new` está huérfana y redirige a una ruta inexistente; `packages/ui` es la plantilla sin uso; búsqueda global, campana, "olvidé contraseña" e ícono de arrastre no hacen nada; `/placeholder-exercise.png` no existe; textos sueltos fuera de i18n en web; `web-lint.txt` de la raíz está desactualizado.
- **Listo cuando:** se elimina o se conecta cada elemento.
- **Avance (2026-11-19, sin commitear):** limpieza hecha en `apps/web`. **Falta:** `packages/ui` y `web-lint.txt` de la raíz.

## Hechos

### SYM-051 · Teclas del PIN deformadas en la tercera columna
- **Problema:** cada fila pedía 336dp y en pantallas de 360dp solo hay 296dp; la tercera tecla quedaba aplastada.
- **Solución (2026-11-19, sin commitear):** `mobile/presentation/auth/components/NumericKeypad.kt` calcula un tamaño único para todas las teclas; reduce primero la separación (48dp → mínimo 16dp) y luego las teclas. Instalado en dispositivo (SM-M356B); falta confirmación visual.
- **Nota:** en pantallas angostas la separación ya no es de 48dp; ajustar RNF-019.

### SYM-052 · Tema claro por defecto y colores del tema coherentes
- **Solución (2026-11-19, sin commitear):** `SymmaTheme` usa tema claro por defecto; `DarkColorScheme` define `primaryContainer`, `onPrimaryContainer`, `surfaceVariant` y `onSurfaceVariant`; `SymmaCard` usa `surface`/`onSurface`; `surface` claro es blanco.
- **Pendiente menor:** en el tema oscuro `surface` es igual a `background`; no afecta mientras la app esté fija en claro.
