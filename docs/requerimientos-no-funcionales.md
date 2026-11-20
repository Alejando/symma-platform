# Requerimientos No Funcionales — Symma Platform

**Proyecto:** Symma Platform (Ecosistema Digital de Rehabilitación de Parálisis Facial)  
**Documento:** Especificación de Requerimientos No Funcionales (RNF)  
**Versión:** 1.0  
**Estado:** Aprobado

---

## Tabla de Resumen

| ID | Nombre | Categoría |
|---|---|---|
| RNF-001 | Procesamiento de frames a 30fps en gama media | Rendimiento |
| RNF-002 | Latencia máxima de retroalimentación visual | Rendimiento |
| RNF-003 | Tiempo de respuesta del endpoint de rutina activa | Rendimiento |
| RNF-004 | Agregaciones de analítica en base de datos | Rendimiento |
| RNF-005 | Tiempo de sincronización de rutina activa | Rendimiento |
| RNF-006 | Operación completa en modo offline | Disponibilidad y Confiabilidad |
| RNF-007 | Persistencia local ante fallo de sincronización | Disponibilidad y Confiabilidad |
| RNF-008 | Reintento automático con backoff exponencial | Disponibilidad y Confiabilidad |
| RNF-009 | Idempotencia en creación de sesiones | Disponibilidad y Confiabilidad |
| RNF-010 | Robustez del pipeline de visión computacional | Disponibilidad y Confiabilidad |
| RNF-011 | Cifrado de transmisiones con TLS 1.2 o superior | Seguridad |
| RNF-012 | Almacenamiento seguro de contraseñas (bcrypt) y PIN (HMAC-SHA256) | Seguridad |
| RNF-013 | Almacenamiento del JWT en EncryptedSharedPreferences | Seguridad |
| RNF-014 | Aislamiento de datos por terapeuta | Seguridad |
| RNF-015 | PIN de acceso mostrado una sola vez | Seguridad |
| RNF-016 | Cumplimiento LFPDPPP | Seguridad |
| RNF-017 | Almacenamiento externo de imágenes médicas | Seguridad |
| RNF-018 | Área mínima de botones táctiles (56dp) | Usabilidad y Accesibilidad |
| RNF-019 | Teclado numérico de gran tamaño para PIN | Usabilidad y Accesibilidad |
| RNF-020 | Contraste mínimo de texto 4.5:1 (WCAG AA) | Usabilidad y Accesibilidad |
| RNF-021 | Tamaño mínimo de fuente para instrucciones | Usabilidad y Accesibilidad |
| RNF-022 | Pantalla activa durante sesión de ejercicios | Usabilidad y Accesibilidad |
| RNF-023 | Vista de cámara en modo espejo | Usabilidad y Accesibilidad |
| RNF-024 | Retroalimentación multimodal durante ejercicios | Usabilidad y Accesibilidad |
| RNF-025 | Gestión centralizada con Turborepo y pnpm | Mantenibilidad y Escalabilidad |
| RNF-026 | Tipos compartidos como fuente única de verdad | Mantenibilidad y Escalabilidad |
| RNF-027 | Contratos de API en OpenAPI YAML | Mantenibilidad y Escalabilidad |
| RNF-028 | Patrón Strategy para el motor de ejercicios | Mantenibilidad y Escalabilidad |
| RNF-029 | Arquitectura Clean (MVVM) en Android | Mantenibilidad y Escalabilidad |
| RNF-030 | Versionado de esquema con Prisma Migrations | Mantenibilidad y Escalabilidad |
| RNF-031 | Compatibilidad Android Min SDK 26 / Target SDK 34 | Portabilidad y Compatibilidad |
| RNF-032 | Compatibilidad con navegadores modernos | Portabilidad y Compatibilidad |
| RNF-033 | API REST stateless | Portabilidad y Compatibilidad |
| RNF-034 | Entorno de desarrollo reproducible con Docker Compose | Portabilidad y Compatibilidad |
| RNF-035 | Soporte multiidioma (español e inglés) | Internacionalización |
| RNF-036 | Cambio de idioma sin reiniciar la aplicación | Internacionalización |
| RNF-037 | Localización de mensajes de error del backend | Internacionalización |
| RNF-038 | Procesamiento on-device sin envío de video a la nube | Privacidad |
| RNF-039 | Protección de datos clínicos sensibles | Privacidad |
| RNF-040 | Acceso controlado de pacientes por terapeuta | Privacidad |
| RNF-041 | PostgreSQL con healthcheck en Docker | Infraestructura y Despliegue |
| RNF-042 | Variables de entorno sin credenciales en código fuente | Infraestructura y Despliegue |

---

## 1. Rendimiento

### RNF-001: Procesamiento de frames a 30fps en gama media
**Categoría:** Rendimiento  
**Descripción:** El motor de visión computacional (MediaPipe FaceLandmarker) debe procesar el stream de cámara frontal a un mínimo de 30 fotogramas por segundo en dispositivos Android de gama media con Android 8.0 (API 26) o superior.  
**Criterio de medición:** Durante una sesión de ejercicio activa, la inferencia de FaceLandmarker —medida con el campo `inferenceTime` del `ResultBundle` retornado por `FaceLandmarkerHelper`— no debe superar los 33 ms de promedio en un dispositivo de referencia con Snapdragon 660 o equivalente. La medición se realiza ejecutando la sesión durante 60 segundos en condiciones de batería superior al 50%.  
**Justificación:** La rehabilitación de parálisis facial requiere retroalimentación en tiempo real: si el paciente sonríe o mueve los músculos faciales y la respuesta visual se retrasa más de un fotograma, el ejercicio pierde su valor terapéutico y puede provocar movimientos compensatorios incorrectos.

---

### RNF-002: Latencia máxima de retroalimentación visual
**Categoría:** Rendimiento  
**Descripción:** La aplicación móvil no debe presentar caídas de fotogramas perceptibles. La latencia entre la captura de un frame de cámara y la actualización del indicador de progreso en pantalla no debe superar los 100 ms.  
**Criterio de medición:** Usando Android GPU Inspector o el perfilador de Compose en modo debug, el pipeline completo (captura → análisis MediaPipe → actualización de `StateFlow` → recomposición de Jetpack Compose) no debe exceder 100 ms en el percentil 95 durante una sesión de 3 minutos.  
**Justificación:** Pacientes con parálisis facial severa realizan movimientos musculares de muy baja amplitud. Un feedback con latencia superior a 100 ms rompe la correlación percibida entre el esfuerzo y el resultado visual, reduciendo la eficacia terapéutica y la motivación para continuar la rehabilitación.

---

### RNF-003: Tiempo de respuesta del endpoint de rutina activa
**Categoría:** Rendimiento  
**Descripción:** El endpoint `GET /api/v1/mobile/routine/active` debe retornar la rutina activa del paciente autenticado en menos de 2 segundos bajo carga normal de operación.  
**Criterio de medición:** Usando pruebas de integración con `test/mobile.e2e-spec.ts`, el tiempo de respuesta (desde la recepción de la petición HTTP hasta el envío de la respuesta completa) debe ser inferior a 2 000 ms en el percentil 95 con la base de datos PostgreSQL en el contenedor Docker configurado en `docker-compose.yml`.  
**Justificación:** El paciente inicia la aplicación y debe ver su rutina disponible rápidamente. Una espera superior a 2 segundos puede interpretarse como un error del sistema, generando ansiedad en usuarios adultos mayores con limitada familiaridad tecnológica. Además, en conexiones móviles con latencia, el tiempo de procesamiento del servidor debe ser mínimo.

