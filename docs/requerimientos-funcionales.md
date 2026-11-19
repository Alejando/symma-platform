# Documento de Requerimientos Funcionales
## Symma Platform — Sistema Digital de Rehabilitación de Parálisis Facial

---

## Tabla de Resumen

| ID      | Nombre                                                        | Módulo                               | US Relacionada(s)         |
|---------|---------------------------------------------------------------|--------------------------------------|---------------------------|
| RF-001  | Autenticación de terapeuta con email y contraseña             | Autenticación y Control de Acceso    | US-002                    |
| RF-002  | Generación de sesión JWT para terapeuta                       | Autenticación y Control de Acceso    | US-002                    |
| RF-003  | Generación de PIN de acceso para paciente                     | Autenticación y Control de Acceso    | US-009                    |
| RF-004  | Visualización única del PIN generado                          | Autenticación y Control de Acceso    | US-009                    |
| RF-005  | Revocación del PIN de un paciente                             | Autenticación y Control de Acceso    | US-009                    |
| RF-006  | Autenticación de paciente con PIN de 6 dígitos                | Autenticación y Control de Acceso    | US-014                    |
| RF-007  | Emisión de JWT de larga duración para paciente                | Autenticación y Control de Acceso    | US-011, US-014             |
| RF-008  | Protección de rutas y redirección a login                     | Autenticación y Control de Acceso    | US-002, US-011             |
| RF-009  | Aislamiento de datos por terapeuta                            | Autenticación y Control de Acceso    | US-002                    |
| RF-010  | Creación de perfil de paciente                                | Gestión de Pacientes                 | US-003                    |
| RF-011  | Consulta y búsqueda de pacientes                              | Gestión de Pacientes                 | US-003, US-005             |
| RF-012  | Edición de perfil de paciente                                 | Gestión de Pacientes                 | US-003                    |
| RF-013  | Archivado lógico de paciente                                  | Gestión de Pacientes                 | US-003                    |
| RF-014  | Escala House-Brackmann en perfil de paciente                  | Gestión de Pacientes                 | US-003                    |
| RF-015  | Vista de perfil de paciente con pestañas                      | Gestión de Pacientes                 | US-005                    |
| RF-016  | Creación de ejercicio en catálogo                             | Catálogo de Ejercicios               | US-007                    |
| RF-017  | Edición y consulta de ejercicios                              | Catálogo de Ejercicios               | US-007                    |
| RF-018  | Restricción de eliminación de ejercicios activos              | Catálogo de Ejercicios               | US-007                    |
| RF-019  | Clasificación de ejercicios por tipo y categoría              | Catálogo de Ejercicios               | US-007                    |
| RF-020  | Creación de rutina con ejercicios anidados                    | Gestión de Rutinas                   | US-004, US-007             |
| RF-021  | Edición de rutina sin sesiones registradas                    | Gestión de Rutinas                   | US-004, US-006             |
| RF-022  | Restricción de edición de ejercicios en rutina activa         | Gestión de Rutinas                   | US-004, US-006             |
| RF-023  | Reordenamiento de ejercicios en rutina                        | Gestión de Rutinas                   | US-004                    |
| RF-024  | Clonación de rutina                                           | Gestión de Rutinas                   | US-004, US-008             |
| RF-025  | Eliminación de rutina según ciclo de vida                     | Gestión de Rutinas                   | US-004                    |
| RF-026  | Vista de rutinas activas e historial del paciente             | Gestión de Rutinas                   | US-005, US-006             |
| RF-027  | KPI de pacientes activos en dashboard                         | Dashboard del Terapeuta              | US-010                    |
| RF-028  | KPI de alertas de cumplimiento en dashboard                   | Dashboard del Terapeuta              | US-010                    |
| RF-029  | KPI de eficacia promedio en dashboard                         | Dashboard del Terapeuta              | US-010                    |
| RF-030  | Lista de pacientes en riesgo en dashboard                     | Dashboard del Terapeuta              | US-010                    |
| RF-031  | Consulta de estadísticas agregadas de rutina                  | Analítica de Sesiones                | US-006, US-035             |
| RF-032  | Consulta paginada del historial de sesiones                   | Analítica de Sesiones                | US-006, US-035             |
| RF-033  | Consulta de detalle de sesión por ejercicio                   | Analítica de Sesiones                | US-006, US-035             |
| RF-034  | Gráfica de evolución de precisión en portal web               | Analítica de Sesiones                | US-006, US-035             |
| RF-035  | Endpoint de autenticación móvil del paciente                  | Gateway Móvil                        | US-011                    |
| RF-036  | Endpoint de rutina activa para dispositivo móvil              | Gateway Móvil                        | US-011                    |
| RF-037  | Endpoint de registro de sesión completada                     | Gateway Móvil                        | US-011                    |
| RF-038  | Idempotencia en registro de sesiones desde móvil              | Gateway Móvil                        | US-011                    |
| RF-039  | Arquitectura modular Clean Architecture en app Android        | Configuración del Proyecto Android   | US-012, US-013             |
| RF-040  | Interceptor de autenticación en cliente HTTP móvil            | Configuración del Proyecto Android   | US-012, US-013             |
| RF-041  | Persistencia local con Room Database                          | Configuración del Proyecto Android   | US-012, US-013             |
| RF-042  | Pantalla de login con PIN para paciente                       | Funcionalidades Móviles — Paciente   | US-014                    |
| RF-043  | Almacenamiento seguro del token en dispositivo                | Funcionalidades Móviles — Paciente   | US-014                    |
| RF-044  | Sincronización offline-first en pantalla principal            | Funcionalidades Móviles — Paciente   | US-015                    |
| RF-045  | Visualización de cámara frontal espejada                      | Funcionalidades Móviles — Paciente   | US-016                    |
| RF-046  | Máquina de estados del reproductor de ejercicios              | Funcionalidades Móviles — Paciente   | US-017, US-018             |
| RF-047  | Temporizador de ejercicio con pausa y reanudación             | Funcionalidades Móviles — Paciente   | US-017, US-018             |
| RF-048  | Pantalla de resumen y envío de sesión al completar            | Funcionalidades Móviles — Paciente   | US-019                    |
| RF-049  | Detección de landmarks faciales con MediaPipe                 | Visión Computacional                 | US-022, US-023             |
| RF-050  | Superposición de malla facial sobre cámara                    | Visión Computacional                 | US-023                    |
| RF-051  | Cálculo de índice de simetría facial                          | Visión Computacional                 | US-024                    |
| RF-052  | Indicador visual de calidad de simetría                       | Visión Computacional                 | US-025, US-026             |
| RF-053  | Wizard de calibración facial en 5 pasos                       | Calibración del Paciente             | US-027, US-032             |
| RF-054  | Captura automática con algoritmo P95 por paso                 | Calibración del Paciente             | US-027                    |
| RF-055  | Tare neutral y guardia de estabilidad de cabeza               | Calibración del Paciente             | US-027, US-032             |
| RF-056  | Motor de estrategias de ejercicio por módulo facial           | Motor Clínico de Ejercicios          | US-028, US-030, US-031     |
| RF-057  | Lógica isométrica con hold timer condicional                  | Motor Clínico de Ejercicios          | US-028, US-030             |
| RF-058  | Lógica isotónica con detección de repetición por borde        | Motor Clínico de Ejercicios          | US-028, US-031             |
| RF-059  | Sincronización diferida de sesiones con WorkManager           | Sincronización Offline               | US-015, US-034             |
| RF-060  | Reintentos con backoff exponencial en sincronización          | Sincronización Offline               | US-019, US-034             |
| RF-061  | Soporte multilingüe en portal web, API y app móvil            | Internacionalización                 | US-033, US-036             |

