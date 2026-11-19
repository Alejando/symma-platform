# Historias de Usuario — Symma Platform
## Plataforma de Rehabilitación Facial con Visión Computacional

**Proyecto:** Symma Platform  
**Metodología:** Scrumban  
**Versión del documento:** 1.0  
**Autor:** Alejandro Prado  

---

## Tabla de Contenidos

1. [Tabla de Resumen](#tabla-de-resumen)
2. [Sprint 0 — Infraestructura y Portal Web Base](#sprint-0--infraestructura-y-portal-web-base)
3. [Sprint 1 — Portal Web Completo y Gateway Móvil](#sprint-1--portal-web-completo-y-gateway-móvil)
4. [Sprint 2 — Aplicación Android](#sprint-2--aplicación-android)
5. [Sprint 3 — Computer Vision con MediaPipe](#sprint-3--computer-vision-con-mediapipe)
6. [Sprint 4 — Motor Clínico Avanzado](#sprint-4--motor-clínico-avanzado)
7. [Sprint 5 — Contratos, Sincronización e Internacionalización](#sprint-5--contratos-sincronización-e-internacionalización)
8. [Actores del Sistema](#actores-del-sistema)

---

## Tabla de Resumen

| ID | Título | Actor | Sprint | Prioridad | RFC |
|:---|:-------|:------|:-------|:----------|:----|
| US-001 | Configuración del Monorepo e Infraestructura Base | Sistema | Sprint 0 | Alta | RFC-001 |
| US-002 | Autenticación de Terapeuta en el Portal Web | Terapeuta | Sprint 0 | Alta | RFC-002 |
| US-003 | Gestión de Pacientes | Terapeuta | Sprint 0 | Alta | RFC-003 |
| US-004 | Creación de Rutinas Clínicas | Terapeuta | Sprint 0 | Alta | RFC-004 |
| US-005 | Vista de Perfil de Paciente con Tabs | Terapeuta | Sprint 1 | Alta | RFC-005 |
| US-006 | Analítica de Rutinas con Gráficas | Terapeuta | Sprint 1 | Alta | RFC-006 |
| US-007 | Catálogo y Gestión de Ejercicios | Terapeuta | Sprint 1 | Media | RFC-007 |
| US-008 | Ciclo de Vida de Rutinas | Terapeuta | Sprint 1 | Alta | RFC-008 |
| US-009 | Generación de PIN de Acceso para Paciente | Terapeuta | Sprint 1 | Alta | RFC-009 |
| US-010 | Dashboard Principal del Portal Web | Terapeuta | Sprint 1 | Alta | RFC-010 |
| US-011 | Gateway de Autenticación Móvil | Sistema | Sprint 1 | Alta | RFC-011 |
| US-012 | Configuración del Proyecto Android | Sistema | Sprint 2 | Alta | RFC-012 |
| US-013 | Cliente de Red Android con Retrofit | Sistema | Sprint 2 | Alta | RFC-013 |
| US-014 | Pantalla de Login con PIN en la App Móvil | Paciente | Sprint 2 | Alta | RFC-014 |
| US-015 | Sincronización de Rutina Activa en Home | Paciente | Sprint 2 | Alta | RFC-015 |
| US-016 | Infraestructura de Cámara Frontal | Paciente | Sprint 2 | Alta | RFC-016 |
| US-017 | Lógica del Reproductor de Ejercicios | Paciente | Sprint 2 | Alta | RFC-017 |
| US-018 | Interfaz del Reproductor de Ejercicios | Paciente | Sprint 2 | Alta | RFC-018 |
| US-019 | Subida de Sesión Completada | Paciente | Sprint 2 | Alta | RFC-019 |
| US-020 | Sistema de Diseño Material 3 | Sistema | Sprint 2 | Media | RFC-020 |
| US-021 | Limpieza de Funcionalidades Temporales | Sistema | Sprint 2 | Baja | RFC-021 |
| US-022 | Integración de MediaPipe FaceLandmarker | Sistema | Sprint 3 | Alta | RFC-022 |
| US-023 | Visualización del Mapa Facial (Face Mesh) | Paciente | Sprint 3 | Alta | RFC-023 |
| US-024 | Algoritmo de Simetría Facial | Sistema | Sprint 3 | Alta | RFC-024 |
| US-025 | Barra de Calidad Visual en Tiempo Real | Paciente | Sprint 3 | Alta | RFC-025 |
| US-026 | Recolección y Envío de Métricas de IA | Sistema | Sprint 3 | Alta | RFC-026 |
| US-027 | Asistente de Calibración de Baseline | Paciente | Sprint 4 | Alta | RFC-027 |
| US-028 | Motor de Ejercicios con Patron Strategy | Sistema | Sprint 4 | Alta | RFC-028 |
| US-029 | Datos de Prueba (Seed) para Validación | Sistema | Sprint 4 | Media | RFC-029 |
| US-030 | Esquema Backend con Módulos Clínicos | Terapeuta | Sprint 4 | Alta | RFC-030 |
| US-031 | Motor Clínico Avanzado en la App Móvil | Paciente | Sprint 4 | Alta | RFC-031 |
| US-032 | Calibración Clínica Avanzada | Paciente | Sprint 4 | Alta | RFC-032 |
| US-033 | Contratos OpenAPI Centralizados | Sistema | Sprint 5 | Media | Spec-001 |
| US-034 | Sincronización Offline de Sesiones | Paciente | Sprint 5 | Alta | Spec-002 |
| US-035 | Vista de Analítica de Sesiones en Portal | Terapeuta | Sprint 5 | Alta | Spec-003 |
| US-036 | Internacionalización Español / Inglés | Sistema | Sprint 5 | Media | Spec-004 |

---

## Sprint 0 — Infraestructura y Portal Web Base

**Objetivo del Sprint:** Establecer la infraestructura técnica base del monorepo, el backend y el portal web con autenticación y gestión de pacientes funcionales.

---

### US-001: Configuración del Monorepo e Infraestructura Base

**Actor:** Sistema  
**Historia:** Como sistema de desarrollo, quiero que el monorepo esté correctamente configurado con Turborepo, pnpm, Docker y las aplicaciones base, para que todos los servicios puedan levantarse de forma orquestada desde un solo repositorio.  
**Sprint:** Sprint 0  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Al ejecutar `pnpm install` desde la raíz del repositorio, todas las dependencias del workspace se instalan sin errores y los workspaces de `apps/api`, `apps/web` y `packages/*` son reconocidos correctamente por pnpm.
- CA-2: Al ejecutar `docker compose up`, el contenedor de PostgreSQL se levanta exitosamente y acepta conexiones en el puerto `5440` con las credenciales configuradas en el archivo `.env`.
- CA-3: La aplicación NestJS (API) arranca sin errores y responde con HTTP 200 en el endpoint de health check accesible en `http://localhost:4001`.
- CA-4: La aplicación Next.js (portal web) arranca sin errores y es accesible en `http://localhost:4000`, renderizando correctamente la página de inicio o redirección a login.
- CA-5: La estructura de directorios del monorepo cumple con el esquema definido: `apps/api`, `apps/web`, `apps/mobile`, `packages/database`, `packages/shared-types`, `packages/config`.

---

### US-002: Autenticación de Terapeuta en el Portal Web

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero iniciar sesión en el portal web con mi email y contraseña, para acceder de forma segura a mis pacientes y rutinas clínicas.  
**Sprint:** Sprint 0  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Al ingresar las credenciales válidas (`admin@symma.com` / `admin123`) en el formulario de login y hacer clic en "Iniciar sesión", el backend retorna un JWT válido con los datos del terapeuta en el payload.
- CA-2: Tras una autenticación exitosa, el portal web redirige automáticamente al terapeuta a la ruta `/dashboard` y el JWT se almacena de forma segura mediante NextAuth.js (cookie HttpOnly).
- CA-3: Al ingresar credenciales incorrectas, el sistema muestra un mensaje de error descriptivo en la interfaz sin revelar si el email o la contraseña son los incorrectos.
- CA-4: El diseño visual del formulario de login (campos, botones, logotipo) corresponde al mockup aprobado, utilizando la paleta de color Teal 600 (`#0D9488`) como color primario.
- CA-5: Al acceder a cualquier ruta protegida sin un JWT válido, el sistema redirige automáticamente a la página de login.

---

### US-003: Gestión de Pacientes

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero crear, consultar, ver el detalle y archivar pacientes, para mantener un registro organizado de las personas bajo mi atención sin que otros terapeutas puedan acceder a mi información.  
**Sprint:** Sprint 0  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Al crear un nuevo paciente, el formulario valida que los campos obligatorios estén presentes (nombre, apellido y email); si falta alguno, se muestra un mensaje de validación sin enviar la solicitud al backend.
- CA-2: Un terapeuta autenticado únicamente puede ver, editar y archivar los pacientes que él mismo creó; los pacientes de otros terapeutas no aparecen en ningún listado ni son accesibles por ID en la API.
- CA-3: El formulario acepta y persiste en base de datos los siguientes campos del paciente: nombre, apellido, email, diagnóstico, fecha de nacimiento, género, teléfono, grado de parálisis (escala House-Brackmann del 1 al 6), notas clínicas y datos de contacto de emergencia.
- CA-4: La acción de archivar un paciente realiza un soft delete, cambiando su estado a `ARCHIVED` en la base de datos sin eliminar el registro; el paciente archivado deja de aparecer en el listado activo pero su historial se conserva.
- CA-5: En la lista y perfil de cada paciente se muestra un avatar generado automáticamente con las iniciales del nombre y apellido del paciente cuando no existe una foto de perfil.

---

### US-004: Creación de Rutinas Clínicas

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero crear rutinas de rehabilitación configurando ejercicios del catálogo con sus parámetros específicos, para prescribir un plan terapéutico personalizado a cada paciente.  
**Sprint:** Sprint 0  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Al guardar una rutina, el backend crea de forma transaccional exactamente un registro en la tabla `Routine` y N registros en la tabla `RoutineItem` (uno por cada ejercicio añadido), o ninguno si ocurre un error en cualquier parte de la operación.
- CA-2: Para cada ejercicio en la rutina, el terapeuta puede configurar individualmente: número de repeticiones (`reps`), número de series (`sets`), tiempo de retención en segundos (`hold_time`) y tiempo de descanso entre series en segundos (`rest_time`); todos estos valores se persisten correctamente en la columna correspondiente de `RoutineItem`.
- CA-3: El terapeuta puede reordenar los ejercicios dentro de la rutina mediante una interfaz de arrastrar y soltar (drag and drop), y el orden visual se refleja en el campo `order_index` de cada `RoutineItem` en la base de datos.
- CA-4: La interfaz de creación de rutinas es responsive y se visualiza correctamente en resoluciones de escritorio (1280px o más) y tableta (768px).
- CA-5: Tras crear la rutina exitosamente, el sistema muestra una confirmación y redirige al terapeuta a la vista de detalle de la rutina recién creada.

---

## Sprint 1 — Portal Web Completo y Gateway Móvil

**Objetivo del Sprint:** Completar el portal web del terapeuta con analítica, gestión avanzada de rutinas y acceso del paciente; implementar el gateway de autenticación para la app móvil.

---

### US-005: Vista de Perfil de Paciente con Tabs

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero acceder a una vista de perfil de cada paciente organizada en tabs de navegación, para consultar de forma separada y clara la información general del paciente y sus rutinas asignadas.  
**Sprint:** Sprint 1  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: La vista de perfil del paciente presenta al menos dos tabs claramente diferenciadas: "Información General" (Overview) y "Rutinas", y la navegación entre ellas no recarga la página completa.
- CA-2: La jerarquía de navegación es correcta: el breadcrumb muestra la ruta `Pacientes > [Nombre del Paciente]` y el sidebar del portal no incluye un enlace global directo a "Rutinas" independiente del paciente.
- CA-3: La tab de "Información General" muestra todos los datos clínicos del paciente: datos personales, diagnóstico, grado de parálisis House-Brackmann, notas clínicas y contacto de emergencia.
- CA-4: La tab de "Rutinas" muestra la lista de rutinas asignadas a ese paciente con su estado (activa, archivada) y permite acceder al detalle de cada rutina.

---

### US-006: Analítica de Rutinas con Gráficas

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero ver el detalle analítico de una rutina con indicadores clave de rendimiento y una gráfica de evolución, para monitorear el progreso real de mi paciente a lo largo del tiempo.  
**Sprint:** Sprint 1  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: La vista de detalle de rutina muestra tres tarjetas KPI con valores reales provenientes de la base de datos: "Total de Sesiones", "Precisión Promedio" (en porcentaje) y "Racha Actual" (días consecutivos).
- CA-2: La página incluye una gráfica de área (AreaChart de Recharts) con el color Teal (`#0D9488`) que muestra la evolución de la precisión promedio a lo largo de las sesiones registradas.
- CA-3: La base de datos contiene datos de seed con al menos 14 sesiones simuladas que muestran una tendencia de mejora progresiva, lo que permite visualizar una curva ascendente en la gráfica al cargar los datos.
- CA-4: La vista incluye la lista de ejercicios prescritos en la rutina con sus parámetros (reps, sets, hold time) y el historial cronológico de sesiones con fecha, duración y precisión de cada una.
- CA-5: El layout de la página es correcto y los elementos (KPIs, gráfica, lista de ejercicios, historial) están organizados de acuerdo al mockup aprobado, sin desbordamientos de contenido en resolución de escritorio.

---

### US-007: Catálogo y Gestión de Ejercicios

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero gestionar el catálogo de ejercicios de rehabilitación (crear, ver, editar), para contar con una biblioteca actualizada de ejercicios que pueda asignar a mis pacientes.  
**Sprint:** Sprint 1  
**Prioridad:** Media  

**Criterios de Aceptación:**
- CA-1: El formulario de creación de ejercicio permite ingresar y guardar: nombre del ejercicio, tipo (ISOTONIC / ISOMETRIC), categoría (WARMUP / CORE / COOLDOWN), URLs de assets de animación y video tutorial, y la configuración por defecto.
- CA-2: Al crear un ejercicio llamado "Mejilla Inflada", este aparece inmediatamente en el catálogo de ejercicios y puede ser seleccionado al crear o editar una rutina.
- CA-3: El campo `rest_between_sets_seconds` (tiempo de descanso entre series) en `RoutineItem` se guarda correctamente en la base de datos cuando se configura en una rutina, y el valor persiste al recargar la vista de detalle de esa rutina.
- CA-4: La vista del catálogo muestra todos los ejercicios disponibles con filtros por tipo y categoría, y permite buscar por nombre de ejercicio.

---

### US-008: Ciclo de Vida de Rutinas

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero poder editar, archivar y clonar rutinas clínicas, para adaptar el tratamiento al progreso del paciente de forma segura sin perder el historial de sesiones previas.  
**Sprint:** Sprint 1  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Si una rutina tiene sesiones registradas, el sistema impide modificar los ejercicios, el número de repeticiones y el número de series; solo permite editar el nombre y las fechas de vigencia. Al intentar modificar campos bloqueados, se muestra un mensaje explicativo al terapeuta.
- CA-2: Al clonar una rutina, el sistema crea una nueva rutina independiente con todos sus RoutineItems copiados (mismo orden, mismos parámetros), manteniendo la rutina original intacta y sin sesiones heredadas en la copia.
- CA-3: Si una rutina no tiene sesiones registradas, la acción de eliminar realiza un hard delete (borrado físico del registro); si tiene al menos una sesión, la acción cambia el estado a `ARCHIVED` (soft delete) y conserva todos los datos.
- CA-4: Los cinco escenarios del ciclo de vida están cubiertos y verificados: (1) edición de rutina sin sesiones, (2) edición de rutina con sesiones (bloqueado), (3) clonación, (4) archivado de rutina con sesiones, (5) eliminación de rutina sin sesiones.
- CA-5: El portal muestra claramente el estado de cada rutina (activa, archivada) y las acciones disponibles cambian de acuerdo al estado y al historial de sesiones.

---

### US-009: Generación de PIN de Acceso para Paciente

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero generar un PIN de 6 dígitos para que mi paciente pueda acceder a la aplicación móvil, para que el proceso de incorporación del paciente sea sencillo y sin necesidad de que el paciente recuerde una contraseña compleja.  
**Sprint:** Sprint 1  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Al generar el PIN, el portal web muestra el código de 6 dígitos en texto plano dentro de un modal por única vez; al cerrar el modal o refrescar la página, el PIN ya no se vuelve a mostrar en ninguna parte de la interfaz.
- CA-2: El PIN generado se almacena en la base de datos únicamente como hash bcrypt; en ningún campo de la base de datos existe el PIN en texto plano.
- CA-3: La acción de revocar el acceso de un paciente establece el campo `auth_pin_hash` en `null` en la base de datos, impidiendo que el paciente pueda autenticarse en la app móvil hasta que se genere un nuevo PIN.
- CA-4: El endpoint de revocación de PIN responde correctamente y el terapeuta recibe una confirmación visual en el portal de que el acceso del paciente ha sido revocado.
- CA-5: El PIN solo puede ser generado o revocado por el terapeuta que tiene asignado al paciente; un terapeuta diferente no puede gestionar el PIN de un paciente ajeno.

---

### US-010: Dashboard Principal del Portal Web

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero ver un dashboard de resumen al ingresar al portal, para tener una visión inmediata del estado de mis pacientes y acceder rápidamente a las funciones más frecuentes.  
**Sprint:** Sprint 1  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El dashboard muestra tres tarjetas KPI con datos reales de la base de datos: "Pacientes Activos" (total de pacientes con estado ACTIVE), "Alertas de Cumplimiento" (pacientes sin sesión en las últimas 72 horas que tienen una rutina activa) y "Eficacia Promedio" (promedio de `avg_symmetry_score` de todas las sesiones recientes).
- CA-2: El dashboard incluye un panel de acciones rápidas con cuatro botones funcionales y navegables: "Agregar Paciente", "Catálogo de Ejercicios", "Rutinas Activas" y "Generar PIN".
- CA-3: El listado de "Pacientes en Riesgo" muestra únicamente a los pacientes que no han registrado ninguna sesión en las últimas 72 horas y tienen al menos una rutina activa asignada; al hacer clic en un paciente de esta lista, se navega a su perfil.
- CA-4: Todos los datos del dashboard corresponden únicamente al terapeuta autenticado; no se muestran datos de pacientes de otros terapeutas.
- CA-5: Los KPIs y la lista de pacientes en riesgo se calculan y renderizan desde el servidor (Server Component de Next.js) para garantizar que los datos sean frescos en cada carga del dashboard.

---

### US-011: Gateway de Autenticación Móvil

**Actor:** Sistema  
**Historia:** Como sistema, quiero exponer un endpoint de autenticación para la app Android que valide el PIN del paciente, para que la app móvil pueda obtener un JWT y acceder de forma segura a los datos de la rutina activa del paciente.  
**Sprint:** Sprint 1  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El endpoint `POST /auth/patient/login` que recibe `patientId` y `accessCode` (PIN) retorna un JWT de larga duración con los datos del paciente cuando las credenciales son correctas (HTTP 200).
- CA-2: Al enviar un PIN incorrecto al endpoint `POST /auth/patient/login`, el sistema retorna HTTP 401 con un mensaje de error; la respuesta no revela si el `patientId` existe en la base de datos.
- CA-3: El endpoint `GET /mobile/routine/active` retorna la rutina activa del paciente autenticado con todos sus ejercicios anidados en un solo objeto JSON, incluyendo los parámetros específicos de cada `RoutineItem`.
- CA-4: La documentación Swagger de la API está disponible y se carga correctamente en la ruta `/api/docs`, mostrando todos los endpoints del gateway móvil con sus esquemas de request y response.
- CA-5: Los endpoints del gateway móvil están protegidos por autenticación JWT de paciente; las solicitudes sin token o con token inválido retornan HTTP 401.

---

## Sprint 2 — Aplicación Android

**Objetivo del Sprint:** Desarrollar la aplicación Android completa con login, sincronización de rutinas, reproductor de ejercicios con cámara y subida de sesiones al servidor.

---

### US-012: Configuración del Proyecto Android

**Actor:** Sistema  
**Historia:** Como sistema, quiero que el proyecto Android esté configurado con la arquitectura limpia y todas las dependencias necesarias, para que el desarrollo de las funcionalidades móviles pueda comenzar sobre una base sólida y organizada.  
**Sprint:** Sprint 2  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El proyecto Android compila exitosamente mediante Gradle (`./gradlew build`) sin errores, generando un APK de debug instalable.
- CA-2: La estructura de paquetes sigue Clean Architecture con MVVM: los paquetes `core`, `domain`, `data` y `presentation` están presentes y diferenciados en el directorio del código fuente.
- CA-3: Las siguientes dependencias están correctamente configuradas e integradas: Jetpack Compose (UI), Hilt (inyección de dependencias), Room (base de datos local), Retrofit (cliente HTTP) y CameraX (acceso a cámara).
- CA-4: La inyección de dependencias con Hilt funciona correctamente: al lanzar la aplicación, el grafo de dependencias se construye sin errores de compilación ni de runtime.
- CA-5: El proyecto está co-localizado en el directorio `apps/mobile/` del monorepo y puede ser abierto directamente en Android Studio sin necesidad de configuración adicional.

---

### US-013: Cliente de Red Android con Retrofit

**Actor:** Sistema  
**Historia:** Como sistema, quiero que la app Android cuente con un cliente HTTP configurado para consumir la API de Symma con autenticación automática, para que todas las peticiones de red sean type-safe y lleven el token de autenticación del paciente.  
**Sprint:** Sprint 2  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El proyecto compila sin errores de tipos en los DTOs de red; todos los campos de la API que usan `snake_case` son mapeados correctamente a `camelCase` en los data classes de Kotlin mediante el conversor de Gson o Moshi configurado en Retrofit.
- CA-2: El `AuthInterceptor` de OkHttp intercepta automáticamente todas las peticiones al backend e inyecta el header `Authorization: Bearer <token>` usando el JWT almacenado en el dispositivo, sin necesidad de configurarlo manualmente en cada llamada.
- CA-3: El `AuthRepository` expone las operaciones de autenticación (login del paciente) como funciones suspend de Kotlin con manejo de errores tipado; la inyección de dependencias con Hilt provee el repositorio correctamente en los ViewModels.
- CA-4: El cliente Retrofit está configurado para apuntar a la URL base del backend de Symma y maneja correctamente los códigos de error HTTP (401, 404, 500) retornando objetos de resultado sellados (sealed class) en lugar de lanzar excepciones no controladas.

---

### US-014: Pantalla de Login con PIN en la App Móvil

**Actor:** Paciente  
**Historia:** Como paciente, quiero ingresar el PIN de 6 dígitos que me dio mi terapeuta en una pantalla intuitiva con un teclado numérico grande, para acceder a la app móvil de forma sencilla sin necesidad de escribir texto.  
**Sprint:** Sprint 2  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: La pantalla de login muestra visualmente 6 círculos indicadores del PIN que se van rellenando conforme el paciente presiona dígitos en el teclado numérico; al completar el 6to dígito, la petición de autenticación se envía automáticamente sin necesidad de presionar un botón de "Confirmar".
- CA-2: El teclado numérico es de tamaño grande con botones fáciles de presionar, optimizado para uso con una sola mano por usuarios con movilidad facial reducida.
- CA-3: Tras una autenticación exitosa, el JWT recibido se persiste en `EncryptedSharedPreferences`, de modo que en futuros inicios de sesión no sea necesario ingresar el PIN nuevamente hasta que la sesión expire o sea revocada.
- CA-4: Si el PIN ingresado es incorrecto (el backend retorna HTTP 401), la pantalla muestra un mensaje de error claro, los círculos indicadores se reinician a vacío y el paciente puede intentarlo de nuevo.
- CA-5: Si existe un JWT válido almacenado en el dispositivo, la app detecta la sesión activa al iniciar y redirige automáticamente al paciente a la pantalla de inicio, omitiendo el formulario de login.

---

### US-015: Sincronización de Rutina Activa en Home

**Actor:** Paciente  
**Historia:** Como paciente, quiero ver mi rutina activa en la pantalla de inicio de la app aunque no tenga conexión a internet, para poder revisar mis ejercicios y comenzar mi sesión en cualquier momento sin depender de la red.  
**Sprint:** Sprint 2  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Al abrir la app con conexión a internet, la app consulta el endpoint `GET /mobile/routine/active`, guarda la respuesta en la base de datos local Room y muestra la rutina en pantalla.
- CA-2: Al abrir la app sin conexión a internet (modo avión activado), la app muestra los datos de la rutina almacenados en Room desde la última sincronización exitosa, sin mostrar errores de red al usuario.
- CA-3: Cuando la conectividad se restaura después de haber estado en modo avión, la app detecta el cambio de red y realiza una nueva sincronización con el backend para actualizar los datos locales de la rutina.
- CA-4: Si no existe ninguna rutina sincronizada en Room y tampoco hay conexión a internet, la app muestra un estado vacío con un mensaje que indica al paciente que se conecte a internet para cargar su rutina por primera vez.

---

### US-016: Infraestructura de Cámara Frontal

**Actor:** Paciente  
**Historia:** Como paciente, quiero que la app use la cámara frontal espejada para verme mientras realizo los ejercicios, para poder observar mi propio rostro y ajustar mi postura durante la terapia.  
**Sprint:** Sprint 2  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Al acceder por primera vez a cualquier pantalla que requiera la cámara, la app solicita el permiso de cámara al sistema operativo Android; si el usuario lo deniega, se muestra una pantalla de rationale explicando por qué el permiso es necesario para la terapia.
- CA-2: El componente `CameraPreview` activa la cámara frontal (no la trasera) y muestra la imagen espejada horizontalmente, de modo que el paciente ve su reflejo natural como si fuera un espejo.
- CA-3: Cuando la app pasa a segundo plano (el usuario presiona Home o cambia de app), el recurso de cámara se libera correctamente; al volver a la app, la cámara se reactiva sin errores de "cámara en uso".
- CA-4: El ciclo de vida del componente de cámara está vinculado correctamente al ciclo de vida del `LifecycleOwner` de Compose (o del Activity/Fragment), evitando fugas de memoria y cierres inesperados de la cámara.

---

### US-017: Lógica del Reproductor de Ejercicios

**Actor:** Paciente  
**Historia:** Como paciente, quiero que el reproductor de ejercicios me guíe automáticamente por cada fase (preparación, ejercicio, descanso y completado), para poder concentrarme en realizarlos correctamente sin preocuparme por llevar el conteo manualmente.  
**Sprint:** Sprint 2  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El `PlayerViewModel` implementa una máquina de estados con al menos cuatro estados bien definidos: `GetReady` (cuenta regresiva inicial), `Exercise` (fase activa), `Rest` (descanso entre series) y `Completed` (sesión finalizada); las transiciones entre estados son automáticas al terminar cada fase.
- CA-2: El timer de cada estado usa un `Flow` de Kotlin que emite actualizaciones cada segundo; el ViewModel expone el tiempo restante como `StateFlow` que la UI observa reactivamente.
- CA-3: El paciente puede pausar y reanudar la sesión en cualquier momento durante las fases de Exercise y Rest; al pausar, el timer se detiene; al reanudar, continúa desde donde quedó.
- CA-4: El ViewModel lleva el conteo de repeticiones completadas por serie y de series completadas por ejercicio, tomando los valores objetivo de `reps_per_set` y `sets` del `RoutineItem` almacenado en Room.
- CA-5: El tiempo de descanso entre series (`rest_between_sets_seconds`) recuperado de la base de datos Room se usa como duración del estado `Rest`; al finalizar el descanso, la máquina de estados transiciona automáticamente al siguiente ejercicio o al estado `Completed`.

---

### US-018: Interfaz del Reproductor de Ejercicios

**Actor:** Paciente  
**Historia:** Como paciente, quiero ver una interfaz clara y superpuesta sobre la cámara mientras realizo mis ejercicios, para poder ver mi rostro y al mismo tiempo consultar las instrucciones y el progreso de la sesión.  
**Sprint:** Sprint 2  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: La pantalla del reproductor está compuesta por tres capas apiladas en el siguiente orden: Capa 0 (fondo): `CameraPreview` a pantalla completa; Capa 1: Scrim de gradiente semitransparente para mejorar la legibilidad; Capa 2 (frente): HUD con información de la sesión.
- CA-2: El HUD muestra en tiempo real y de forma sincronizada con el `PlayerViewModel`: nombre del ejercicio actual, contador de repeticiones en formato "Rep X/Y", timer de cuenta regresiva y un botón de pausa accesible.
- CA-3: Durante el estado de `Rest` (descanso entre series), el fondo del HUD cambia a color ámbar para diferenciar visualmente esta fase de la fase de ejercicio activo.
- CA-4: La pantalla mantiene el dispositivo encendido (screen keep-on) durante toda la sesión de ejercicios, evitando que se apague automáticamente por inactividad.
- CA-5: Todos los elementos del HUD son legibles sobre la imagen de cámara gracias al scrim; el tamaño de fuente del contador de repeticiones y el timer es suficientemente grande para ser leído sin esfuerzo durante el ejercicio.

---

### US-019: Subida de Sesión Completada

**Actor:** Paciente  
**Historia:** Como paciente, quiero que al terminar mi sesión de ejercicios se muestre un resumen de lo que realicé y los datos se envíen automáticamente a la nube, para que mi terapeuta pueda ver mi progreso y yo tenga un registro de mi trabajo.  
**Sprint:** Sprint 2  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Al completar todos los ejercicios de la rutina, la app navega automáticamente a una pantalla de resumen que muestra al paciente los datos de la sesión: fecha, duración total y ejercicios completados.
- CA-2: La app ejecuta un `POST /sessions` al backend con el cuerpo correcto: `routineId`, `startTime`, `endTime` y un arreglo `items` con `exerciseId` y `repsCompleted` de cada ejercicio.
- CA-3: Tras enviar la sesión exitosamente, el registro de la sesión es visible en la base de datos del backend con los datos correctos, y el campo `is_synced` del registro local queda en `true`.
- CA-4: Al presionar el botón "Finalizar" o "Volver al inicio" desde la pantalla de resumen, la app navega a la pantalla de inicio y la pila de navegación se limpia (back stack cleared) de modo que el usuario no puede regresar a la sesión recién completada con el botón de retroceso del dispositivo.
- CA-5: Si el envío de la sesión al backend falla por error de red, la app muestra un mensaje informativo al paciente indicando que los datos se guardarán localmente y se sincronizarán cuando haya conexión.

---

### US-020: Sistema de Diseño Material 3

**Actor:** Sistema  
**Historia:** Como sistema, quiero que la app Android utilice un sistema de diseño coherente basado en Material 3 con los colores de la marca Symma, para que la interfaz sea visualmente consistente y accesible para pacientes con diversas condiciones.  
**Sprint:** Sprint 2  
**Prioridad:** Media  

**Criterios de Aceptación:**
- CA-1: El tema de la app está definido en el archivo de tema de Compose con los siguientes tokens de color: Teal 600 como color primario, Slate 800 como color secundario, Slate 50 como color de fondo, Rose 600 como color de error y Amber 500 como color de advertencia; ninguna pantalla o componente usa valores de color hardcodeados en formato hexadecimal.
- CA-2: El componente `SymmaButton` existe como Composable reutilizable con una altura de 56dp; es usado de forma consistente en todas las pantallas que requieren una acción principal.
- CA-3: Los componentes `SymmaCard` y `SymmaScaffold` están implementados como Composables reutilizables y son utilizados en al menos tres pantallas distintas de la aplicación.
- CA-4: La paleta de colores del tema cumple con el estándar de accesibilidad WCAG AA: el contraste entre el color de texto principal y el fondo de fondo es mínimo de 4.5:1 para texto normal.

---

### US-021: Limpieza de Funcionalidades Temporales

**Actor:** Sistema  
**Historia:** Como sistema, quiero que el botón de prueba de cámara temporal sea eliminado de la pantalla de inicio, para que la interfaz final no exponga funcionalidades de desarrollo al usuario final.  
**Sprint:** Sprint 2  
**Prioridad:** Baja  

**Criterios de Aceptación:**
- CA-1: El botón "Test Camera" (o equivalente) ya no aparece en la pantalla `HomeScreen` en ninguna compilación de la app (debug o release).
- CA-2: La ruta de navegación asociada al botón de prueba de cámara es eliminada del grafo de navegación de Compose; intentar navegar a ella programáticamente genera un error controlado o no es posible.
- CA-3: La compilación del proyecto después de la limpieza es exitosa sin errores ni advertencias relacionadas con referencias a la funcionalidad eliminada.

---

## Sprint 3 — Computer Vision con MediaPipe

**Objetivo del Sprint:** Integrar el motor de visión computacional MediaPipe para detectar el rostro del paciente en tiempo real, calcular métricas de simetría facial y recolectar datos de precisión por sesión.

---

### US-022: Integración de MediaPipe FaceLandmarker

**Actor:** Sistema  
**Historia:** Como sistema, quiero que la app Android integre el modelo FaceLandmarker de MediaPipe para detectar los puntos de referencia del rostro en tiempo real, para disponer de la base de datos de posiciones faciales necesaria para calcular métricas de rehabilitación.  
**Sprint:** Sprint 3  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El proyecto Android compila exitosamente con la dependencia de MediaPipe Tasks Vision incluida en el archivo `build.gradle`; el modelo `face_landmarker.task` está presente en el directorio `assets` de la app.
- CA-2: La integración de `ImageAnalysis` con CameraX procesa los frames de la cámara frontal y los envía al `FaceLandmarker` en modo `LIVE_STREAM`, obteniendo resultados de forma asíncrona sin bloquear el hilo principal.
- CA-3: Los datos de los 468 landmarks del rostro detectado (coordenadas X, Y, Z normalizadas) se pueden observar en los registros de Logcat mientras el usuario está frente a la cámara, confirming que el modelo está operativo.
- CA-4: El procesamiento de landmarks opera a una tasa mínima de 30 frames por segundo (fps) en dispositivos con hardware de gama media; el rendimiento se puede verificar en Logcat mediante los timestamps de cada resultado del detector.
- CA-5: Si no se detecta ningún rostro en el frame, el sistema retorna un resultado vacío de forma silenciosa sin lanzar excepciones; la UI maneja este estado correctamente.

---

### US-023: Visualización del Mapa Facial (Face Mesh)

**Actor:** Paciente  
**Historia:** Como paciente, quiero ver los puntos de referencia de mi rostro dibujados sobre la imagen de cámara en tiempo real, para entender que el sistema está detectando mi cara correctamente y confiar en el proceso de medición.  
**Sprint:** Sprint 3  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Un `Canvas` de Compose dibuja los 468 landmarks del rostro como puntos sobre la imagen de cámara en tiempo real; los puntos se actualizan en cada frame nuevo del detector de MediaPipe.
- CA-2: La transformación de coordenadas es correcta: las coordenadas normalizadas (valores de 0.0 a 1.0) retornadas por MediaPipe se convierten a coordenadas de píxeles en pantalla, teniendo en cuenta las dimensiones reales del componente `Canvas` en la pantalla del dispositivo.
- CA-3: Los puntos del face mesh están orientados correctamente: cuando el paciente mueve la cabeza hacia la izquierda, los puntos se desplazan hacia la izquierda en la pantalla (efecto espejo por la cámara frontal espejada).
- CA-4: La superposición del face mesh no introduce una latencia perceptible entre el movimiento del rostro y el desplazamiento de los puntos en pantalla; la diferencia temporal es menor a 100ms.

---

### US-024: Algoritmo de Simetría Facial

**Actor:** Sistema  
**Historia:** Como sistema, quiero calcular un índice de simetría facial entre 0% y 100% a partir de los landmarks del rostro, para cuantificar objetivamente el progreso de rehabilitación del paciente en cada ejercicio.  
**Sprint:** Sprint 3  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: La clase `SymmetryCalculator` implementa el cálculo del índice de simetría utilizando las distancias relativas de las comisuras labiales izquierda y derecha con respecto al punto central de la boca, expresando el resultado como un valor de 0.0 a 1.0 (equivalente a 0–100%).
- CA-2: Cuando el paciente mantiene un rostro en reposo neutro, el índice de simetría calculado es igual o superior a 0.90 (90%), validado con al menos 3 sujetos de prueba durante el proceso de QA.
- CA-3: Cuando el paciente realiza una sonrisa visiblemente asimétrica (un lado de la boca sube significativamente más que el otro), el índice de simetría calculado es inferior a 0.60 (60%).
- CA-4: El cálculo de `SymmetryCalculator` es una función pura sin efectos secundarios; dado el mismo conjunto de landmarks, siempre retorna el mismo valor de simetría.
- CA-5: El algoritmo tiene cobertura de prueba unitaria que verifica al menos los escenarios: rostro simétrico (resultado ≥ 0.90), rostro asimétrico moderado (resultado entre 0.60 y 0.89), y rostro muy asimétrico (resultado < 0.60).

---

### US-025: Barra de Calidad Visual en Tiempo Real

**Actor:** Paciente  
**Historia:** Como paciente, quiero ver una barra de calidad que me indique qué tan bien estoy realizando el ejercicio con un código de colores, para recibir retroalimentación visual inmediata y corregir mi postura durante la terapia.  
**Sprint:** Sprint 3  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El componente `QualityBar` se muestra en la pantalla del reproductor de ejercicios y refleja el índice de simetría actual con tres estados de color: verde cuando el score es igual o superior a 80%, amarillo cuando está entre 50% y 79%, y rojo cuando es inferior a 50%.
- CA-2: La transición de color y el llenado de la barra se animan de forma suave (con una animación de al menos 200ms de duración) al cambiar el valor del índice de simetría, evitando cambios bruscos que distraigan al paciente.
- CA-3: La barra muestra un texto motivacional dinámico que cambia de acuerdo al estado de calidad: un mensaje de aliento cuando el color es verde, un mensaje de ajuste cuando es amarillo, y un mensaje de corrección cuando es rojo.
- CA-4: La `QualityBar` responde a los cambios del índice de simetría en tiempo real (cada frame), con una latencia visual perceptible menor a 150ms desde que cambia el score hasta que se refleja en la barra.

---

### US-026: Recolección y Envío de Métricas de IA

**Actor:** Sistema  
**Historia:** Como sistema, quiero recolectar y promediar el índice de simetría facial durante cada repetición de ejercicio y enviar estos datos al backend al finalizar la sesión, para que el terapeuta pueda ver métricas objetivas de la ejecución del paciente.  
**Sprint:** Sprint 3  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Durante la fase activa de cada ejercicio (estado `Exercise` en el PlayerViewModel), el sistema muestrea el índice de simetría cada 500ms y acumula los valores para calcular el promedio por repetición y el promedio total por ejercicio.
- CA-2: Los frames en los que MediaPipe no detecta ningún rostro son excluidos del cálculo del promedio; únicamente se promedian los frames con detección exitosa.
- CA-3: El valor de `averageAccuracy` enviado en el campo correspondiente del POST `/sessions` es un número entre 0.0 y 1.0 que refleja de forma realista el desempeño del paciente durante el ejercicio (no es siempre 0, 0.5 o 1.0 exactos).
- CA-4: El valor de `averageAccuracy` se persiste correctamente en el campo `avg_symmetry_score` de la tabla `SESSION_RESULT` en la base de datos del backend, verificable mediante consulta directa a la DB o a través del portal web del terapeuta.
- CA-5: Si el paciente completa un ejercicio sin que se detecte ningún rostro en ningún frame, el sistema envía el valor `null` o `0.0` para `averageAccuracy` en ese ejercicio, sin lanzar excepciones de división entre cero.

---

## Sprint 4 — Motor Clínico Avanzado

**Objetivo del Sprint:** Implementar el sistema de calibración personalizada por usuario, el motor de ejercicios con estrategias específicas por tipo facial, y el esquema extendido de módulos clínicos en backend y mobile.

---

### US-027: Asistente de Calibración de Baseline

**Actor:** Paciente  
**Historia:** Como paciente, quiero realizar un proceso guiado de calibración de mi rostro antes de comenzar mis ejercicios, para que el sistema aprenda las características únicas de mi expresión facial y las mediciones sean precisas para mi caso particular.  
**Sprint:** Sprint 4  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El wizard de calibración guía al paciente por exactamente 5 pasos secuenciales, uno por cada expresión: Neutral (reposo), Smile (sonrisa), Surprise (sorpresa), Kiss (beso) y Jaw (apertura de mandíbula); cada paso muestra instrucciones visuales claras de qué expresión hacer.
- CA-2: En cada paso del wizard, el sistema captura automáticamente el valor máximo de los blendshapes relevantes de MediaPipe durante una ventana de tiempo de 3 segundos, sin requerir que el paciente presione ningún botón para capturar.
- CA-3: Los valores de baseline capturados son específicos para el usuario y se persisten localmente; al repetir la calibración, los nuevos valores reemplazan los anteriores y el sistema utiliza el nuevo baseline para normalizar los scores de ejercicios posteriores.
- CA-4: El baseline capturado es utilizado en los ejercicios subsiguientes para normalizar el índice de simetría: un mismo movimiento facial debe producir un score mayor cuando se normaliza con el baseline del paciente que sin normalización.
- CA-5: El wizard de calibración es completable en menos de 2 minutos y puede ser interrumpido y reiniciado desde el primer paso sin dejar datos parciales que corrompan el baseline.

---

### US-028: Motor de Ejercicios con Patron Strategy

**Actor:** Sistema  
**Historia:** Como sistema, quiero que el motor de puntuación de ejercicios use el patrón Strategy para calcular scores específicos por tipo de movimiento facial, para que cada ejercicio pueda ser evaluado con la lógica más adecuada a su naturaleza clínica.  
**Sprint:** Sprint 4  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Existe una interfaz `ExerciseStrategy` con el método `calculateScore(blendshapes, baseline, difficulty)` que todas las estrategias de ejercicio implementan de forma polimórfica; el `PlayerViewModel` usa esta interfaz sin conocer la implementación concreta.
- CA-2: Están implementadas al menos cuatro estrategias concretas: `SmileStrategy`, `BrowsStrategy`, `JawStrategy` y `KissStrategy`; cada una utiliza los blendshapes de MediaPipe más relevantes para ese tipo de movimiento.
- CA-3: El `difficultyFactor` configurado por el terapeuta en el portal web (via el campo `difficulty_level` del `RoutineItem`) ajusta dinámicamente el umbral de éxito del ejercicio según la fórmula: `Umbral = Baseline × difficultyFactor`; a mayor dificultad, se requiere mayor amplitud de movimiento para alcanzar el score objetivo.
- CA-4: La normalización del score es correcta: el score retornado por cada strategy está entre 0.0 y 1.0, donde 1.0 significa que el paciente alcanzó o superó el objetivo calculado con su baseline.
- CA-5: Las estrategias de ejercicio tienen cobertura de prueba unitaria que verifica el comportamiento de la normalización y el impacto del `difficultyFactor` en los umbrales de evaluación.

---

### US-029: Datos de Prueba (Seed) para Validación

**Actor:** Sistema  
**Historia:** Como sistema, quiero que existan datos de prueba en la base de datos que representen un paciente con una rutina completa de calibración, para poder validar el flujo completo de la app sin necesidad de crear datos manualmente en cada entorno de desarrollo.  
**Sprint:** Sprint 4  
**Prioridad:** Media  

**Criterios de Aceptación:**
- CA-1: El script `seed.ts` se ejecuta sin errores mediante el comando de seed de Prisma y crea en la base de datos un paciente con el nombre "Juan Perez (Test)" con todos los campos requeridos completos.
- CA-2: El seed crea una rutina llamada "Full Calibration Protocol" asignada al paciente de prueba, con exactamente 5 RoutineItems que corresponden a los ejercicios: `smile_teeth`, `brows_up`, `jaw_open`, `kiss` y `blink`.
- CA-3: Los datos creados por el seed son visibles en la app móvil: al autenticarse con las credenciales del paciente de prueba, la rutina "Full Calibration Protocol" aparece en la pantalla de inicio como rutina activa.
- CA-4: El script de seed es idempotente o maneja correctamente los duplicados: ejecutarlo múltiples veces no crea registros duplicados ni genera errores de constraint único.

---

### US-030: Esquema Backend con Módulos Clínicos

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero configurar cada ejercicio de una rutina con parámetros clínicos detallados (tipo de ejercicio, módulo visual, modo estricto), para tener un control preciso sobre cómo la app guía al paciente durante cada ejercicio.  
**Sprint:** Sprint 4  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: La base de datos contiene los nuevos enums de Prisma: `MobileModule` con valores (`EYES`, `EYES_INVERSE`, `BROWS`, `JAW`, `SMILE`, `KISS`) y `ExerciseType` con valores (`ISOTONIC`, `ISOMETRIC`); ambos enums son verificables mediante una consulta directa a la base de datos.
- CA-2: La tabla `RoutineItem` contiene las columnas explícitas: `sets` (entero), `reps_per_set` (entero), `target_hold_seconds` (entero), `difficulty_level` (decimal), `strict_mode` (booleano) y `allow_skip` (booleano); todas con sus tipos y valores por defecto correctos.
- CA-3: El formulario del portal web para configurar un RoutineItem implementa lógica condicional: cuando el tipo de ejercicio es `ISOTONIC`, el campo "Hold Time" (tiempo de retención) se deshabilita y su valor se ignora; cuando es `ISOMETRIC`, el campo se habilita y es requerido.
- CA-4: El backend tiene pruebas unitarias que validan la lógica de los nuevos módulos clínicos; las pruebas cubren al menos: creación de RoutineItem con tipo ISOTONIC, creación con tipo ISOMETRIC y validación de que hold_time es requerido solo para ISOMETRIC.
- CA-5: La documentación Swagger en `/api/docs` refleja los nuevos campos y enums en los esquemas de los endpoints afectados.

---

### US-031: Motor Clínico Avanzado en la App Móvil

**Actor:** Paciente  
**Historia:** Como paciente, quiero que la app controle con precisión cada repetición y serie de mis ejercicios de acuerdo al tipo (isotónico o isométrico), mostrando mi progreso en todo momento, para seguir mi rutina terapéutica de forma correcta y autónoma.  
**Sprint:** Sprint 4  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Los enums de Kotlin `MobileModule` y `ExerciseType` están definidos en la capa `domain` de la app y corresponden exactamente a los enums del backend; son usados en los data classes de dominio y en la lógica del `PlayerViewModel`.
- CA-2: `EyesStrategy` y `EyesInverseStrategy` están implementadas como estrategias concretas de `ExerciseStrategy`, evaluando el blendshape de apertura de ojos con y sin inversión respectivamente.
- CA-3: El `PlayerViewModel` acumula correctamente el tiempo de retención (hold time) en modo ISOMETRIC: el timer de hold solo avanza cuando el score del paciente supera el umbral objetivo durante ese frame.
- CA-4: En modo `strict_mode` activado con ejercicio ISOMETRIC, si el score del paciente cae por debajo de 1.0 durante la fase de retención, el timer de hold se reinicia a cero; el paciente debe mantener el score de forma continua para completar la repetición.
- CA-5: La interfaz de usuario muestra el progreso de Sets y Reps en formato "Set X/Y Rep X/Y" de forma visible en el HUD durante la sesión.
- CA-6: Las reglas del motor clínico (acumulación de hold time, strict mode reset) tienen cobertura de prueba unitaria en el proyecto Android verificable mediante `./gradlew test`.

---

### US-032: Calibración Clínica Avanzada

**Actor:** Paciente  
**Historia:** Como paciente, quiero que el proceso de calibración de mi rostro sea más robusto y preciso, descartando valores atípicos y pausando si me muevo demasiado, para que mi baseline sea confiable y refleje mis capacidades reales de movimiento facial.  
**Sprint:** Sprint 4  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: El sistema de calibración calcula el valor baseline usando el percentil 95 estadístico (P95): de todas las muestras recolectadas en la ventana de 3 segundos, se descartan el 5% de valores más altos (spikes de cámara o movimientos involuntarios) y se toma el percentil 95 del resto como valor baseline.
- CA-2: Se aplica un "Neutral Tare" (offset de reposo): el sistema detecta el nivel de activación de cada blendshape en el primer paso de calibración (expresión Neutral) y lo usa como offset que se resta de todos los valores subsiguientes, de modo que el reposo del paciente siempre mapea a 0.0 en la escala normalizada.
- CA-3: El "Head Stability Guard" está activo durante la calibración: si la rotación de la cabeza del paciente (detectada mediante los landmarks de MediaPipe) supera 10 grados en cualquier eje, la captura del frame se pausa automáticamente y se muestra un indicador visual pidiendo al paciente que estabilice su cabeza.
- CA-4: La pantalla de calibración incluye una silueta facial (outline o ilustración) que guía al paciente a posicionar su rostro correctamente frente a la cámara antes de iniciar cada paso.
- CA-5: El objeto `CalibrationBaseline` almacena un mapa de `neutralOffsets` con el offset calculado para cada blendshape relevante, y este mapa se persiste localmente; los cálculos de score en ejercicios posteriores consultan este mapa para normalizar correctamente.
- CA-6: Tras una calibración con spike de cámara (valor atípico significativo en uno de los frames), el valor baseline calculado no se ve afectado significativamente, validando que el filtro P95 está descartando los valores extremos correctamente.

---

## Sprint 5 — Contratos, Sincronización e Internacionalización

**Objetivo del Sprint:** Centralizar los contratos de API, implementar sincronización offline robusta con WorkManager, exponer analítica de sesiones en el portal web e internacionalizar toda la plataforma al español e inglés.

---

### US-033: Contratos OpenAPI Centralizados

**Actor:** Sistema  
**Historia:** Como sistema, quiero que todos los contratos de la API estén definidos en un paquete compartido del monorepo, para eliminar inconsistencias de nombres entre el backend, el portal web y la app móvil.  
**Sprint:** Sprint 5  
**Prioridad:** Media  

**Criterios de Aceptación:**
- CA-1: El paquete `packages/shared-types` contiene las definiciones OpenAPI o las interfaces TypeScript de todos los endpoints del API de Symma; estos tipos son importados directamente tanto por `apps/api` como por `apps/web`.
- CA-2: No existen inconsistencias de nombres de campos entre la API (NestJS), el portal web (Next.js) y los contratos del paquete compartido; la búsqueda de un nombre de campo en el paquete compartido retorna una única definición canónica.
- CA-3: Al modificar el nombre de un campo en `packages/shared-types`, los errores de TypeScript aparecen inmediatamente en los archivos de `apps/api` y `apps/web` que usan ese tipo, garantizando que el sistema de tipos detecte inconsistencias en tiempo de compilación.
- CA-4: La documentación Swagger generada por NestJS en `/api/docs` es consistente con los tipos definidos en `packages/shared-types`; no hay campos en la API que no estén representados en el paquete compartido.

---

### US-034: Sincronización Offline de Sesiones

**Actor:** Paciente  
**Historia:** Como paciente, quiero que las sesiones que realizo sin conexión a internet se suban automáticamente al servidor cuando recupero la conectividad, para que mi terapeuta pueda ver mi progreso aunque yo haga ejercicios en lugares sin internet.  
**Sprint:** Sprint 5  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Cuando el paciente completa una sesión de ejercicios sin conexión a internet, la sesión se guarda localmente en Room con el campo `is_synced` en `false`; la app muestra al paciente una confirmación de que los datos fueron guardados localmente.
- CA-2: WorkManager registra una tarea de sincronización con constraint de red disponible; cuando la conectividad se restaura, WorkManager ejecuta automáticamente la tarea de subida de sesiones pendientes sin intervención del usuario.
- CA-3: El backend implementa idempotencia en el endpoint `POST /sessions`: si se envía la misma sesión dos veces (mismo `sessionId` o los mismos `startTime` y `patientId`), el servidor retorna HTTP 200 sin crear un registro duplicado.
- CA-4: Tras una sincronización exitosa, el campo `is_synced` del registro local en Room cambia a `true` y el campo `synced_at` registra el timestamp de sincronización; la sesión ahora es visible en el portal del terapeuta.
- CA-5: Si el intento de sincronización falla (error 5xx del servidor), WorkManager reintenta la tarea con backoff exponencial hasta un máximo de 3 reintentos; los registros de Room permanecen con `is_synced` en `false` hasta que la sincronización sea exitosa.

---

### US-035: Vista de Analítica de Sesiones en Portal

**Actor:** Terapeuta  
**Historia:** Como terapeuta, quiero ver el historial detallado de sesiones de cada rutina con el detalle por ejercicio, para analizar el progreso de mis pacientes a lo largo del tiempo y ajustar el plan terapéutico según los datos objetivos.  
**Sprint:** Sprint 5  
**Prioridad:** Alta  

**Criterios de Aceptación:**
- CA-1: Existe un endpoint en el backend que retorna el historial de sesiones de una rutina con el detalle por ejercicio (incluyendo `repsCompleted`, `averageAccuracy` y `holdTimeAvg` por ejercicio); el endpoint está documentado en Swagger y requiere autenticación de terapeuta.
- CA-2: El portal web muestra una vista de historial de sesiones accesible desde el perfil del paciente o el detalle de rutina, que lista todas las sesiones con su fecha, duración y métricas principales.
- CA-3: Al expandir o acceder al detalle de una sesión, el portal muestra el desglose por ejercicio con: nombre del ejercicio, repeticiones completadas, precisión promedio (expresada en porcentaje) y tiempo de retención promedio.
- CA-4: Los datos mostrados en la vista de analítica corresponden únicamente al terapeuta autenticado; los datos de pacientes de otros terapeutas no son accesibles desde ningún endpoint ni vista del portal.
- CA-5: La vista de analítica incluye al menos una visualización gráfica (gráfica de línea o área de Recharts) que muestra la tendencia de la precisión promedio a lo largo de las sesiones de la rutina seleccionada.

---

### US-036: Internacionalización Español / Inglés

**Actor:** Sistema  
**Historia:** Como sistema, quiero que toda la plataforma (portal web, API y app móvil) soporte los idiomas español e inglés de forma consistente, para que pueda adaptarse a diferentes regiones y contextos clínicos hispanohablantes y angloparlantes.  
**Sprint:** Sprint 5  
**Prioridad:** Media  

**Criterios de Aceptación:**
- CA-1: El portal web (Next.js) implementa `next-intl` y muestra todos los textos de la interfaz (labels, mensajes de error, notificaciones, títulos) en el idioma seleccionado; al cambiar el idioma de español a inglés y viceversa, todos los textos visibles cambian sin recargar la página.
- CA-2: El backend (NestJS) implementa `nestjs-i18n` y retorna los mensajes de error y validación en el idioma indicado por el header `Accept-Language` de la petición; los mensajes de error para el portal web aparecen en español y para cualquier cliente que solicite inglés, en inglés.
- CA-3: La app móvil Android utiliza archivos `strings.xml` separados por idioma (`values/strings.xml` para español, `values-en/strings.xml` para inglés); la app muestra los textos en el idioma configurado en el sistema operativo del dispositivo Android.
- CA-4: El paquete `@symma/i18n` en el monorepo centraliza las cadenas de texto compartidas entre el portal web y el backend (como nombres de ejercicios, categorías y mensajes de estado), garantizando consistencia entre ambas aplicaciones.
- CA-5: Al cambiar el idioma en la app, los nombres de ejercicios, instrucciones del wizard de calibración y mensajes motivacionales de la barra de calidad se muestran en el idioma correcto sin necesidad de reiniciar la aplicación.

---

## Actores del Sistema

El sistema Symma Platform define tres actores principales que interactúan con la plataforma. Cada actor tiene un rol delimitado, responsabilidades específicas y accede a distintas partes del ecosistema tecnológico.

---

### Terapeuta

**Descripción:** Profesional de la salud (licenciado en fisioterapia, fonoaudiología o neurología) especializado en el tratamiento de la parálisis facial. Es el administrador clínico del sistema y el principal usuario del portal web de Symma.

**Responsabilidades:**
- Crear y gestionar el perfil clínico de sus pacientes, incluyendo datos personales, diagnóstico y grado de parálisis (escala House-Brackmann).
- Diseñar rutinas de rehabilitación personalizadas seleccionando ejercicios del catálogo y configurando los parámetros terapéuticos de cada uno (reps, sets, hold time, nivel de dificultad, modo estricto).
- Monitorear el progreso de sus pacientes a través del dashboard y las vistas de analítica, analizando métricas objetivas de precisión y cumplimiento.
- Gestionar el acceso de los pacientes a la app móvil mediante la generación y revocación de PINs de acceso.
- Tomar decisiones clínicas informadas basadas en los datos recolectados (ajustar la dificultad de la rutina, cambiar ejercicios, generar alertas de cumplimiento).

**Plataforma de acceso:** Portal web (Next.js), accesible desde navegador de escritorio o tableta.

**Autenticación:** Email y contraseña, con JWT gestionado por NextAuth.js.

**Alcance de datos:** Acceso exclusivo a los pacientes y rutinas que él mismo ha creado; el sistema garantiza el aislamiento de datos entre terapeutas.

---

### Paciente

**Descripción:** Persona que ha sido diagnosticada con parálisis facial (de origen periférico o central, como parálisis de Bell, paresia post-quirúrgica u otras etiologías) y se encuentra en proceso de rehabilitación bajo la supervisión de un terapeuta registrado en Symma.

**Responsabilidades:**
- Autenticarse en la app móvil usando el PIN de 6 dígitos proporcionado por su terapeuta.
- Realizar las sesiones de ejercicios de rehabilitación guiadas por la app en el horario indicado por su terapeuta.
- Ejecutar el proceso de calibración facial antes de comenzar las sesiones, para personalizar las métricas a sus capacidades físicas.
- Interactuar con la interfaz de cámara durante los ejercicios, siguiendo las instrucciones visuales y la retroalimentación de la barra de calidad.
- Completar las sesiones para que los datos se sincronicen automáticamente con el backend y sean visibles para su terapeuta.

**Plataforma de acceso:** Aplicación Android (Kotlin + Jetpack Compose), instalada en un dispositivo móvil con Android.

**Autenticación:** PIN de 6 dígitos provisto por el terapeuta, con JWT de larga duración almacenado en `EncryptedSharedPreferences`.

**Consideraciones especiales:** El paciente puede tener movilidad facial reducida o limitaciones motoras finas, por lo que la interfaz prioriza elementos de gran tamaño, mínima escritura y retroalimentación visual clara. La app opera en modo offline-first para no depender de la conectividad durante la sesión de ejercicios.

---

### Sistema

**Descripción:** Actor abstracto que representa los comportamientos internos automatizados de la plataforma Symma, incluyendo el backend NestJS, la base de datos PostgreSQL, el motor de visión computacional MediaPipe en el dispositivo Android, WorkManager para sincronización en segundo plano, y todos los procesos de infraestructura del monorepo.

**Responsabilidades:**
- Ejecutar la autenticación y autorización de terapeutas y pacientes mediante JWT.
- Persistir y sincronizar los datos clínicos entre la app móvil (Room DB) y el backend (PostgreSQL via Prisma).
- Procesar los frames de cámara en tiempo real mediante MediaPipe FaceLandmarker para extraer los 468 landmarks faciales y los blendshapes de expresión.
- Calcular el índice de simetría facial y los scores de ejercicio usando los algoritmos implementados (SymmetryCalculator, ExerciseStrategy pattern).
- Gestionar la sincronización offline de sesiones mediante WorkManager, garantizando que los datos se suban al backend cuando la conectividad esté disponible.
- Mantener el aislamiento de datos entre terapeutas y proteger la información sensible de los pacientes conforme a los principios de la LFPDPPP.

**Plataforma:** NestJS (API REST, puerto 4001), PostgreSQL 15 (puerto 5440, Docker), Next.js (Server Components), Android WorkManager y MediaPipe (on-device).

---

*Fin del documento — Historias de Usuario Symma Platform v1.0*