---

### RNF-004: Agregaciones de analítica en base de datos
**Categoría:** Rendimiento  
**Descripción:** Las consultas de analítica de sesiones —incluyendo `GET /api/v1/routines/:id/stats` y `GET /api/v1/routines/:id/history`— deben resolver sus cálculos (promedio de puntajes, conteo de sesiones, datos de gráfica) mediante operaciones de agregación ejecutadas en PostgreSQL 15, no mediante procesamiento en memoria de JavaScript en el servidor.  
**Criterio de medición:** Revisión de código en `apps/api/src/analytics/analytics.controller.ts`: las consultas a Prisma deben utilizar `findMany` con `orderBy` y campos de agregación nativos. El tiempo de respuesta de `GET /routines/:id/stats` no debe superar 500 ms con un historial de hasta 100 sesiones, verificado mediante pruebas de carga con k6.  
**Justificación:** El portal web del terapeuta presenta gráficas de progreso del paciente a lo largo de semanas o meses. Descargar todos los registros en memoria JavaScript y calcular promedios ahí escala linealmente con el número de sesiones, haciendo el sistema inusable a medida que los pacientes acumulan historial clínico.

---

### RNF-005: Tiempo de sincronización de rutina activa
**Categoría:** Rendimiento  
**Descripción:** Al presionar el botón de sincronización manual en la pantalla `HomeScreen`, la aplicación debe obtener la rutina activa actualizada desde el servidor y reflejarla en pantalla en menos de 5 segundos, asumiendo una conexión 4G con latencia inferior a 100 ms.  
**Criterio de medición:** En un entorno de red con ancho de banda mínimo de 1 Mbps y latencia de 100 ms (simulado con Android Emulator Network Throttle), la función `syncRoutine()` del `HomeViewModel` debe completar el ciclo completo —petición HTTP + escritura en Room + actualización de `StateFlow`— en menos de 5 000 ms, verificado con `HomeViewModelTest`.  
**Justificación:** La rutina puede ser actualizada por el terapeuta entre sesiones. El paciente necesita recibir los ejercicios más recientes antes de comenzar, especialmente en casos donde el terapeuta ha ajustado la dificultad o reemplazado ejercicios basándose en el progreso clínico previo.

---

## 2. Disponibilidad y Confiabilidad

### RNF-006: Operación completa en modo offline
**Categoría:** Disponibilidad y Confiabilidad  
**Descripción:** La aplicación móvil debe permitir al paciente ejecutar una sesión completa de ejercicios —incluyendo calibración facial, retroalimentación en tiempo real y registro de resultados— sin requerir conectividad a Internet en ningún momento del flujo.  
**Criterio de medición:** Con el dispositivo en modo avión, el usuario debe poder: (1) ver su rutina cargada desde Room, (2) completar la calibración con MediaPipe, (3) ejecutar todos los ejercicios con feedback visual, y (4) ver el resumen de sesión. La sesión se almacena en Room con `syncStatus = PENDING`. Verificado con pruebas de integración ejecutadas sin acceso de red.  
**Justificación:** Los pacientes con parálisis facial con frecuencia son adultos mayores con acceso limitado o intermitente a Internet, o que realizan sus ejercicios en zonas con baja cobertura (habitaciones interiores, áreas rurales). Requerir conexión haría el sistema inútil en precisamente los momentos en que más se necesita.

---

### RNF-007: Persistencia local ante fallo de sincronización
**Categoría:** Disponibilidad y Confiabilidad  
**Descripción:** Si la sincronización de una sesión completada falla por error de red, los datos de la sesión —incluyendo métricas por ejercicio, puntajes y duración— deben conservarse íntegramente en la base de datos local Room, sin pérdida de información, hasta que la sincronización se complete exitosamente.  
**Criterio de medición:** En `SessionRepositoryImpl.syncSession()`, un error de red (`IOException`) no debe eliminar ni modificar el registro local. El campo `syncStatus` debe permanecer en `PENDING`. Al restaurarse la conectividad, `SyncSessionsWorker` debe detectar la sesión pendiente y sincronizarla. Verificado con `SyncSessionsWorkerTest` y `SessionRepositoryImplTest` usando mocks de error de red.  
**Justificación:** Los datos de sesión son registros clínicos. Su pérdida priva al terapeuta de información vital para evaluar el progreso del paciente y ajustar el plan terapéutico. En el contexto de la rehabilitación de parálisis facial, cada sesión registrada representa esfuerzo del paciente y evidencia médica.

---

### RNF-008: Reintento automático con backoff exponencial
**Categoría:** Disponibilidad y Confiabilidad  
**Descripción:** `SyncSessionsWorker`, gestionado por WorkManager, debe reintentar automáticamente la sincronización de sesiones pendientes ante errores de red (`IOException`), usando una política de backoff con un retardo inicial de 30 segundos que se incrementa exponencialmente, con un máximo de 3 intentos en total (el envío inicial y dos reintentos) antes de marcar la sesión con estado `ERROR`.  
**Criterio de medición:** Las constantes `BACKOFF_DELAY = 30L` con `BACKOFF_DELAY_UNIT = TimeUnit.SECONDS` y `MAX_ATTEMPTS = 3` en `SyncSessionsWorker.Companion` deben estar configuradas. La petición de trabajo debe especificar `BackoffPolicy.EXPONENTIAL`. Verificado con `SyncSessionsWorkerTest` simulando fallos consecutivos de red: con dos fallos seguidos de un intento exitoso la sesión se sincroniza, y con tres fallos la sesión queda en `ERROR` sin programar un cuarto intento.  
**Justificación:** Los reintentos inmediatos en bucle saturan la batería y la red del dispositivo. El backoff exponencial permite al sistema adaptarse a interrupciones transitorias de conectividad —comunes en dispositivos móviles— sin comprometer la experiencia del usuario ni el consumo energético, factor crítico para pacientes adultos mayores con dispositivos de gama básica.

---

### RNF-009: Idempotencia en creación de sesiones
**Categoría:** Disponibilidad y Confiabilidad  
**Descripción:** El endpoint `POST /api/v1/sessions` del backend debe ser idempotente: el cliente envía siempre un `id` UUID obligatorio generado en el dispositivo; si ese `id` ya existe para el mismo paciente, el servidor debe retornar la sesión existente con HTTP 200 sin crear un duplicado ni lanzar un error (una sesión nueva retorna HTTP 201), garantizando que las sesiones se cuenten exactamente una vez en el historial clínico, incluso ante envíos simultáneos.  
**Criterio de medición:** El DTO de creación rechaza con HTTP 400 una petición sin `id`. En `SessionsService.create()`, cuando `id` coincide con una sesión existente del mismo paciente, el método retorna el registro existente sin crear otro; si dos peticiones simultáneas compiten, la violación de unicidad de la clave primaria se captura y se retorna la sesión ya creada. Verificado con una prueba e2e de la API enviando dos peticiones POST con el mismo UUID (la primera responde 201, la segunda 200 y existe un único registro).  
**Justificación:** El cliente móvil puede enviar la misma sesión varias veces debido a reintentos de WorkManager o recuperaciones de error de red. Sin idempotencia, el historial del paciente acumularía sesiones duplicadas, distorsionando métricas clínicas como el promedio de puntaje y el conteo de sesiones realizadas.