---

## 1. Módulo de Autenticación y Control de Acceso

### RF-001 — Autenticación de terapeuta con email y contraseña

**Descripción:** El sistema debe permitir al terapeuta iniciar sesión en el portal web mediante la introducción de su dirección de correo electrónico y contraseña. El backend NestJS validará las credenciales contra la base de datos y, mediante NextAuth en el frontend, establecerá una sesión autenticada.

**US relacionada(s):** US-002

---

### RF-002 — Generación de sesión JWT para terapeuta

**Descripción:** El sistema debe emitir un token JWT firmado al terapeuta tras una autenticación exitosa. Dicho token contendrá el identificador del terapeuta y los roles asociados, y será utilizado para autorizar todas las peticiones subsiguientes al backend.

**US relacionada(s):** US-002

---

### RF-003 — Generación de PIN de acceso para paciente

**Descripción:** El sistema debe permitir al terapeuta generar un código PIN de 6 dígitos para un paciente específico. El PIN se almacenará en la base de datos en formato hash utilizando bcrypt, de modo que nunca se persista en texto plano.

**US relacionada(s):** US-009

---

### RF-004 — Visualización única del PIN generado

**Descripción:** El sistema debe mostrar el PIN generado al terapeuta una única vez, en un modal de confirmación inmediatamente después de su creación. Una vez cerrado el modal, el sistema no volverá a exponer el valor en texto plano; cualquier intento de consulta posterior únicamente confirmará la existencia de un PIN activo.

**US relacionada(s):** US-009

---

### RF-005 — Revocación del PIN de un paciente

**Descripción:** El sistema debe permitir al terapeuta revocar el PIN de acceso de un paciente. La revocación establecerá el campo correspondiente en la base de datos como nulo, invalidando cualquier sesión futura que intente autenticarse con ese código.

**US relacionada(s):** US-009

---

### RF-006 — Autenticación de paciente con PIN de 6 dígitos

**Descripción:** El sistema debe permitir al paciente autenticarse en la aplicación móvil introduciendo un código PIN de 6 dígitos. La pantalla mostrará seis indicadores circulares que reflejen el progreso de la entrada y un teclado numérico de gran tamaño. La autenticación se enviará automáticamente al introducirse el sexto dígito, sin requerir pulsación de un botón adicional.

**US relacionada(s):** US-014

---

### RF-007 — Emisión de JWT de larga duración para paciente

**Descripción:** El sistema debe emitir un token JWT con vigencia extendida al paciente tras una autenticación exitosa, empleando una estrategia de autenticación independiente (PatientJwtStrategy). Este token permitirá al paciente continuar usando la aplicación móvil sin reautenticarse frecuentemente.

**US relacionada(s):** US-011, US-014

---

### RF-008 — Protección de rutas y redirección a login

**Descripción:** El sistema debe proteger todas las rutas del portal web y los endpoints de la API que requieran autenticación. Cualquier petición sin un JWT válido será rechazada con el código HTTP 401, y el portal web redirigirá automáticamente al usuario a la pantalla de inicio de sesión correspondiente.

**US relacionada(s):** US-002, US-011

---

### RF-009 — Aislamiento de datos por terapeuta

**Descripción:** El sistema debe garantizar que un terapeuta autenticado solo pueda acceder a los registros de sus propios pacientes, rutinas y sesiones. Toda consulta a la base de datos debe filtrar por el identificador del terapeuta extraído del JWT, impidiendo el acceso cruzado entre cuentas.

**US relacionada(s):** US-002

---

## 2. Módulo de Gestión de Pacientes

### RF-010 — Creación de perfil de paciente

**Descripción:** El sistema debe permitir al terapeuta crear un nuevo perfil de paciente con los siguientes campos: nombre, apellido, correo electrónico (obligatorio), diagnóstico, fecha de nacimiento, género, teléfono, grado de parálisis según la escala House-Brackmann, notas clínicas y datos de contacto de emergencia. El registro quedará asociado al terapeuta autenticado.

**US relacionada(s):** US-003

---

### RF-011 — Consulta y búsqueda de pacientes

**Descripción:** El sistema debe presentar al terapeuta una lista paginada de sus pacientes activos, con capacidad de búsqueda por nombre o apellido. Los resultados mostrarán el estado del paciente, la foto de perfil o un avatar con sus iniciales en su ausencia.

**US relacionada(s):** US-003, US-005

---

### RF-012 — Edición de perfil de paciente