---

### RNF-010: Robustez del pipeline de visión computacional
**Categoría:** Disponibilidad y Confiabilidad  
**Descripción:** Si `FaceLandmarkerHelper` no detecta un rostro en el frame actual o recibe un error del modelo, la aplicación debe continuar operando sin lanzar excepciones no manejadas ni interrumpir la sesión de ejercicio.  
**Criterio de medición:** El método `onResults()` del `LandmarkerListener` en `CalibrationScreen` y `PlayerViewModel` debe manejar el caso `faceLandmarks().firstOrNull() == null` sin crash. El método `onError()` debe registrar el error y mantener el estado de UI en el último estado válido. Verificado con pruebas unitarias que inyectan resultados vacíos y errores simulados.  
**Justificación:** Durante ejercicios de parálisis facial, el paciente puede moverse parcialmente fuera del encuadre o el modelo puede tardar más en un frame determinado. Una excepción no manejada que cierre la sesión haría perder el progreso del ejercicio y generaría frustración, especialmente en usuarios adultos mayores con poca tolerancia a errores tecnológicos.

---

## 3. Seguridad

### RNF-011: Cifrado de transmisiones con TLS 1.3
**Categoría:** Seguridad  
**Descripción:** Toda transmisión de datos entre la aplicación móvil y el servidor backend, y entre el portal web y el backend, debe realizarse sobre TLS 1.2 o superior, con TLS 1.3 como versión preferente. No se deben aceptar conexiones HTTP en texto plano ni versiones de TLS anteriores a 1.2 en entornos de producción.  
**Criterio de medición:** La configuración del servidor de producción debe rechazar conexiones TLS 1.1 y anteriores. Verificado con la herramienta `testssl.sh` o equivalente ejecutada contra el host de producción. En la aplicación Android, `OkHttpClient` (configurado en `NetworkModule`) debe forzar `ConnectionSpec.MODERN_TLS` (TLS 1.2 y 1.3) en las builds release, que además no permiten tráfico en texto plano. En entorno de desarrollo local, las URLs de `NEXT_PUBLIC_API_URL` y `DATABASE_URL` pueden usar HTTP.  
**Justificación:** La plataforma transmite datos clínicos sensibles: diagnósticos de parálisis facial, notas clínicas, grado de parálisis inicial (escala House-Brackmann) y credenciales de acceso. El marco legal aplicable —LFPDPPP en México— exige la adopción de medidas de seguridad técnicas proporcionales a la sensibilidad de los datos personales.

---

### RNF-012: Almacenamiento seguro de contraseñas (bcrypt) y PIN (HMAC-SHA256)
**Categoría:** Seguridad  
**Descripción:** Las contraseñas de los terapeutas deben almacenarse únicamente como hash bcrypt (campo `passwordHash` en la entidad `Therapist`). Ningún componente del sistema debe almacenar, registrar en logs ni transmitir contraseñas en texto plano. El PIN de acceso del paciente debe almacenarse como HMAC-SHA256 calculado con el secreto `PIN_HMAC_SECRET` (campo `accessCodeHash` en la entidad `Patient`), y el hash no debe aparecer en ninguna respuesta de la API.  
**Criterio de medición:** En `AuthService.validateUser()`, la verificación de contraseña utiliza `bcrypt.compare()`. En `PatientsService.generateAccessCode()`, el PIN se genera con `crypto.randomInt` y se hashea con `AccessCodeHasher` (`crypto.createHmac('sha256', PIN_HMAC_SECRET)`) antes de persistirse; la API se niega a arrancar si falta `PIN_HMAC_SECRET`. Una búsqueda de texto en el repositorio con `grep -r "password"` no debe revelar valores en claro en logs ni en código fuente. Verificado con inspección de código y pruebas unitarias de `AuthService`.  
**Justificación:** En el contexto de salud, una brecha de credenciales comprometería no solo la cuenta del terapeuta sino el acceso a los registros médicos de todos sus pacientes. BCrypt está diseñado específicamente para ser resistente a ataques de fuerza bruta mediante su función de trabajo configurable. El PIN, en cambio, tiene solo un millón de combinaciones y el login del paciente no incluye identificador, por lo que se necesita un hash determinista; el secreto del HMAC impide recuperar los PIN a partir de una copia de la base de datos, y el límite de intentos del login (RF-035) impide adivinarlos en línea.

---

### RNF-013: Almacenamiento del JWT en EncryptedSharedPreferences
**Categoría:** Seguridad  
**Descripción:** El token JWT de autenticación del paciente debe almacenarse exclusivamente en `EncryptedSharedPreferences` respaldado por Android Keystore (AES256-GCM para valores, AES256-SIV para claves), gestionado por la clase `TokenManager`. El token no debe escribirse en almacenamiento no cifrado, logs de sistema ni preferencias convencionales de Android.  
**Criterio de medición:** En `TokenManager.buildEncryptedSharedPreferences()`, se verifica que la instancia de `EncryptedSharedPreferences` use `MasterKey.KeyScheme.AES256_GCM`, `PrefValueEncryptionScheme.AES256_GCM` y `PrefKeyEncryptionScheme.AES256_SIV`. Una búsqueda de `SharedPreferences.edit()` sin cifrado en el codebase no debe retornar usos relacionados con el token. Verificado mediante inspección de código y prueba unitaria del flujo de guardado y recuperación.  
**Justificación:** El JWT concede acceso a los datos médicos del paciente. Si se almacena en preferencias convencionales, puede ser extraído en dispositivos con root o mediante copias de seguridad no cifradas. Android Keystore vincula las claves criptográficas al hardware del dispositivo, impidiendo su exportación incluso con acceso root.

---

### RNF-014: Aislamiento de datos por terapeuta
**Categoría:** Seguridad  
**Descripción:** Un terapeuta autenticado solo debe poder acceder, crear, modificar o eliminar registros de pacientes, rutinas y sesiones que le pertenezcan. Toda query a la base de datos que involucre entidades de pacientes debe incluir el filtro `therapistId` del usuario autenticado, obtenido del JWT.  
**Criterio de medición:** En `PatientsService.findAll()` y `findOne()`, la condición `where: { therapistId }` es obligatoria. En `SessionsService.findOne()`, se verifica `session.routine.patient.therapistId !== therapistId` y se lanza `ForbiddenException` ante una discrepancia. Verificado con pruebas de integración que intentan acceder a recursos de otro terapeuta usando un JWT válido pero de un terapeuta diferente, esperando respuesta HTTP 403.  
**Justificación:** En una clínica con múltiples terapeutas, la confidencialidad del expediente clínico es un requisito ético y legal. Un terapeuta no debe poder ver los pacientes de un colega, protegiendo tanto la privacidad del paciente como la integridad del diagnóstico clínico de cada profesional.

---

### RNF-015: PIN de acceso mostrado una sola vez
**Categoría:** Seguridad  
**Descripción:** El PIN de acceso generado por `PatientsService.generateAccessCode()` debe ser retornado al terapeuta únicamente en la respuesta de creación y nunca más recuperado ni mostrado por ningún endpoint o interfaz del sistema. El backend almacena exclusivamente el hash y no tiene mecanismo para reconstruir el PIN original.  
**Criterio de medición:** El campo `accessCode` en texto plano aparece únicamente en el objeto de respuesta del endpoint `POST /patients/:id/access-code`. El campo `accessCodeHash` en la base de datos no puede revertirse a texto plano. No existe ningún endpoint `GET` que retorne el PIN. Verificado con inspección de código de `PatientsService` y del esquema de `PatientResponse` en `shared-types`.  
**Justificación:** Un PIN de acceso visible indefinidamente en la interfaz del terapeuta representa una superficie de ataque innecesaria. Si la pantalla del terapeuta es observada por terceros o si hay una brecha en la sesión web, el acceso móvil del paciente podría ser comprometido. La política de "mostrar una sola vez" obliga a generar un nuevo PIN si el original se pierde.