**Descripción:** El sistema debe permitir al terapeuta actualizar cualquier campo del perfil de un paciente. Los cambios se persistirán de forma inmediata y se reflejarán en todas las vistas que muestren información del paciente.

**US relacionada(s):** US-003

---

### RF-013 — Archivado lógico de paciente

**Descripción:** El sistema debe permitir al terapeuta archivar un paciente. La operación cambiará el campo de estado del registro a ARCHIVED sin eliminar la fila de la base de datos, preservando así el historial clínico completo.

**US relacionada(s):** US-003

---

### RF-014 — Escala House-Brackmann en perfil de paciente

**Descripción:** El sistema debe registrar y mostrar el grado de parálisis facial del paciente conforme a la escala House-Brackmann, con valores enteros del 1 al 6. Este campo formará parte del perfil clínico y podrá actualizarse en cada consulta de seguimiento.

**US relacionada(s):** US-003

---

### RF-015 — Vista de perfil de paciente con pestañas

**Descripción:** El sistema debe presentar el perfil de un paciente mediante una interfaz organizada en pestañas que incluya, al menos, una pestaña de resumen clínico (Overview) y una pestaña de rutinas asignadas. Cada pestaña cargará su contenido de forma independiente.

**US relacionada(s):** US-005

---

## 3. Módulo de Catálogo de Ejercicios

### RF-016 — Creación de ejercicio en catálogo

**Descripción:** El sistema debe permitir al terapeuta crear un nuevo ejercicio en el catálogo global, especificando nombre, tipo (ISOTONIC o ISOMETRIC), categoría (WARMUP, CORE o COOLDOWN), módulo móvil (EYES, EYES_INVERSE, BROWS, JAW, SMILE o KISS), URLs de recursos multimedia y un identificador único de clave (key_name) empleado para internacionalización.

**US relacionada(s):** US-007

---

### RF-017 — Edición y consulta de ejercicios

**Descripción:** El sistema debe permitir al terapeuta consultar el catálogo completo de ejercicios y editar los atributos de cualquier ejercicio existente, con excepción de aquellos que estén siendo utilizados en rutinas activas, cuya edición estará restringida.

**US relacionada(s):** US-007

---

### RF-018 — Restricción de eliminación de ejercicios activos

**Descripción:** El sistema debe impedir la eliminación de un ejercicio que esté referenciado en al menos una rutina activa. Al intentar eliminarlo, el sistema retornará un error descriptivo indicando que el ejercicio se encuentra en uso.

**US relacionada(s):** US-007

---

### RF-019 — Clasificación de ejercicios por tipo y categoría

**Descripción:** El sistema debe clasificar cada ejercicio según su tipo de contracción muscular (ISOTONIC o ISOMETRIC) y su categoría dentro de la sesión (WARMUP, CORE o COOLDOWN). Estas clasificaciones determinarán el motor clínico y la organización de la rutina en el dispositivo móvil.

**US relacionada(s):** US-007

---

## 4. Módulo de Gestión de Rutinas

### RF-020 — Creación de rutina con ejercicios anidados

**Descripción:** El sistema debe permitir al terapeuta crear una rutina asignada a un paciente específico, incluyendo en la misma operación transaccional todos los ítems de ejercicio (RoutineItems) con sus parámetros: conjuntos, repeticiones por conjunto, segundos de hold objetivo, nivel de dificultad (float), descanso entre conjuntos, modo estricto, permiso de salto, módulo móvil y tipo de ejercicio.

**US relacionada(s):** US-004, US-007

---

### RF-021 — Edición de rutina sin sesiones registradas

**Descripción:** El sistema debe permitir la edición completa de una rutina —incluyendo sus ejercicios y parámetros— siempre que no existan sesiones registradas asociadas a dicha rutina.

**US relacionada(s):** US-004, US-006

---

### RF-022 — Restricción de edición de ejercicios en rutina activa

**Descripción:** El sistema debe restringir la modificación de los ejercicios y parámetros clínicos de una rutina que ya posea sesiones registradas. En ese estado, únicamente se permitirá actualizar el nombre de la rutina y sus fechas de vigencia.

**US relacionada(s):** US-004, US-006

---

### RF-023 — Reordenamiento de ejercicios en rutina

**Descripción:** El sistema debe permitir al terapeuta modificar el orden de los ejercicios dentro de una rutina mediante la actualización del campo order_index de cada RoutineItem. El orden resultante será el que la aplicación móvil presente al paciente durante la sesión.

**US relacionada(s):** US-004

---

### RF-024 — Clonación de rutina

**Descripción:** El sistema debe permitir al terapeuta clonar una rutina existente, generando una nueva rutina con todos sus RoutineItems copiados y con el contador de sesiones en cero. La rutina clonada será independiente de la original y podrá editarse libremente.

**US relacionada(s):** US-004, US-008

---

### RF-025 — Eliminación de rutina según ciclo de vida

**Descripción:** El sistema debe aplicar una política de eliminación diferenciada según el historial de la rutina: si la rutina no tiene sesiones registradas, se realizará una eliminación física (hard delete); si tiene al menos una sesión, se cambiará el estado a ARCHIVED (soft delete), preservando el historial clínico.

**US relacionada(s):** US-004

---

### RF-026 — Vista de rutinas activas e historial del paciente

**Descripción:** El sistema debe mostrar, dentro del perfil del paciente, una distinción clara entre la rutina actualmente activa y las rutinas archivadas o anteriores. El terapeuta podrá acceder al historial de sesiones de cada rutina desde esta vista.

**US relacionada(s):** US-005, US-006

---

## 5. Módulo de Dashboard del Terapeuta

### RF-027 — KPI de pacientes activos en dashboard

**Descripción:** El sistema debe mostrar en el dashboard del terapeuta el número total de pacientes con estado ACTIVE asignados a su cuenta. El valor se actualizará en cada carga de la página.

**US relacionada(s):** US-010

---

### RF-028 — KPI de alertas de cumplimiento en dashboard

**Descripción:** El sistema debe calcular y mostrar el número de pacientes que tienen una rutina activa asignada pero que no han registrado ninguna sesión en las últimas 72 horas. Cada paciente en esta condición se considerará una alerta de cumplimiento.

**US relacionada(s):** US-010

---

### RF-029 — KPI de eficacia promedio en dashboard

**Descripción:** El sistema debe calcular y mostrar el promedio del índice de simetría (symmetry_score) de todas las sesiones completadas en los últimos 7 días por los pacientes del terapeuta, expresado como porcentaje.

**US relacionada(s):** US-010

---

### RF-030 — Lista de pacientes en riesgo en dashboard

**Descripción:** El sistema debe presentar en el dashboard una lista de los pacientes identificados con alerta de cumplimiento, incluyendo un enlace directo al perfil de cada uno para facilitar el seguimiento del terapeuta.

**US relacionada(s):** US-010

---

## 6. Módulo de Analítica de Sesiones

### RF-031 — Consulta de estadísticas agregadas de rutina

**Descripción:** El sistema debe exponer un endpoint que, dado el identificador de una rutina, retorne las estadísticas agregadas: número total de sesiones, puntuación promedio de simetría, racha actual de días consecutivos con sesión registrada y datos históricos para la construcción de gráficas de evolución.

**US relacionada(s):** US-006, US-035

---

### RF-032 — Consulta paginada del historial de sesiones

**Descripción:** El sistema debe exponer un endpoint que retorne la lista paginada de sesiones asociadas a una rutina, incluyendo para cada sesión la fecha, duración total y métricas generales de la ejecución.

**US relacionada(s):** US-006, US-035

---

### RF-033 — Consulta de detalle de sesión por ejercicio

**Descripción:** El sistema debe exponer un endpoint que, dado el identificador de una sesión, retorne el detalle de rendimiento por ejercicio: repeticiones completadas, precisión promedio y tiempo de hold promedio.

**US relacionada(s):** US-006, US-035

---

### RF-034 — Gráfica de evolución de precisión en portal web