---

### RNF-016: Cumplimiento LFPDPPP
**Categoría:** Seguridad  
**Descripción:** El sistema debe cumplir con los principios de la Ley Federal de Protección de Datos Personales en Posesión de Particulares (LFPDPPP) aplicables a datos de salud: finalidad (datos recopilados solo para rehabilitación), proporcionalidad (no se recopilan más datos de los necesarios), responsabilidad (acceso controlado por roles) y seguridad (medidas técnicas y organizativas proporcionales a la sensibilidad de los datos).  
**Criterio de medición:** Los campos `diagnosis`, `clinicalNotes`, `initialParalysisDegree` y `dateOfBirth` deben estar presentes únicamente en modelos de dominio con acceso restringido por JWT. El aviso de privacidad debe estar accesible desde la interfaz del terapeuta. No se deben transferir datos de pacientes a terceros sin autorización. Verificado mediante revisión de arquitectura y lista de verificación de cumplimiento legal.  
**Justificación:** Los datos procesados por Symma Platform —diagnóstico de parálisis facial, grado de afectación, notas clínicas y video en tiempo real del rostro del paciente— constituyen datos sensibles de salud bajo la LFPDPPP. Su mal manejo puede derivar en sanciones del INAI y en daño a la reputación clínica de los terapeutas usuarios de la plataforma.

---

### RNF-017: Almacenamiento externo de imágenes médicas
**Categoría:** Seguridad  
**Descripción:** Las imágenes capturadas durante sesiones de rehabilitación (snapshot del mejor intento de cada ejercicio) deben almacenarse en un servicio de almacenamiento compatible con S3 (MinIO en el entorno local), referenciadas en la base de datos únicamente mediante la clave del objeto. Ninguna imagen médica debe persistirse directamente como blob en PostgreSQL ni exponerse con URL pública: la app móvil la sube con una URL firmada de subida y el portal la muestra con una URL firmada de lectura de corta duración.  
**Criterio de medición:** El esquema de Prisma no debe contener campos de tipo `Bytes` para imágenes. La referencia a la imagen (`SessionItem.snapshotKey`) debe ser de tipo `String`. Las respuestas de la API nunca contienen la clave cruda, solo `snapshotUrl` firmada. Un escaneo del schema.prisma no debe revelar campos binarios de imagen. Verificado con inspección del esquema Prisma en `packages/database`.  
**Justificación:** Almacenar imágenes en PostgreSQL degrada el rendimiento de las consultas, dificulta la escalabilidad y complica el cumplimiento del derecho de acceso y rectificación de la LFPDPPP. El almacenamiento S3 permite control de acceso granular, versionado y eliminación segura de imágenes médicas de forma independiente de los metadatos clínicos.

---

## 4. Usabilidad y Accesibilidad

### RNF-018: Área mínima de botones táctiles (56dp)
**Categoría:** Usabilidad y Accesibilidad  
**Descripción:** Todos los elementos interactivos táctiles de la aplicación móvil —botones de acción, teclas del teclado numérico, botones de control de sesión— deben tener una altura mínima de 56dp y un área táctil mínima equivalente, superando el mínimo de 48dp establecido por WCAG 2.5.5.  
**Criterio de medición:** En `NumericKeypad`, cada `KeypadButton` mide 80dp y solo se reduce cuando el ancho disponible no alcanza ni con la separación mínima de 16dp (RNF-019); con cualquier ancho de al menos 200dp las teclas miden 56dp o más, y Android garantiza al menos 320dp de ancho de pantalla. En `SymmaButton`, la altura mínima debe ser 56dp. Verificado mediante inspección de código de los componentes en `presentation/auth/components/` y `presentation/components/design/`, y validado con Android Layout Inspector durante pruebas manuales.  
**Justificación:** Los pacientes con parálisis facial frecuentemente experimentan déficits motores finos en manos, especialmente en pacientes con condiciones neurológicas asociadas o adultos mayores. Botones pequeños incrementan la tasa de errores de pulsación, generando frustración y abandono del programa de rehabilitación.

---

### RNF-019: Teclado numérico de gran tamaño para entrada de PIN
**Categoría:** Usabilidad y Accesibilidad  
**Descripción:** La pantalla de autenticación por PIN (`LoginScreen`) debe presentar un teclado numérico con teclas circulares de 80dp de diámetro, separación preferente de 48dp entre teclas y numerales en fuente de 32sp. En pantallas angostas, donde tres teclas de 80dp con 48dp de separación no caben, la separación se reduce hasta un mínimo de 16dp antes de reducir el tamaño de las teclas, y todas las teclas conservan el mismo tamaño. El teclado debe ser el único método de entrada del PIN, sin teclado del sistema operativo.  
**Criterio de medición:** En `NumericKeypad`, el tamaño preferente de tecla es `80.dp`, la separación entre teclas se calcula a partir del ancho disponible dentro del rango de `16.dp` a `48.dp` y el tamaño de fuente es `fontSize = 32.sp`. En una pantalla de 360dp de ancho las teclas mantienen 80dp. Verificado con revisión de código de `apps/mobile/app/src/main/java/com/symma/app/presentation/auth/components/NumericKeypad.kt` y prueba visual en dispositivo físico.  
**Justificación:** El PIN es la única forma de acceso al sistema para el paciente. Un teclado difícil de usar en la primera pantalla de la aplicación puede desmotivar al paciente antes de comenzar su sesión de rehabilitación. El teclado personalizado garantiza una experiencia consistente y adaptada a las capacidades motrices del usuario objetivo.

---

### RNF-020: Contraste mínimo de texto 4.5:1 (WCAG AA)
**Categoría:** Usabilidad y Accesibilidad  
**Descripción:** Todo texto con contenido informativo en la aplicación móvil y el portal web debe mantener una relación de contraste mínima de 4.5:1 entre el color del texto y el color de fondo, conforme al criterio de éxito 1.4.3 de WCAG 2.1 nivel AA.  
**Criterio de medición:** El color de marca para texto y controles es Teal 700 (`#0F766E`), con una relación de contraste de 5.47:1 sobre fondo blanco, cumpliendo el mínimo. El tono Teal 600 (`#0D9488`) del diseño original solo alcanza 3.74:1 sobre blanco, por lo que no debe usarse para texto informativo ni como fondo de texto blanco. Los textos de instrucción sobre fondo negro con opacidad 50% (`Color.Black.copy(alpha = 0.5f)`) en la pantalla de calibración deben superar 4.5:1. Verificado con la herramienta Colour Contrast Analyser o axe DevTools (web). En Android, verificado con la auditoría de accesibilidad del Asistente de accesibilidad de Android Studio.  
**Justificación:** Pacientes con parálisis facial de causa central (accidentes cerebrovasculares) pueden tener alteraciones visuales asociadas. Un contraste insuficiente dificulta la lectura de instrucciones durante ejercicios que requieren concentración simultánea en los movimientos faciales y en las guías visuales de la pantalla.

---

### RNF-021: Tamaño mínimo de fuente para instrucciones
**Categoría:** Usabilidad y Accesibilidad  
**Descripción:** Los textos de instrucción mostrados al paciente durante la ejecución de ejercicios deben renderizarse usando el estilo `bodyLarge` del sistema tipográfico, definido en 18sp con altura de línea de 28sp, sin reducirse por escalado del sistema por debajo de 18sp.  
**Criterio de medición:** En `Type.kt`, `bodyLarge` está definido con `fontSize = 18.sp` y `lineHeight = 28.sp`. Los componentes `InstructionText` y `DistanceWarningText` en `CalibrationScreen` utilizan `MaterialTheme.typography.bodyLarge`. Verificado con inspección de código de `apps/mobile/app/src/main/java/com/symma/app/core/theme/Type.kt` y prueba visual con el tamaño de fuente del sistema configurado en "Grande".  
**Justificación:** Los adultos mayores y pacientes con estrés visual (frecuente tras accidentes cerebrovasculares) requieren tamaños de texto superiores al mínimo convencional de 14sp. El tamaño de 18sp permite leer las instrucciones durante el ejercicio sin acercar el dispositivo, manteniendo la distancia adecuada para la calibración de MediaPipe (entre el 15% y el 30% del área de la imagen).

---

### RNF-022: Pantalla activa durante sesión de ejercicios
**Categoría:** Usabilidad y Accesibilidad  
**Descripción:** Durante la ejecución de una sesión de ejercicios en `PlayerScreen`, la pantalla del dispositivo debe mantenerse encendida y sin apagarse por inactividad, mediante la aplicación del flag `FLAG_KEEP_SCREEN_ON` en la ventana de la actividad.  
**Criterio de medición:** En `PlayerScreen`, el bloque `DisposableEffect(Unit)` debe llamar a `window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)` al iniciarse y `window?.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)` al salir de la pantalla. Verificado con inspección del código fuente y prueba funcional dejando el dispositivo inmóvil durante 3 minutos con el timeout de pantalla configurado en 30 segundos.  
**Justificación:** Los ejercicios de rehabilitación facial requieren que el paciente mire el espejo de cámara durante series de 30 a 60 segundos. Si la pantalla se apaga, el paciente debe desbloquear el dispositivo, interrumpiendo el ejercicio e invalidando la medición de la serie. Los pacientes con parálisis facial pueden tener dificultades adicionales para interactuar rápidamente con el dispositivo.

---

### RNF-023: Vista de cámara en modo espejo
**Categoría:** Usabilidad y Accesibilidad  
**Descripción:** La vista previa de la cámara frontal en las pantallas de calibración y ejecución de ejercicios debe presentarse en modo espejo —reflejo horizontal— para que el paciente perciba el movimiento del lado correcto de su rostro de forma intuitiva, como si se mirara en un espejo real.  
**Criterio de medición:** En `FaceLandmarkerHelper.analyze()`, la transformación de bitmap aplica `matrix.postScale(-1f, 1f, imageProxy.width.toFloat(), imageProxy.height.toFloat())` antes de procesar con MediaPipe. En `CameraPreview`, el `PreviewView` refleja el stream visualmente. Verificado con inspección de código de `apps/mobile/app/src/main/java/com/symma/app/presentation/components/camera/FaceLandmarkerHelper.kt` y prueba visual: al mover el dedo de derecha a izquierda frente al dispositivo, el movimiento en pantalla debe reflejarse en la misma dirección que percibe el usuario.  
**Justificación:** La rehabilitación de parálisis facial depende de la biofeedback visual: el paciente observa su propio rostro para corregir movimientos asimétricos. Si la imagen no está en modo espejo, el lado izquierdo del rostro aparece a la derecha en pantalla, invirtiendo la referencia visual y pudiendo inducir patrones de movimiento incorrectos que dificulten la recuperación neuromotora.

---

### RNF-024: Retroalimentación multimodal durante ejercicios
**Categoría:** Usabilidad y Accesibilidad  
**Descripción:** El sistema de retroalimentación durante ejercicios debe ser multimodal: además de indicadores visuales de progreso (colores verde/naranja/rojo y barra de progreso), debe incluir retroalimentación auditiva (tonos del sistema mediante `ToneGenerator`) y táctil (vibración mediante `Vibrator`) para confirmación de eventos clave como completar una repetición o finalizar la calibración.  
**Criterio de medición:** En `CalibrationScreen`, `playCompletionSound()` usa `ToneGenerator` con `TONE_PROP_ACK` y `triggerVibration()` activa `VibrationEffect.createOneShot(100ms)` al completar la calibración. En `PlayerScreen`, `playPlayerEventSound()` distingue entre `PlayerEvent.PlayTick`, `PlayDing` y `PlaySuccess` con diferentes tonos. Verificado con prueba funcional verificando que los 3 modalidades sean perceptibles individualmente (silenciando audio para verificar vibración, etc.).  
**Justificación:** Los pacientes con parálisis facial pueden tener déficits visuales periféricos que reduzcan la percepción de indicadores de color. La retroalimentación auditiva y táctil garantiza que eventos importantes del ejercicio sean percibidos incluso cuando la atención visual está enfocada en la corrección del movimiento facial, mejorando la adherencia al protocolo terapéutico.

---

## 5. Mantenibilidad y Escalabilidad

### RNF-025: Gestión centralizada con Turborepo y pnpm
**Categoría:** Mantenibilidad y Escalabilidad  
**Descripción:** El proyecto debe organizarse como un monorepo gestionado con Turborepo y pnpm workspaces, de modo que las dependencias compartidas, los scripts de construcción y las verificaciones de tipos se ejecuten de forma coordinada y con caché de compilación entre paquetes.  
**Criterio de medición:** La ejecución de `pnpm turbo build` en la raíz del repositorio debe compilar correctamente `packages/shared-types`, `packages/database`, `apps/api` y `apps/web` en el orden correcto definido en `turbo.json` (`dependsOn: ["^build"]`). Una segunda ejecución sin cambios debe completarse en menos de 5 segundos gracias al caché de Turborepo. Verificado con `turbo.json` y la estructura de `pnpm-workspace.yaml`.  
**Justificación:** Con tres aplicaciones (API, Web, Mobile) y paquetes compartidos, un sistema de construcción monolítico generaría compilaciones completas ante cualquier cambio. Turborepo elimina trabajo redundante mediante caché de outputs, reduciendo el tiempo de CI/CD y permitiendo que el equipo de desarrollo (potencialmente pequeño en un contexto académico o startup) itere con rapidez.

---

### RNF-026: Tipos compartidos como fuente única de verdad
**Categoría:** Mantenibilidad y Escalabilidad  
**Descripción:** Las interfaces TypeScript que representan contratos entre el backend y el frontend —incluyendo `SessionDetailResponse`, `RoutineHistoryResponse`, `PatientResponse` y `PaginatedResponse`— deben definirse exclusivamente en el paquete `@symma/shared-types`, siendo importadas tanto por `apps/api` como por `apps/web` sin duplicación.  
**Criterio de medición:** Una búsqueda de definiciones de interfaz con el patrón `interface.*Response` en `apps/api/src` y `apps/web/src` no debe retornar duplicados de las interfaces definidas en `packages/shared-types`. Verificado con `grep -r "interface.*Response" apps/api/src apps/web/src` y confirmando que los resultados son únicamente importaciones, no declaraciones. Actualmente verificado en `SessionsService` que importa `SessionDetailResponse` de `@symma/shared-types`.  
**Justificación:** Sin un paquete de tipos compartidos, un cambio en la forma de la respuesta del API requeriría actualizar tipos en el backend y en el frontend de forma separada, siendo fuente habitual de bugs difíciles de detectar en tiempo de compilación. La fuente única de verdad garantiza que compilar el proyecto es suficiente para detectar inconsistencias de contrato.