**Descripción:** El sistema debe presentar en el portal web una gráfica de área que muestre la evolución temporal del índice de precisión del paciente a lo largo de sus sesiones, permitiendo al terapeuta evaluar la progresión clínica de forma visual.

**US relacionada(s):** US-006, US-035

---

## 7. Módulo de Gateway Móvil

### RF-035 — Endpoint de autenticación móvil del paciente

**Descripción:** El sistema debe exponer el endpoint POST /auth/patient/login que reciba el identificador del paciente y el código de acceso, valide las credenciales contra la base de datos y, en caso de éxito, retorne un JWT para uso exclusivo de la aplicación móvil.

**US relacionada(s):** US-011

---

### RF-036 — Endpoint de rutina activa para dispositivo móvil

**Descripción:** El sistema debe exponer el endpoint GET /mobile/routine/active que retorne, en una única respuesta, la rutina activa del paciente autenticado junto con todos sus ejercicios anidados y sus parámetros clínicos, optimizando así el número de peticiones de red desde el dispositivo móvil.

**US relacionada(s):** US-011

---

### RF-037 — Endpoint de registro de sesión completada

**Descripción:** El sistema debe exponer el endpoint POST /sessions que permita a la aplicación móvil enviar una sesión completada, incluyendo el identificador de rutina, los tiempos de inicio y fin y el detalle de cada ítem ejecutado con sus métricas de rendimiento.

**US relacionada(s):** US-011

---

### RF-038 — Idempotencia en registro de sesiones desde móvil

**Descripción:** El sistema debe garantizar que el envío duplicado de una misma sesión —identificada por una clave única compuesta— no genere registros redundantes en la base de datos. Peticiones repetidas con la misma sesión retornarán HTTP 200 sin crear un nuevo registro.

**US relacionada(s):** US-011

---

## 8. Módulo de Configuración del Proyecto Android

### RF-039 — Arquitectura modular Clean Architecture en app Android

**Descripción:** El sistema debe estructurar la aplicación Android siguiendo el patrón Clean Architecture con separación en capas: presentación (MVVM con Jetpack Compose), dominio (modelos y contratos de repositorio) y datos (implementaciones, fuentes y mapeadores). Los módulos Gradle definidos serán: core, domain, data y presentation.

**US relacionada(s):** US-012, US-013

---

### RF-040 — Interceptor de autenticación en cliente HTTP móvil

**Descripción:** El sistema debe configurar el cliente Retrofit con un AuthInterceptor que inyecte automáticamente el token JWT almacenado en el dispositivo como cabecera Bearer en todas las peticiones HTTP salientes, sin requerir intervención manual del código de negocio.

**US relacionada(s):** US-012, US-013

---

### RF-041 — Persistencia local con Room Database

**Descripción:** El sistema debe utilizar Room Database como capa de persistencia local en la aplicación Android, almacenando la rutina activa, los ítems de ejercicio y las sesiones pendientes de sincronización, de forma que la información esté disponible sin conexión a internet.

**US relacionada(s):** US-012, US-013

---

## 9. Módulo de Funcionalidades Móviles — Paciente

### RF-042 — Pantalla de login con PIN para paciente

**Descripción:** El sistema debe presentar al paciente una pantalla de autenticación compuesta por seis indicadores circulares que reflejen en tiempo real el progreso de entrada del PIN, acompañados de un teclado numérico de gran tamaño adaptado a uso táctil. Al introducirse el sexto dígito, el sistema iniciará el proceso de autenticación automáticamente.

**US relacionada(s):** US-014

---

### RF-043 — Almacenamiento seguro del token en dispositivo

**Descripción:** El sistema debe persistir el token JWT del paciente en EncryptedSharedPreferences, garantizando que el token se encuentre cifrado en el almacenamiento del dispositivo y no sea accesible por otras aplicaciones.

**US relacionada(s):** US-014

---

### RF-044 — Sincronización offline-first en pantalla principal

**Descripción:** El sistema debe implementar una estrategia offline-first en la pantalla principal de la aplicación móvil: al abrir la pantalla, se presentarán inmediatamente los datos almacenados en Room Database y, en segundo plano, se solicitará al servidor la versión actualizada para refrescar el caché local. Si no existe conexión a internet ni datos en caché, se mostrará un estado vacío informativo.

**US relacionada(s):** US-015

---

### RF-045 — Visualización de cámara frontal espejada

**Descripción:** El sistema debe activar la cámara frontal del dispositivo y presentar la vista previa de forma espejada, vinculada al ciclo de vida de la actividad Android, garantizando que la cámara se libere correctamente al pausar o destruir la pantalla.

**US relacionada(s):** US-016

---

### RF-046 — Máquina de estados del reproductor de ejercicios

**Descripción:** El sistema debe gestionar la sesión de ejercicios mediante una máquina de estados con las fases: GetReady (preparación), Exercise (ejecución activa), Rest (descanso entre conjuntos) y Completed (finalización). Las transiciones entre estados serán automáticas según el progreso del paciente y los parámetros de la rutina.

**US relacionada(s):** US-017, US-018

---

### RF-047 — Temporizador de ejercicio con pausa y reanudación

**Descripción:** El sistema debe implementar un temporizador reactivo basado en Flow de Kotlin que controle los tiempos de ejecución y descanso de cada ejercicio. El temporizador permitirá al paciente pausar y reanudar la sesión en cualquier momento dentro de las fases Exercise y Rest.

**US relacionada(s):** US-017, US-018

---

### RF-048 — Pantalla de resumen y envío de sesión al completar

**Descripción:** El sistema debe mostrar una pantalla de resumen al finalizar la sesión, con las métricas agregadas de rendimiento por ejercicio. Desde esta pantalla, el sistema enviará automáticamente los datos de la sesión al backend mediante POST /sessions. Al salir de la pantalla de resumen, el sistema limpiará la pila de navegación (backstack) para evitar el retorno accidental al flujo de ejercicio.

**US relacionada(s):** US-019

---

## 10. Módulo de Visión Computacional

### RF-049 — Detección de landmarks faciales con MediaPipe

**Descripción:** El sistema debe integrar FaceLandmarker de MediaPipe en modo LIVE_STREAM para detectar en tiempo real los 468 landmarks del rostro del paciente a una tasa mínima de 30 fotogramas por segundo, utilizando la cámara frontal del dispositivo durante la ejecución de los ejercicios.

**US relacionada(s):** US-022, US-023

---

### RF-050 — Superposición de malla facial sobre cámara

**Descripción:** El sistema debe renderizar, sobre el fotograma de la cámara, un Canvas de Jetpack Compose que dibuje los landmarks faciales detectados, transformando las coordenadas normalizadas de MediaPipe a coordenadas de píxel de la pantalla del dispositivo para una alineación precisa con el rostro del paciente.

**US relacionada(s):** US-023

---

### RF-051 — Cálculo de índice de simetría facial

**Descripción:** El sistema debe calcular un índice de simetría facial expresado en un rango de 0 a 100 % a partir de las distancias relativas de puntos clave del rostro (incluyendo las comisuras labiales) extraídas de los landmarks de MediaPipe. El cálculo se realizará en cada fotograma procesado durante la fase activa del ejercicio.

**US relacionada(s):** US-024

---

### RF-052 — Indicador visual de calidad de simetría

**Descripción:** El sistema debe mostrar una barra de calidad animada cuyo color cambie según el índice de simetría calculado: verde para valores iguales o superiores al 80 %, amarillo para valores entre el 50 % y el 79 %, y rojo para valores inferiores al 50 %. La barra se acompañará de un texto motivacional dinámico acorde al nivel alcanzado.

**US relacionada(s):** US-025, US-026

---

## 11. Módulo de Calibración del Paciente

### RF-053 — Wizard de calibración facial en 5 pasos

**Descripción:** El sistema debe guiar al paciente a través de un asistente de calibración estructurado en cinco pasos secuenciales: posición neutral (tare), sonrisa, sorpresa, beso y apertura de mandíbula. Cada paso mostrará una silueta facial de referencia para orientar el posicionamiento correcto del rostro ante la cámara.

**US relacionada(s):** US-027, US-032

---