---

### RNF-027: Contratos de API en OpenAPI YAML
**Categoría:** Mantenibilidad y Escalabilidad  
**Descripción:** Los contratos de los endpoints REST de la plataforma deben estar documentados en archivos OpenAPI 3.0 YAML ubicados en el directorio `specs/`, cubriendo al menos los módulos de autenticación, pacientes, rutinas, sesiones, analítica y mobile. La documentación debe mantenerse sincronizada con la implementación real del backend.  
**Criterio de medición:** Los archivos YAML en `specs/001-api-contracts/contracts/` (auth.yaml, patients.yaml, routines.yaml, sessions.yaml, analytics.yaml, mobile.yaml) deben pasar validación con `openapi-generator-cli validate` sin errores. El endpoint Swagger en `GET /api/docs` generado por NestJS debe reflejar los mismos endpoints. Verificado con ejecución de `pnpm generate:openapi`.  
**Justificación:** En una plataforma de salud con múltiples clientes (web y mobile), el contrato de API es el documento de referencia para el desarrollo paralelo de frontend y backend. Sin documentación formal en OpenAPI, los cambios de API se comunican de forma informal, generando regresiones que afectan la sincronización de datos clínicos.

---

### RNF-028: Patrón Strategy para el motor de ejercicios
**Categoría:** Mantenibilidad y Escalabilidad  
**Descripción:** El motor de evaluación de ejercicios faciales debe implementar el patrón Strategy: cada tipo de ejercicio (sonrisa, cejas, mandíbula, beso, ojos, ojos inverso) debe encapsularse en una clase que implemente la interfaz `ExerciseStrategy`, siendo seleccionada por `ExerciseStrategyFactory` según el `MobileModule` del ejercicio. Añadir un nuevo tipo de ejercicio debe requerir únicamente crear una nueva clase `Strategy` y registrarla en el `Factory`, sin modificar el `PlayerViewModel`.  
**Criterio de medición:** La interfaz `ExerciseStrategy` define `calculateScore(shapes, baseline, difficulty): Float`. Las clases `SmileStrategy`, `BrowsStrategy`, `JawStrategy`, `KissStrategy`, `EyesStrategy` y `EyesInverseStrategy` implementan dicha interfaz. `ExerciseStrategyFactory.getStrategy(module)` retorna la instancia correcta por enum. Verificado con `StrategiesTest` que prueba cada estrategia con datos de baseline conocidos, y con inspección de que `PlayerViewModel` no contiene lógica específica por tipo de ejercicio.  
**Justificación:** El catálogo de ejercicios de rehabilitación facial evoluciona con la práctica clínica: nuevos tipos de movimiento pueden añadirse según avanza la investigación terapéutica. El patrón Strategy garantiza que añadir un ejercicio es un cambio localizado que no introduce riesgo de regresión en los ejercicios existentes.

---

### RNF-029: Arquitectura Clean (MVVM) en Android
**Categoría:** Mantenibilidad y Escalabilidad  
**Descripción:** La aplicación Android debe seguir los principios de Clean Architecture con separación explícita en tres capas: `domain` (modelos, interfaces de repositorio, lógica de negocio y casos de uso), `data` (implementaciones de repositorio, entidades Room, DTOs de red, mappers) y `presentation` (ViewModels, composables, estados de UI). Las dependencias solo deben fluir hacia adentro (presentation → domain ← data).  
**Criterio de medición:** El paquete `domain` no debe importar clases de `data` ni de `presentation`. El paquete `presentation` no debe importar clases de `data` directamente. Verificado con la herramienta Dependency Guard o inspección manual con `grep -r "import com.symma.app.data" apps/mobile/app/src/main/java/com/symma/app/domain/`. Las pruebas unitarias de `domain` deben poder ejecutarse sin dependencias de Android framework, verificado en `SymmetryCalculatorTest` y `ExerciseStrategyTest`.  
**Justificación:** La aplicación móvil es el componente de mayor complejidad del sistema: gestiona CV en tiempo real, persistencia local, sincronización en background y UI reactiva. Sin una separación de capas clara, añadir nuevos tipos de ejercicio, cambiar la estrategia de sincronización o migrar la lógica de calibración se convierte en una tarea de alto riesgo que requiere modificar múltiples clases acopladas.

---

### RNF-030: Versionado de esquema con Prisma Migrations
**Categoría:** Mantenibilidad y Escalabilidad  
**Descripción:** Todos los cambios al esquema de la base de datos PostgreSQL deben realizarse mediante migraciones de Prisma gestionadas con `prisma migrate`, generando archivos SQL versionados y auditables en `packages/database/prisma/migrations/`. No se permiten cambios manuales directos al esquema de producción.  
**Criterio de medición:** El directorio de migraciones debe contener al menos una migración inicial con todas las tablas del sistema. Cada cambio de esquema en PRs debe incluir el archivo de migración correspondiente. El comando `prisma migrate deploy` en el pipeline de CI debe ejecutarse sin errores contra una base de datos vacía. Verificado con el paso «Apply migrations to an empty database» de `.github/workflows/ci.yml`, que se ejecuta en cada push contra un servicio PostgreSQL 15 vacío; el contenedor de la API ejecuta además `prisma migrate deploy` al arrancar.  
**Justificación:** Los registros clínicos en una base de datos de salud no pueden perderse por migraciones mal aplicadas. Prisma Migrations genera SQL predecible y reversible, permite revisión de cambios de esquema en pull requests y garantiza que los entornos de desarrollo, staging y producción mantengan la misma estructura de base de datos.

---

## 6. Portabilidad y Compatibilidad

### RNF-031: Compatibilidad Android Min SDK 26 / Target SDK 34
**Categoría:** Portabilidad y Compatibilidad  
**Descripción:** La aplicación Android debe ejecutarse correctamente en dispositivos con Android 8.0 Oreo (API 26) como versión mínima, y estar compilada con Target SDK 34 (Android 14) para aprovechar las últimas APIs de seguridad y rendimiento. Funcionalidades específicas de versiones superiores deben usar verificaciones de versión en tiempo de ejecución.  
**Criterio de medición:** En `app/build.gradle.kts`, `minSdk = 26` y `targetSdk = 34`. Las llamadas a APIs de Android 8.1+ (como `VibratorManager` en Android 12+) utilizan `Build.VERSION.SDK_INT >= Build.VERSION_CODES.S` como se implementa en `triggerVibration()` de `CalibrationScreen`. Verificado ejecutando la aplicación en un emulador con API 26 y completando un flujo de sesión completo sin crashes.  
**Justificación:** Android 8.0 representa el corte mínimo que permite el uso de `EncryptedSharedPreferences` (Android Keystore), `WorkManager` con garantías de ejecución, y CameraX con todas sus características. Apuntar a versiones anteriores requeriría comprometer la seguridad o la funcionalidad offline. Min SDK 26 cubre más del 95% de los dispositivos Android activos en el mercado latinoamericano.

---

### RNF-032: Compatibilidad con navegadores modernos
**Categoría:** Portabilidad y Compatibilidad  
**Descripción:** El portal web debe funcionar correctamente en las dos versiones más recientes de Chrome, Firefox, Safari y Edge, tanto en escritorio como en tablets. No se soportan Internet Explorer ni versiones de Chrome anteriores a la versión N-2.  
**Criterio de medición:** La configuración de `browserslist` en el proyecto Next.js debe especificar las últimas 2 versiones de los navegadores objetivo. La suite de pruebas con Vitest/Testing Library (`apps/web/vitest.config.ts`) debe ejecutarse sin errores. Una prueba manual del flujo de login, gestión de pacientes y visualización de analíticas debe completarse en Chrome, Firefox y Safari sin errores de consola.  
**Justificación:** Los terapeutas acceden al portal desde equipos clínicos que pueden tener políticas de actualización de software distintas. La compatibilidad con las dos versiones más recientes garantiza que usuarios en clínicas con ciclos de actualización de 6 meses puedan usar la plataforma sin fricciones, sin requerir soporte para navegadores obsoletos con vulnerabilidades de seguridad conocidas.

---

### RNF-033: API REST stateless
**Categoría:** Portabilidad y Compatibilidad  
**Descripción:** El backend NestJS debe implementar una API REST completamente stateless: toda la información de autenticación y contexto del usuario debe transmitirse en cada petición mediante el header `Authorization: Bearer <JWT>`. El servidor no debe mantener sesiones en memoria ni en base de datos.  
**Criterio de medición:** El `JwtStrategy` en `apps/api/src/auth/jwt.strategy.ts` valida el JWT en cada petición. No existen tablas de sesión en el esquema de Prisma. El backend puede escalarse horizontalmente a múltiples instancias sin coordinación de estado. Verificado con el prefijo global `api/v1` en `main.ts` y la estrategia JWT en `jwt-auth.guard.ts`.  
**Justificación:** Una API stateless puede ser consumida por cualquier cliente HTTP —el portal web Next.js, la app Android y potenciales clientes futuros como apps iOS o sistemas de telemedicina— sin configuración especial. Esto también simplifica el escalado horizontal del backend para soportar múltiples clínicas simultáneas.

---

### RNF-034: Entorno de desarrollo reproducible con Docker Compose
**Categoría:** Portabilidad y Compatibilidad  
**Descripción:** El entorno de desarrollo local —incluyendo la base de datos PostgreSQL 15, el almacenamiento de imágenes compatible con S3 (MinIO), el backend NestJS y el portal web Next.js— debe poder levantarse de forma reproducible con un único comando (`docker compose up`) en cualquier máquina con Docker instalado, a partir de un archivo `.env` creado desde `.env.example`, usando puertos no estándar para evitar conflictos (Web: 4000, API: 4001, PostgreSQL: 5440, MinIO: 9000 y consola 9001), configurables por variables de entorno.  
**Criterio de medición:** El archivo `docker-compose.yml` define los servicios `postgres` (imagen `postgres:15-alpine`, puerto `5440:5432`), `minio` (puertos `9000` y `9001`) con `minio-init`, que crea el bucket de snapshots, `api` (puerto `4001:4001`, depende del healthcheck de postgres y de la creación del bucket, y aplica `prisma migrate deploy` al arrancar) y `web` (puerto `4000:4000`, depende del healthcheck de la API). El healthcheck de postgres usa `pg_isready` con intervalo de 10s, timeout de 5s y 5 reintentos. Con las imágenes ya construidas, ejecutar `docker compose up` debe resultar en los servicios disponibles, con la base de datos migrada, en menos de 60 segundos.  
**Justificación:** Un entorno no reproducible es la principal fuente de "funciona en mi máquina" en proyectos con múltiples desarrolladores o en contextos de evaluación académica. Docker Compose garantiza que el revisor o colaborador pueda ejecutar el sistema sin configuración manual de PostgreSQL, variables de entorno o conflictos de versiones de Node.js.

---

## 7. Internacionalización

### RNF-035: Soporte multiidioma (español e inglés)
**Categoría:** Internacionalización  
**Descripción:** Los tres componentes del sistema —portal web, backend API y aplicación móvil Android— deben soportar los idiomas español (es) e inglés (en) para todos los textos visibles al usuario: etiquetas de interfaz, mensajes de error, instrucciones de ejercicio y notificaciones. El idioma predeterminado debe ser español.  
**Criterio de medición:** El paquete `@symma/i18n` debe exportar los namespaces de traducción para ambos idiomas. En el portal web, `next-intl` debe cargar las traducciones según el locale activo. En Android, las cadenas de `res/values/strings.xml` deben tener su equivalente en `res/values-en/strings.xml`. Verificado con `EnumTranslationsTest` en Android y los tests del paquete i18n en `packages/`.  
**Justificación:** Symma Platform es desarrollada en México para un mercado hispanohablante, pero la plataforma busca ser adoptable en mercados de habla inglesa. La internacionalización desde el inicio del proyecto evita la costosa tarea de retrofitting de cadenas de texto codificadas directamente en el código fuente, y permite a clínicas bilingües ofrecer la interfaz en el idioma del terapeuta.

---

### RNF-036: Cambio de idioma sin reiniciar la aplicación
**Categoría:** Internacionalización  
**Descripción:** El cambio de idioma del sistema debe aplicarse en tiempo de ejecución sin requerir reiniciar la aplicación ni recargar la página completa. El portal web debe actualizar todos los textos visibles al cambiar el locale activo; la aplicación Android debe aplicar el nuevo idioma en la siguiente composición de las pantallas.  
**Criterio de medición:** En el portal web con `next-intl`, cambiar el locale mediante el componente de selección de idioma debe actualizar los textos visibles sin navegación de página completa (`window.location.reload`). En Android, el cambio de idioma en las preferencias del sistema debe reflejarse al volver a la aplicación sin requerer `Activity.recreate()` explícito, aprovechando la integración nativa de `StringResource` con Compose.  
**Justificación:** En un entorno clínico, un terapeuta puede necesitar cambiar el idioma de la interfaz entre consultas con pacientes de distintos idiomas. Requerir un reinicio de la aplicación interrumpe el flujo de trabajo y puede percibirse como un defecto de calidad en una plataforma de salud profesional.

---

### RNF-037: Localización de mensajes de error del backend
**Categoría:** Internacionalización  
**Descripción:** Los mensajes de error del backend NestJS que llegan al usuario final —errores de validación, acceso denegado, recurso no encontrado— deben estar disponibles en español e inglés, seleccionados según el header `Accept-Language` de la petición HTTP entrante.  
**Criterio de medición:** El módulo `I18nModule` en `apps/api/src/i18n/i18n.module.ts` debe proveer el servicio `I18nService` que retorna mensajes según el idioma de la petición. Los tests en `apps/api/src/i18n/i18n.service.spec.ts` deben verificar que `i18nService.translate('key', 'es')` retorna el texto en español y `i18nService.translate('key', 'en')` en inglés. Una petición con `Accept-Language: en` debe recibir mensajes en inglés.  
**Justificación:** La aplicación móvil del paciente y el portal web del terapeuta pueden estar configurados en idiomas distintos. Si los mensajes de error del servidor llegan en un idioma diferente al esperado por el cliente, el paciente o terapeuta puede no comprender qué ocurrió ni cómo resolverlo, afectando la continuidad del proceso terapéutico.