### RF-054 — Captura automática con algoritmo P95 por paso

**Descripción:** El sistema debe capturar automáticamente las muestras de landmarks durante una ventana de 3 segundos en cada paso del wizard de calibración. Tras la captura, aplicará el algoritmo del percentil 95 (P95), descartando el 5 % superior de muestras para reducir el impacto de ruido o movimientos involuntarios, y calculará el valor representativo de cada punto de referencia.

**US relacionada(s):** US-027

---

### RF-055 — Tare neutral y guardia de estabilidad de cabeza

**Descripción:** El sistema debe registrar el estado neutro del rostro del paciente en el primer paso de calibración como línea de base (neutral tare), restando este offset a las mediciones activas para normalizar las diferencias de posición en reposo. Adicionalmente, el sistema debe pausar automáticamente la captura de muestras si detecta una rotación de cabeza superior a 10°, reanudándola al recuperar la estabilidad.

**US relacionada(s):** US-027, US-032

---

## 12. Módulo de Motor Clínico de Ejercicios

### RF-056 — Motor de estrategias de ejercicio por módulo facial

**Descripción:** El sistema debe implementar el motor clínico de ejercicios mediante el patrón de diseño Strategy, donde cada módulo facial (EYES, EYES_INVERSE, BROWS, JAW, SMILE, KISS) cuenta con su propia implementación de la interfaz ExerciseStrategy. Cada estrategia calculará la puntuación del ejercicio a partir de los blendshapes de MediaPipe, la línea de base de calibración del paciente y el factor de dificultad configurado en la rutina.

**US relacionada(s):** US-028, US-030, US-031

---

### RF-057 — Lógica isométrica con hold timer condicional

**Descripción:** El sistema debe implementar la lógica de ejercicios de tipo ISOMETRIC de forma que el temporizador de hold solo avance mientras la puntuación del paciente sea igual o superior al umbral de activación definido como el producto de la línea de base de calibración y el factor de dificultad. Si el modo estricto está habilitado y la puntuación cae por debajo del umbral durante el hold, el temporizador se reiniciará al cero.

**US relacionada(s):** US-028, US-030

---

### RF-058 — Lógica isotónica con detección de repetición por borde

**Descripción:** El sistema debe implementar la lógica de ejercicios de tipo ISOTONIC de forma que cada repetición se contabilice al detectar una transición de borde de estado negativo a positivo (False→True) en la activación del umbral. El sistema contará las repeticiones por conjunto según los parámetros definidos en el RoutineItem.

**US relacionada(s):** US-028, US-031

---

## 13. Módulo de Sincronización Offline

### RF-059 — Sincronización diferida de sesiones con WorkManager

**Descripción:** El sistema debe utilizar WorkManager de Android para programar una tarea de sincronización en segundo plano que se ejecute únicamente cuando exista conectividad de red disponible. Si el envío de una sesión al servidor falla por ausencia de conexión, la sesión se almacenará en Room Database con el campo is_synced establecido en falso, y WorkManager gestionará su envío en cuanto la red sea recuperada.

**US relacionada(s):** US-015, US-034

---

### RF-060 — Reintentos con backoff exponencial en sincronización

**Descripción:** El sistema debe configurar la tarea de sincronización de WorkManager con una política de reintentos de backoff exponencial, con un máximo de tres intentos. Tras una sincronización exitosa, el sistema actualizará los campos is_synced y synced_at del registro en Room Database para reflejar el estado sincronizado.

**US relacionada(s):** US-019, US-034

---

## 14. Módulo de Internacionalización

### RF-061 — Soporte multilingüe en portal web, API y app móvil

**Descripción:** El sistema debe soportar múltiples idiomas (español e inglés) en todos sus componentes. El portal web empleará next-intl para cambio de idioma sin recarga de página; la API utilizará nestjs-i18n para seleccionar el idioma según la cabecera Accept-Language de la petición; la aplicación Android gestionará los textos mediante archivos strings.xml por locale. Las cadenas de texto comunes serán centralizadas en el paquete compartido @symma/i18n.

**US relacionada(s):** US-033, US-036