---

## 8. Privacidad

### RNF-038: Procesamiento on-device sin envío de video a la nube
**Categoría:** Privacidad  
**Descripción:** El stream de vídeo de la cámara frontal del paciente debe procesarse exclusivamente en el dispositivo móvil mediante MediaPipe FaceLandmarker. Ningún stream ni secuencia de video debe transmitirse a servidores externos. Solo se envían al backend los metadatos resultantes del análisis (puntajes de ejercicio, simetría, duración, repeticiones completadas y la calibración del paciente) y, como única imagen, un snapshot del mejor intento de cada ejercicio, que se sube al almacenamiento S3 de la plataforma mediante una URL firmada (RNF-017).  
**Criterio de medición:** Una revisión del código de `FaceLandmarkerHelper`, `SessionRepositoryImpl` y `SymmaApiService` no debe revelar llamadas a APIs de carga de video o streaming de imágenes hacia el servidor; la única subida de imagen es el `PUT` del snapshot JPEG a la URL obtenida de `POST /api/v1/mobile/snapshots/upload-url`. El payload de `POST /api/v1/sessions` debe contener únicamente campos de metadatos (números, cadenas y JSON), nunca datos de imagen. Verificado con análisis estático y captura de tráfico de red con Wireshark/Charles Proxy durante una sesión de ejercicio.  
**Justificación:** El video del rostro de un paciente es un dato biométrico de alta sensibilidad bajo la LFPDPPP. Procesar todo on-device elimina el riesgo de interceptación del stream, elimina la necesidad de almacenamiento de video en servidores y garantiza que el consentimiento del paciente se limite al uso terapéutico local del dato biométrico, sin cesión a terceros.

---

### RNF-039: Protección de datos clínicos sensibles
**Categoría:** Privacidad  
**Descripción:** Los campos de datos sensibles de salud —`diagnosis`, `clinicalNotes`, `initialParalysisDegree` y `dateOfBirth` de la entidad `Patient`— deben estar protegidos mediante control de acceso basado en JWT. No deben exponerse en respuestas de APIs públicas ni en logs del sistema. Su acceso debe estar restringido exclusivamente al terapeuta propietario del registro.  
**Criterio de medición:** El modelo `PatientResponse` en `shared-types` incluye los campos sensibles, pero el endpoint de listado `GET /patients` solo retorna estos campos al terapeuta autenticado propietario (`therapistId` verificado). Los logs de NestJS configurados con el `ValidationPipe` global no deben registrar el contenido de `clinicalNotes` o `diagnosis`. Verificado con una auditoría de los endpoints de pacientes y revisión de configuración de logging.  
**Justificación:** El diagnóstico de parálisis facial, el grado House-Brackmann y las notas clínicas son datos de salud que revelan condiciones médicas del paciente. Su exposición indebida viola el derecho a la privacidad del paciente y puede tener consecuencias legales bajo la LFPDPPP, que clasifica los datos de salud como datos sensibles con régimen de protección reforzado.

---

### RNF-040: Acceso controlado de pacientes por terapeuta
**Categoría:** Privacidad  
**Descripción:** Un paciente no debe poder crear su propia cuenta en la plataforma. El acceso del paciente a la aplicación móvil debe estar condicionado a que su terapeuta le genere un PIN de acceso de 6 dígitos. El terapeuta puede revocar el acceso en cualquier momento eliminando el hash del PIN, sin afectar el historial clínico del paciente.  
**Criterio de medición:** No existe un endpoint `POST /patients/register` de auto-registro. El endpoint de creación de paciente `POST /patients` requiere autenticación de terapeuta. `PatientsService.generateAccessCode()` genera el PIN solo cuando el terapeuta lo solicita. `PatientsService.revokeAccessCode()` establece `accessCodeHash = null`, impidiendo el acceso sin eliminar los datos. Verificado con pruebas de integración intentando crear un paciente sin JWT de terapeuta (esperando HTTP 401).  
**Justificación:** En rehabilitación de parálisis facial, el programa de ejercicios es prescrito y supervisado por un profesional de la salud. Permitir auto-registro implicaría que pacientes pudieran ejecutar ejercicios sin supervisión clínica, lo que en algunos estadios de la parálisis puede ser contraproducente o incluso perjudicial para la recuperación neuromotora.

---

## 9. Infraestructura y Despliegue

### RNF-041: PostgreSQL con healthcheck en Docker
**Categoría:** Infraestructura y Despliegue  
**Descripción:** El servicio de base de datos PostgreSQL 15 en el entorno Dockerizado debe incluir un healthcheck que verifique la disponibilidad del servidor antes de que los servicios dependientes (`api`) intenten conectarse. El servicio `api` debe configurarse con `depends_on: postgres: condition: service_healthy`.  
**Criterio de medición:** En `docker-compose.yml`, el servicio `postgres` tiene configurado `healthcheck.test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]` con `interval: 10s`, `timeout: 5s` y `retries: 5`. El servicio `api` tiene `depends_on: postgres: condition: service_healthy`. Ejecutar `docker-compose up` en frío no debe producir errores de conexión del API a PostgreSQL. Verificado con `docker-compose ps` mostrando `healthy` para el contenedor de base de datos antes de que el API esté `running`.  
**Justificación:** Sin healthcheck, el contenedor del API NestJS puede iniciar antes de que PostgreSQL esté aceptando conexiones, resultando en errores de arranque que requieren reinicio manual. En un entorno de demostración académica o despliegue en CI, estos errores intermitentes son difíciles de diagnosticar y pueden dar la impresión incorrecta de que la plataforma es inestable.

---

### RNF-042: Variables de entorno sin credenciales en código fuente
**Categoría:** Infraestructura y Despliegue  
**Descripción:** Ninguna credencial, clave secreta, cadena de conexión o clave de API debe estar codificada directamente en el código fuente del repositorio. Toda configuración sensible debe gestionarse mediante variables de entorno definidas en archivos `.env` (excluidos de git) con sus correspondientes `.env.example` (incluidos en git sin valores reales).  
**Criterio de medición:** El archivo `.gitignore` debe incluir `.env` y `.env.local`. Los archivos `.env.example` en la raíz, en `apps/api/` y en `apps/web/` deben existir versionados con todas las variables requeridas pero sin valores reales. `docker-compose.yml` no define valores por defecto para secretos (`POSTGRES_PASSWORD`, `JWT_SECRET`, `PIN_HMAC_SECRET`, `AUTH_SECRET`, `MINIO_ROOT_PASSWORD`) y se niega a arrancar si falta alguno; la API se niega a arrancar sin `JWT_SECRET` ni `PIN_HMAC_SECRET`. Una búsqueda de `grep -r "jwt_secret\|postgres_password\|DATABASE_URL" --include="*.ts" --include="*.tsx" --include="*.kt" apps/` no debe retornar valores hardcodeados. Verificado con un escaneo de secretos con `gitleaks` o herramienta equivalente.  
**Justificación:** El repositorio de Symma Platform puede ser público (contexto académico de tesis) o compartido con evaluadores externos. Credenciales hardcodeadas expuestas en el historial de git son una de las causas más frecuentes de brechas de seguridad en proyectos de software. En una plataforma de salud, una brecha de base de datos podría comprometer registros médicos de pacientes reales.
