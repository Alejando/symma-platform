# Documentación de la API REST — Symma Platform

## 1. Información General

| Atributo | Valor |
|----------|-------|
| Base URL (desarrollo) | `http://localhost:4001` |
| Versión | 1.0.0 |
| Formato de solicitud | `application/json` |
| Formato de respuesta | `application/json` |
| Esquema de autenticación | Bearer JWT (Authorization header) |

### 1.1 Autenticación

La API utiliza tokens **JWT (JSON Web Token)** como mecanismo de autenticación. Todos los endpoints protegidos requieren que el cliente envíe el token en el encabezado HTTP:

```
Authorization: Bearer <token>
```

Existen **dos tipos de tokens**, emitidos por flujos de autenticación distintos:

| Tipo de token | Emisor | Alcance |
|---------------|--------|---------|
| **JWT Terapeuta** | `POST /auth/login` | Acceso a todos los módulos de gestión (pacientes, rutinas, ejercicios, dashboard) |
| **JWT Paciente** | `POST /auth/patient/login` | Acceso exclusivo a endpoints móviles (`/mobile/*`, `POST /sessions`) |

Los endpoints de tipo `POST /auth/login` y `POST /auth/patient/login` son públicos (no requieren token).

---

## 2. Resumen de Endpoints

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| POST | `/auth/login` | Login del terapeuta con email y contraseña | Pública |
| GET | `/auth/profile` | Perfil del terapeuta autenticado | JWT Terapeuta |
| POST | `/auth/patient/login` | Login del paciente con PIN de 6 dígitos | Pública |
| POST | `/patients` | Crear nuevo paciente | JWT Terapeuta |
| GET | `/patients` | Listar pacientes (paginado, con búsqueda) | JWT Terapeuta |
| GET | `/patients/:id` | Obtener paciente por ID | JWT Terapeuta |
| PATCH | `/patients/:id` | Actualizar datos del paciente | JWT Terapeuta |
| DELETE | `/patients/:id` | Archivar paciente (soft delete) | JWT Terapeuta |
| GET | `/patients/:id/routines` | Listar rutinas de un paciente | JWT Terapeuta |
| POST | `/patients/:id/access-code` | Generar PIN de acceso móvil | JWT Terapeuta |
| DELETE | `/patients/:id/access-code` | Revocar PIN de acceso móvil | JWT Terapeuta |
| GET | `/patients/:id/access-code/status` | Verificar si el paciente tiene PIN activo | JWT Terapeuta |
| POST | `/routines` | Crear rutina con ejercicios | JWT Terapeuta |
| GET | `/routines` | Listar rutinas (paginado) | JWT Terapeuta |
| GET | `/routines/:id` | Obtener rutina por ID | JWT Terapeuta |
| PUT | `/routines/:id` | Actualizar rutina (reemplaza items) | JWT Terapeuta |
| DELETE | `/routines/:id` | Eliminar o archivar rutina | JWT Terapeuta |
| POST | `/routines/:id/clone` | Clonar una rutina existente | JWT Terapeuta |
| GET | `/exercises` | Listar ejercicios del catálogo | JWT Terapeuta |
| POST | `/exercises` | Crear ejercicio en el catálogo | JWT Terapeuta |
| GET | `/exercises/:id` | Obtener ejercicio por ID | JWT Terapeuta |
| PATCH | `/exercises/:id` | Actualizar ejercicio | JWT Terapeuta |
| DELETE | `/exercises/:id` | Eliminar ejercicio | JWT Terapeuta |
| GET | `/routines/:id/stats` | KPIs y datos de gráfica de una rutina | JWT Terapeuta |
| GET | `/routines/:id/history` | Historial de sesiones de una rutina | JWT Terapeuta |
| GET | `/dashboard/stats` | KPIs del dashboard del terapeuta | JWT Terapeuta |
| GET | `/mobile/routine/active` | Rutina activa del paciente (payload completo) | JWT Paciente |
| POST | `/sessions` | Registrar sesión completada (sincronización móvil) | JWT Paciente |

---

## 3. Módulos de la API

### 3.1 Autenticación — Terapeuta

Gestiona el acceso de terapeutas a la plataforma web. Los tokens emitidos tienen acceso completo al panel de administración.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login con email y contraseña |
| GET | `/auth/profile` | Perfil del terapeuta autenticado |

---

#### POST /auth/login

**Descripción:** Autentica a un terapeuta con su correo electrónico y contraseña. Retorna un token JWT que debe incluirse en las solicitudes subsiguientes.  
**Autenticación:** Pública  
**Etiqueta:** Auth

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | string (email) | Sí | Correo electrónico del terapeuta |
| `password` | string | Sí | Contraseña de la cuenta |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna `{ accessToken: string }` |
| 401 | Credenciales inválidas |

**Ejemplo de Request:**
```json
{
  "email": "dra.lopez@clinica-neuro.mx",
  "password": "MiContraseña123"
}
```

**Ejemplo de Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjOGE3..."
}
```

---

#### GET /auth/profile

**Descripción:** Retorna la información del perfil del terapeuta autenticado, incluyendo su rol y clínica asignada.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Auth

**Parámetros:** Ninguno (el usuario se determina a partir del token JWT).

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna el objeto del perfil del terapeuta |
| 401 | Token inválido o ausente |
| 404 | Usuario no encontrado |

**Ejemplo de Response:**
```json
{
  "id": "c8a7f3b2-1d4e-4a9c-8f21-0e5d6b3a7c91",
  "email": "dra.lopez@clinica-neuro.mx",
  "firstName": "Valentina",
  "lastName": "López",
  "role": "THERAPIST",
  "clinicId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

### 3.2 Autenticación — Paciente (Móvil)

Gestiona el acceso de pacientes a la aplicación móvil. El flujo no utiliza contraseñas: el terapeuta genera un PIN de 6 dígitos que el paciente ingresa en la app.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/patient/login` | Login con PIN de 6 dígitos |

---

#### POST /auth/patient/login

**Descripción:** Autentica a un paciente usando un código de acceso (PIN) de 6 dígitos generado previamente por su terapeuta. Retorna un JWT de larga duración específico para el acceso móvil, junto con los datos básicos del paciente.  
**Autenticación:** Pública  
**Etiqueta:** Mobile Auth

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `accessCode` | string | Sí | PIN de exactamente 6 dígitos numéricos generado por el terapeuta |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna `{ accessToken, patient }` |
| 401 | PIN inválido, expirado o revocado |

**Ejemplo de Request:**
```json
{
  "accessCode": "482916"
}
```

**Ejemplo de Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYxZTJkM2M0...",
  "patient": {
    "id": "f1e2d3c4-b5a6-7890-cdef-012345678901",
    "firstName": "Carlos",
    "lastName": "Mendoza"
  }
}
```

---

### 3.3 Pacientes

Gestión completa del catálogo de pacientes de un terapeuta, incluyendo el ciclo de vida del PIN de acceso móvil. Todos los endpoints de este módulo requieren JWT de Terapeuta y operan en el contexto del usuario autenticado (un terapeuta solo accede a sus propios pacientes).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/patients` | Crear nuevo paciente |
| GET | `/patients` | Listar pacientes (paginado, con búsqueda) |
| GET | `/patients/:id` | Obtener paciente por ID |
| PATCH | `/patients/:id` | Actualizar datos del paciente |
| DELETE | `/patients/:id` | Archivar paciente (soft delete) |
| GET | `/patients/:id/routines` | Listar rutinas del paciente |
| POST | `/patients/:id/access-code` | Generar PIN de acceso móvil |
| DELETE | `/patients/:id/access-code` | Revocar PIN de acceso móvil |
| GET | `/patients/:id/access-code/status` | Verificar si el paciente tiene PIN activo |

---

#### POST /patients

**Descripción:** Registra un nuevo paciente vinculado al terapeuta autenticado. Los campos `firstName`, `lastName`, `email` y `dateOfBirth` son obligatorios; el resto son opcionales.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `firstName` | string | Sí | Nombre del paciente |
| `lastName` | string | Sí | Apellido del paciente |
| `email` | string (email) | Sí | Correo electrónico del paciente |
| `dateOfBirth` | string (YYYY-MM-DD) | Sí | Fecha de nacimiento |
| `gender` | string | No | Género: `MALE`, `FEMALE`, `OTHER` |
| `phoneNumber` | string | No | Número de teléfono |
| `diagnosis` | string | No | Diagnóstico clínico (ej. "Parálisis de Bell grado IV") |
| `initialParalysisDegree` | integer (1–6) | No | Grado de parálisis según escala House-Brackmann |
| `clinicalNotes` | string | No | Notas clínicas adicionales del terapeuta |
| `emergencyContactName` | string | No | Nombre del contacto de emergencia |
| `emergencyContactPhone` | string | No | Teléfono del contacto de emergencia |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 201 | Éxito — retorna el objeto `PatientResponse` creado |
| 400 | Datos inválidos o faltantes |
| 401 | Token inválido o ausente |

**Ejemplo de Request:**
```json
{
  "firstName": "Carlos",
  "lastName": "Mendoza",
  "email": "carlos.mendoza@email.com",
  "dateOfBirth": "1985-06-15",
  "gender": "MALE",
  "phoneNumber": "+52 55 1234 5678",
  "diagnosis": "Parálisis facial periférica grado III (House-Brackmann)",
  "initialParalysisDegree": 3,
  "clinicalNotes": "Paciente refiere inicio súbito hace 2 semanas. Sin antecedentes previos.",
  "emergencyContactName": "María Mendoza",
  "emergencyContactPhone": "+52 55 8765 4321"
}
```

**Ejemplo de Response:**
```json
{
  "id": "f1e2d3c4-b5a6-7890-cdef-012345678901",
  "therapistId": "c8a7f3b2-1d4e-4a9c-8f21-0e5d6b3a7c91",
  "firstName": "Carlos",
  "lastName": "Mendoza",
  "email": "carlos.mendoza@email.com",
  "dateOfBirth": "1985-06-15",
  "gender": "MALE",
  "phoneNumber": "+52 55 1234 5678",
  "status": "ACTIVE",
  "diagnosis": "Parálisis facial periférica grado III (House-Brackmann)",
  "initialParalysisDegree": 3,
  "clinicalNotes": "Paciente refiere inicio súbito hace 2 semanas. Sin antecedentes previos.",
  "emergencyContactName": "María Mendoza",
  "emergencyContactPhone": "+52 55 8765 4321",
  "avatarUrl": null,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z"
}
```

---

#### GET /patients

**Descripción:** Retorna la lista paginada de pacientes del terapeuta autenticado. Soporta búsqueda por nombre o correo. El máximo de resultados por página es 100.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients

**Parámetros de Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `search` | string | No | Filtro de búsqueda por nombre o correo |
| `page` | integer | No | Número de página (por defecto: 1) |
| `limit` | integer | No | Resultados por página (máximo: 100, por defecto: 20) |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna objeto paginado con lista de pacientes |
| 401 | Token inválido o ausente |

**Ejemplo de Request:**
```
GET /patients?search=Carlos&page=1&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Ejemplo de Response:**
```json
{
  "data": [
    {
      "id": "f1e2d3c4-b5a6-7890-cdef-012345678901",
      "therapistId": "c8a7f3b2-1d4e-4a9c-8f21-0e5d6b3a7c91",
      "firstName": "Carlos",
      "lastName": "Mendoza",
      "email": "carlos.mendoza@email.com",
      "dateOfBirth": "1985-06-15",
      "gender": "MALE",
      "status": "ACTIVE",
      "diagnosis": "Parálisis facial periférica grado III",
      "initialParalysisDegree": 3,
      "avatarUrl": null,
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

#### GET /patients/:id

**Descripción:** Retorna los datos completos de un paciente específico. Solo accesible si el paciente pertenece al terapeuta autenticado.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del paciente |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna el objeto `PatientResponse` |
| 401 | Token inválido o ausente |
| 404 | Paciente no encontrado |

**Ejemplo de Response:**
```json
{
  "id": "f1e2d3c4-b5a6-7890-cdef-012345678901",
  "therapistId": "c8a7f3b2-1d4e-4a9c-8f21-0e5d6b3a7c91",
  "firstName": "Carlos",
  "lastName": "Mendoza",
  "email": "carlos.mendoza@email.com",
  "dateOfBirth": "1985-06-15",
  "gender": "MALE",
  "phoneNumber": "+52 55 1234 5678",
  "status": "ACTIVE",
  "diagnosis": "Parálisis facial periférica grado III (House-Brackmann)",
  "initialParalysisDegree": 3,
  "clinicalNotes": "Paciente refiere inicio súbito hace 2 semanas. Sin antecedentes previos.",
  "emergencyContactName": "María Mendoza",
  "emergencyContactPhone": "+52 55 8765 4321",
  "avatarUrl": null,
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-20T14:22:00.000Z"
}
```

---

#### PATCH /patients/:id

**Descripción:** Actualiza parcialmente los datos de un paciente. Todos los campos son opcionales. Adicionalmente permite cambiar el estado del paciente mediante el campo `status`.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del paciente |

**Request Body** (todos los campos son opcionales):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `firstName` | string | Nombre del paciente |
| `lastName` | string | Apellido del paciente |
| `email` | string (email) | Correo electrónico |
| `dateOfBirth` | string (YYYY-MM-DD) | Fecha de nacimiento |
| `gender` | string | `MALE`, `FEMALE`, `OTHER` |
| `phoneNumber` | string | Número de teléfono |
| `status` | string | `ACTIVE`, `INACTIVE`, `ARCHIVED` |
| `diagnosis` | string | Diagnóstico clínico |
| `initialParalysisDegree` | integer (1–6) | Grado House-Brackmann |
| `clinicalNotes` | string | Notas clínicas |
| `emergencyContactName` | string | Nombre del contacto de emergencia |
| `emergencyContactPhone` | string | Teléfono del contacto de emergencia |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna el objeto `PatientResponse` actualizado |
| 400 | Datos inválidos |
| 401 | Token inválido o ausente |
| 404 | Paciente no encontrado |

**Ejemplo de Request:**
```json
{
  "clinicalNotes": "Mejora notable en la simetría facial tras 4 semanas de tratamiento.",
  "status": "ACTIVE"
}
```

**Ejemplo de Response:**
```json
{
  "id": "f1e2d3c4-b5a6-7890-cdef-012345678901",
  "therapistId": "c8a7f3b2-1d4e-4a9c-8f21-0e5d6b3a7c91",
  "firstName": "Carlos",
  "lastName": "Mendoza",
  "status": "ACTIVE",
  "clinicalNotes": "Mejora notable en la simetría facial tras 4 semanas de tratamiento.",
  "updatedAt": "2026-02-10T09:15:00.000Z"
}
```

---

#### DELETE /patients/:id

**Descripción:** Realiza un borrado lógico (soft delete) del paciente, cambiando su estado a `ARCHIVED`. Los datos del paciente se conservan en la base de datos.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del paciente |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 204 | Éxito — sin contenido en la respuesta |
| 401 | Token inválido o ausente |
| 404 | Paciente no encontrado |

---

#### GET /patients/:id/routines

**Descripción:** Retorna todas las rutinas asignadas a un paciente específico, incluyendo sus ítems de ejercicios.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients / Routines

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del paciente |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna array de objetos `RoutineResponse` |
| 401 | Token inválido o ausente |
| 404 | Paciente no encontrado |

**Ejemplo de Response:**
```json
[
  {
    "id": "a3b4c5d6-e7f8-9012-abcd-ef3456789012",
    "patientId": "f1e2d3c4-b5a6-7890-cdef-012345678901",
    "name": "Rutina de rehabilitación semana 3",
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-28T00:00:00.000Z",
    "status": "ACTIVE",
    "therapistNotes": "Enfocarse en ejercicios de cierre ocular.",
    "sessionsCount": 12,
    "createdAt": "2026-01-30T08:00:00.000Z",
    "updatedAt": "2026-02-10T14:00:00.000Z",
    "items": []
  }
]
```

---

#### POST /patients/:id/access-code

**Descripción:** Genera un nuevo código de acceso (PIN) de 6 dígitos para que el paciente pueda iniciar sesión en la aplicación móvil. Si ya existía un PIN previo, este es reemplazado. El código solo se muestra una vez en esta respuesta.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del paciente |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 201 | Éxito — retorna el PIN generado (solo se muestra una vez) |
| 401 | Token inválido o ausente |
| 404 | Paciente no encontrado |

**Ejemplo de Response:**
```json
{
  "accessCode": "482916",
  "patientId": "f1e2d3c4-b5a6-7890-cdef-012345678901"
}
```

---

#### DELETE /patients/:id/access-code

**Descripción:** Revoca el código de acceso móvil del paciente. Después de esta operación, el paciente no podrá iniciar sesión en la aplicación móvil hasta que se genere un nuevo PIN.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del paciente |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 204 | Éxito — código revocado, sin contenido en la respuesta |
| 401 | Token inválido o ausente |
| 404 | Paciente no encontrado |

---

#### GET /patients/:id/access-code/status

**Descripción:** Consulta si el paciente tiene actualmente un PIN de acceso móvil activo, sin revelar el valor del PIN.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Patients

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del paciente |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna `{ hasAccessCode: boolean }` |
| 401 | Token inválido o ausente |
| 404 | Paciente no encontrado |

**Ejemplo de Response:**
```json
{
  "hasAccessCode": true
}
```

---

### 3.4 Rutinas

Gestión de rutinas de rehabilitación. Cada rutina está compuesta por uno o más ítems (ejercicios configurados con parámetros específicos: series, repeticiones, tiempo de sostenimiento, etc.). El servicio aplica un guard de ciclo de vida que puede restringir actualizaciones según el estado de la rutina.

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/routines` | Crear rutina con ejercicios |
| GET | `/routines` | Listar rutinas (paginado) |
| GET | `/routines/:id` | Obtener rutina por ID |
| PUT | `/routines/:id` | Actualizar rutina (reemplaza los ítems) |
| DELETE | `/routines/:id` | Eliminar o archivar rutina |
| POST | `/routines/:id/clone` | Clonar una rutina existente |

---

#### POST /routines

**Descripción:** Crea una nueva rutina de rehabilitación con sus ejercicios configurados. Los ítems de la rutina se crean junto con la rutina en una sola transacción. El campo `patientId` vincula la rutina al paciente destinatario.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Routines

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `patientId` | string (UUID) | Sí | ID del paciente al que se asigna la rutina |
| `name` | string | Sí | Nombre descriptivo de la rutina |
| `startDate` | string (ISO 8601) | Sí | Fecha de inicio de la rutina |
| `endDate` | string (ISO 8601) | No | Fecha de fin de la rutina (opcional) |
| `therapistNotes` | string | No | Notas del terapeuta sobre la rutina |
| `items` | array | Sí | Lista de ejercicios configurados (mínimo 1) |
| `items[].exerciseId` | string (UUID) | Sí | ID del ejercicio del catálogo |
| `items[].sets` | integer (≥1) | Sí | Número de series |
| `items[].repsPerSet` | integer (≥1) | Sí | Repeticiones por serie |
| `items[].targetHoldSeconds` | integer (≥0) | Sí | Tiempo de sostenimiento en segundos (0 para isotónicos) |
| `items[].restBetweenSets` | integer (≥0) | No | Tiempo de descanso entre series en segundos (por defecto: 10) |
| `items[].difficultyLevel` | number | No | Multiplicador de dificultad (por defecto: 1.0) |
| `items[].strictMode` | boolean | No | Modo estricto activo (por defecto: false) |
| `items[].allowSkip` | boolean | No | Permitir saltar el ejercicio (por defecto: true) |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 201 | Éxito — retorna el objeto `RoutineResponse` con sus ítems |
| 400 | Datos inválidos o faltantes |
| 401 | Token inválido o ausente |
| 404 | Paciente o ejercicio no encontrado |

**Ejemplo de Request:**
```json
{
  "patientId": "f1e2d3c4-b5a6-7890-cdef-012345678901",
  "name": "Rutina de rehabilitación — Semana 4",
  "startDate": "2026-02-15T00:00:00.000Z",
  "endDate": "2026-03-15T00:00:00.000Z",
  "therapistNotes": "Incrementar la dificultad si el paciente reporta facilidad después de 5 días.",
  "items": [
    {
      "exerciseId": "e1d2c3b4-a5f6-7890-bcde-f01234567890",
      "sets": 3,
      "repsPerSet": 10,
      "targetHoldSeconds": 0,
      "restBetweenSets": 15,
      "difficultyLevel": 1.0,
      "strictMode": false,
      "allowSkip": true
    },
    {
      "exerciseId": "b9c8d7e6-f5a4-3210-9876-543210fedcba",
      "sets": 3,
      "repsPerSet": 8,
      "targetHoldSeconds": 5,
      "restBetweenSets": 20,
      "difficultyLevel": 1.2,
      "strictMode": true,
      "allowSkip": false
    }
  ]
}
```

**Ejemplo de Response:**
```json
{
  "id": "a3b4c5d6-e7f8-9012-abcd-ef3456789012",
  "patientId": "f1e2d3c4-b5a6-7890-cdef-012345678901",
  "name": "Rutina de rehabilitación — Semana 4",
  "startDate": "2026-02-15T00:00:00.000Z",
  "endDate": "2026-03-15T00:00:00.000Z",
  "status": "ACTIVE",
  "therapistNotes": "Incrementar la dificultad si el paciente reporta facilidad después de 5 días.",
  "sessionsCount": 0,
  "createdAt": "2026-02-14T16:00:00.000Z",
  "updatedAt": "2026-02-14T16:00:00.000Z",
  "items": [
    {
      "id": "11223344-5566-7788-99aa-bbccddeeff00",
      "routineId": "a3b4c5d6-e7f8-9012-abcd-ef3456789012",
      "exerciseId": "e1d2c3b4-a5f6-7890-bcde-f01234567890",
      "orderIndex": 0,
      "sets": 3,
      "repsPerSet": 10,
      "targetHoldSeconds": 0,
      "restBetweenSets": 15,
      "difficultyLevel": 1.0,
      "strictMode": false,
      "allowSkip": true,
      "exercise": {
        "id": "e1d2c3b4-a5f6-7890-bcde-f01234567890",
        "keyName": "smile_isotonic",
        "name": "Sonrisa Isotónica",
        "type": "ISOTONIC",
        "category": "CORE",
        "mobileModule": "SMILE"
      }
    }
  ]
}
```

---

#### GET /routines

**Descripción:** Retorna la lista paginada de todas las rutinas creadas por el terapeuta autenticado.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Routines

**Parámetros de Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | integer | No | Número de página (por defecto: 1) |
| `limit` | integer | No | Resultados por página (máximo: 100, por defecto: 20) |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna objeto paginado con lista de rutinas |
| 401 | Token inválido o ausente |

**Ejemplo de Response:**
```json
{
  "data": [
    {
      "id": "a3b4c5d6-e7f8-9012-abcd-ef3456789012",
      "patientId": "f1e2d3c4-b5a6-7890-cdef-012345678901",
      "name": "Rutina de rehabilitación — Semana 4",
      "startDate": "2026-02-15T00:00:00.000Z",
      "endDate": "2026-03-15T00:00:00.000Z",
      "status": "ACTIVE",
      "sessionsCount": 7,
      "createdAt": "2026-02-14T16:00:00.000Z",
      "updatedAt": "2026-02-20T10:00:00.000Z",
      "items": []
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

#### GET /routines/:id

**Descripción:** Retorna los datos completos de una rutina por su ID, incluyendo todos los ítems con la información del ejercicio asociado a cada uno.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Routines

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único de la rutina |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna el objeto `RoutineResponse` completo con ítems |
| 401 | Token inválido o ausente |
| 404 | Rutina no encontrada |

---

#### PUT /routines/:id

**Descripción:** Actualiza una rutina de forma completa. Si se proporciona el array `items`, los ítems existentes son reemplazados en su totalidad. El servicio aplica un guard de ciclo de vida que puede impedir modificaciones en rutinas con estado `COMPLETED` o `ARCHIVED`.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Routines

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único de la rutina |

**Request Body** (todos los campos son opcionales):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nuevo nombre de la rutina |
| `startDate` | string (ISO 8601) | Nueva fecha de inicio |
| `endDate` | string (ISO 8601) | Nueva fecha de fin |
| `therapistNotes` | string | Notas actualizadas del terapeuta |
| `items` | array | Lista completa de ítems (reemplaza los existentes) |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna la rutina actualizada |
| 400 | Datos inválidos o la rutina no puede modificarse en su estado actual |
| 401 | Token inválido o ausente |
| 404 | Rutina no encontrada |

**Ejemplo de Request:**
```json
{
  "name": "Rutina de rehabilitación — Semana 5 (actualizada)",
  "therapistNotes": "Se incrementó la dificultad en ejercicios de sonrisa."
}
```

---

#### DELETE /routines/:id

**Descripción:** Elimina o archiva una rutina. Si la rutina tiene sesiones registradas se realiza un borrado lógico (archivado); de lo contrario se elimina de forma permanente.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Routines

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único de la rutina |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 204 | Éxito — sin contenido en la respuesta |
| 401 | Token inválido o ausente |
| 404 | Rutina no encontrada |

---

#### POST /routines/:id/clone

**Descripción:** Crea una copia exacta de una rutina existente (incluyendo todos sus ítems de ejercicios), con estado `DRAFT` y sin sesiones asociadas. Útil para crear variantes de rutinas que han funcionado bien.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Routines

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único de la rutina a clonar |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 201 | Éxito — retorna el objeto `RoutineResponse` de la nueva copia |
| 401 | Token inválido o ausente |
| 404 | Rutina original no encontrada |

**Ejemplo de Response:**
```json
{
  "id": "z9y8x7w6-v5u4-3210-tsrq-ponmlkjihgfe",
  "patientId": "f1e2d3c4-b5a6-7890-cdef-012345678901",
  "name": "Rutina de rehabilitación — Semana 4 (copia)",
  "startDate": "2026-02-15T00:00:00.000Z",
  "endDate": null,
  "status": "DRAFT",
  "therapistNotes": "Incrementar la dificultad si el paciente reporta facilidad después de 5 días.",
  "sessionsCount": 0,
  "createdAt": "2026-03-01T09:00:00.000Z",
  "updatedAt": "2026-03-01T09:00:00.000Z",
  "items": []
}
```

---

### 3.5 Ejercicios

Gestión del catálogo de ejercicios de rehabilitación facial. Los ejercicios son recursos compartidos (no vinculados a un terapeuta específico) y sirven como plantillas para armar ítems dentro de las rutinas.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/exercises` | Listar ejercicios del catálogo |
| POST | `/exercises` | Crear nuevo ejercicio |
| GET | `/exercises/:id` | Obtener ejercicio por ID |
| PATCH | `/exercises/:id` | Actualizar ejercicio |
| DELETE | `/exercises/:id` | Eliminar ejercicio |

---

#### GET /exercises

**Descripción:** Retorna la lista paginada del catálogo de ejercicios disponibles. Soporta búsqueda por nombre o clave.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Exercises

**Parámetros de Query:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `search` | string | No | Filtro de búsqueda por nombre o `keyName` |
| `page` | integer | No | Número de página (por defecto: 1) |
| `limit` | integer | No | Resultados por página (máximo: 100, por defecto: 20) |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna objeto paginado con lista de ejercicios |
| 401 | Token inválido o ausente |

**Ejemplo de Response:**
```json
{
  "data": [
    {
      "id": "e1d2c3b4-a5f6-7890-bcde-f01234567890",
      "keyName": "smile_isotonic",
      "name": "Sonrisa Isotónica",
      "description": "Ejercicio de elevación comisural con movimiento dinámico.",
      "type": "ISOTONIC",
      "category": "CORE",
      "mobileModule": "SMILE",
      "assetAnimationUrl": "https://cdn.symma.app/animations/smile_isotonic.gif",
      "assetTutorialVideoUrl": "https://cdn.symma.app/videos/smile_isotonic.mp4",
      "defaultConfig": {
        "threshold": 0.75,
        "holdTime": 0,
        "restTime": 10
      },
      "createdAt": "2025-11-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

#### POST /exercises

**Descripción:** Agrega un nuevo ejercicio al catálogo del sistema. El campo `keyName` debe ser único. Si el tipo de ejercicio es `ISOTONIC` o `ISOMETRIC`, se puede asociar un módulo móvil (`mobileModule`) para determinar la estrategia de detección de movimiento en la app.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Exercises

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `keyName` | string | Sí | Clave única del ejercicio (ej. `"brow_raise_isometric"`) |
| `name` | string | Sí | Nombre descriptivo del ejercicio |
| `description` | string | No | Descripción detallada del ejercicio |
| `type` | string | Sí | Tipo: `ISOTONIC`, `ISOMETRIC`, `MANUAL`, `RELAXATION` |
| `category` | string | Sí | Categoría: `WARMUP`, `CORE`, `COOLDOWN` |
| `mobileModule` | string | No | Módulo móvil: `EYES`, `EYES_INVERSE`, `BROWS`, `JAW`, `SMILE`, `KISS` (solo para tipos `ISOTONIC` e `ISOMETRIC`) |
| `assetAnimationUrl` | string (URL) | No | URL de la animación ilustrativa del ejercicio |
| `assetTutorialVideoUrl` | string (URL) | No | URL del video tutorial del ejercicio |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 201 | Éxito — retorna el objeto `ExerciseResponse` creado |
| 400 | Datos inválidos o `keyName` duplicado |
| 401 | Token inválido o ausente |

**Ejemplo de Request:**
```json
{
  "keyName": "brow_raise_isometric",
  "name": "Elevación de Cejas Isométrica",
  "description": "Ejercicio de contracción sostenida del músculo frontal para rehabilitación de parálisis superior.",
  "type": "ISOMETRIC",
  "category": "CORE",
  "mobileModule": "BROWS",
  "assetAnimationUrl": "https://cdn.symma.app/animations/brow_raise.gif",
  "assetTutorialVideoUrl": "https://cdn.symma.app/videos/brow_raise_tutorial.mp4"
}
```

**Ejemplo de Response:**
```json
{
  "id": "b9c8d7e6-f5a4-3210-9876-543210fedcba",
  "keyName": "brow_raise_isometric",
  "name": "Elevación de Cejas Isométrica",
  "description": "Ejercicio de contracción sostenida del músculo frontal para rehabilitación de parálisis superior.",
  "type": "ISOMETRIC",
  "category": "CORE",
  "mobileModule": "BROWS",
  "assetAnimationUrl": "https://cdn.symma.app/animations/brow_raise.gif",
  "assetTutorialVideoUrl": "https://cdn.symma.app/videos/brow_raise_tutorial.mp4",
  "defaultConfig": null,
  "createdAt": "2026-03-01T10:00:00.000Z"
}
```

---

#### GET /exercises/:id

**Descripción:** Retorna los datos completos de un ejercicio del catálogo por su ID.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Exercises

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del ejercicio |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna el objeto `ExerciseResponse` |
| 401 | Token inválido o ausente |
| 404 | Ejercicio no encontrado |

---

#### PATCH /exercises/:id

**Descripción:** Actualiza parcialmente los datos de un ejercicio del catálogo. Todos los campos son opcionales.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Exercises

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del ejercicio |

**Request Body** (todos los campos son opcionales):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `keyName` | string | Nueva clave única del ejercicio |
| `name` | string | Nuevo nombre |
| `description` | string | Nueva descripción |
| `type` | string | `ISOTONIC`, `ISOMETRIC`, `MANUAL`, `RELAXATION` |
| `category` | string | `WARMUP`, `CORE`, `COOLDOWN` |
| `mobileModule` | string | `EYES`, `EYES_INVERSE`, `BROWS`, `JAW`, `SMILE`, `KISS` |
| `assetAnimationUrl` | string (URL) | URL de la animación |
| `assetTutorialVideoUrl` | string (URL) | URL del video tutorial |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna el objeto `ExerciseResponse` actualizado |
| 400 | Datos inválidos |
| 401 | Token inválido o ausente |
| 404 | Ejercicio no encontrado |

---

#### DELETE /exercises/:id

**Descripción:** Elimina un ejercicio del catálogo. Esta operación puede fallar si el ejercicio está referenciado por rutinas activas.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Exercises

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único del ejercicio |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 204 | Éxito — sin contenido en la respuesta |
| 401 | Token inválido o ausente |
| 404 | Ejercicio no encontrado |

---

### 3.6 Analíticas

Endpoints para consultar estadísticas de progreso y el historial de sesiones de una rutina. Los datos son calculados en tiempo real a partir de las sesiones registradas.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/routines/:id/stats` | KPIs y datos de gráfica de una rutina |
| GET | `/routines/:id/history` | Historial de sesiones de una rutina |

---

#### GET /routines/:id/stats

**Descripción:** Retorna los KPIs agregados de una rutina: total de sesiones completadas, racha actual de días consecutivos y puntuación promedio. Incluye el arreglo `chartData` con la evolución de puntajes por fecha, listo para renderizar en una gráfica de líneas.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Analytics

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único de la rutina |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna `{ summary, chartData }` |
| 401 | Token inválido o ausente |
| 404 | Rutina no encontrada |

**Ejemplo de Response:**
```json
{
  "summary": {
    "totalSessions": 18,
    "currentStreak": 5,
    "avgScore": 74
  },
  "chartData": [
    { "date": "2026-02-01", "score": 58 },
    { "date": "2026-02-03", "score": 63 },
    { "date": "2026-02-05", "score": 70 },
    { "date": "2026-02-07", "score": 68 },
    { "date": "2026-02-09", "score": 81 },
    { "date": "2026-02-10", "score": 85 }
  ]
}
```

> **Nota:** Los valores de `score` son porcentajes enteros (0–100). Un puntaje de `74` equivale al 74% de eficacia.

---

#### GET /routines/:id/history

**Descripción:** Retorna el historial de las últimas 20 sesiones de una rutina, ordenadas de más reciente a más antigua. Cada sesión incluye el detalle de los ejercicios ejecutados con sus métricas individuales.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Analytics

**Parámetros de Ruta:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string (UUID) | Identificador único de la rutina |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna array de hasta 20 sesiones con sus ítems |
| 401 | Token inválido o ausente |
| 404 | Rutina no encontrada |

**Ejemplo de Response:**
```json
[
  {
    "id": "sess-uuid-001",
    "date": "2026-02-10T18:30:00.000Z",
    "durationSeconds": 720,
    "score": 85,
    "isSynced": true,
    "items": [
      {
        "exerciseId": "e1d2c3b4-a5f6-7890-bcde-f01234567890",
        "exerciseName": "Sonrisa Isotónica",
        "repsCompleted": 10,
        "averageAccuracy": 87.5
      },
      {
        "exerciseId": "b9c8d7e6-f5a4-3210-9876-543210fedcba",
        "exerciseName": "Elevación de Cejas Isométrica",
        "repsCompleted": 8,
        "averageAccuracy": 82.0
      }
    ]
  }
]
```

---

### 3.7 Dashboard

Proporciona los indicadores de rendimiento clave (KPIs) consolidados del terapeuta para visualización en el panel principal de la aplicación web.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard/stats` | KPIs del dashboard del terapeuta |

---

#### GET /dashboard/stats

**Descripción:** Retorna los KPIs principales del dashboard: número de pacientes activos, alertas de cumplimiento y eficacia promedio. Cada métrica incluye su valor actual y la tendencia respecto al período anterior (variación porcentual). También retorna la lista de pacientes en riesgo por inactividad.  
**Autenticación:** Bearer JWT (Terapeuta)  
**Etiqueta:** Dashboard

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna `{ metrics, atRiskPatients }` |
| 401 | Token inválido o ausente |

**Ejemplo de Response:**
```json
{
  "metrics": {
    "activePatients": {
      "value": 14,
      "trend": 8
    },
    "complianceAlerts": {
      "value": 3,
      "trend": -25
    },
    "avgEfficacy": {
      "value": 71,
      "trend": 5
    }
  },
  "atRiskPatients": [
    {
      "id": "f1e2d3c4-b5a6-7890-cdef-012345678901",
      "name": "Carlos Mendoza",
      "daysInactive": 8,
      "avatarUrl": null
    },
    {
      "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
      "name": "Ana García",
      "daysInactive": 12,
      "avatarUrl": null
    }
  ]
}
```

> **Nota:** El campo `trend` representa la variación porcentual respecto al período anterior. Un valor de `0` indica que no hay datos de tendencia disponibles. Valores negativos en `complianceAlerts` indican mejora (menos alertas).

---

### 3.8 Móvil

Endpoints diseñados exclusivamente para la aplicación móvil del paciente. Requieren **JWT de Paciente** (emitido por `POST /auth/patient/login`). El payload de respuesta es completo para permitir el funcionamiento en modo sin conexión (offline-first).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/mobile/routine/active` | Obtener la rutina activa del paciente |

---

#### GET /mobile/routine/active

**Descripción:** Retorna la rutina activa asignada al paciente autenticado, con todos los datos necesarios para ejecutar la sesión de ejercicios en modo offline. La respuesta incluye la configuración completa de cada ítem y los metadatos del ejercicio (módulo móvil, URLs de assets). Retorna `null` si el paciente no tiene ninguna rutina activa.  
**Autenticación:** Bearer JWT (Paciente)  
**Etiqueta:** Mobile Features

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 200 | Éxito — retorna el objeto `ActiveRoutineResponse` o `null` si no hay rutina activa |
| 401 | Token inválido o ausente (JWT de Paciente requerido) |

**Ejemplo de Response:**
```json
{
  "id": "a3b4c5d6-e7f8-9012-abcd-ef3456789012",
  "name": "Rutina de rehabilitación — Semana 4",
  "startDate": "2026-02-15T00:00:00.000Z",
  "endDate": "2026-03-15T00:00:00.000Z",
  "status": "ACTIVE",
  "items": [
    {
      "id": "11223344-5566-7788-99aa-bbccddeeff00",
      "orderIndex": 0,
      "sets": 3,
      "repsPerSet": 10,
      "targetHoldSeconds": 0,
      "restBetweenSets": 15,
      "difficultyLevel": 1.0,
      "strictMode": false,
      "exercise": {
        "id": "e1d2c3b4-a5f6-7890-bcde-f01234567890",
        "name": "Sonrisa Isotónica",
        "keyName": "smile_isotonic",
        "description": "Ejercicio de elevación comisural con movimiento dinámico.",
        "type": "ISOTONIC",
        "category": "CORE",
        "mobileModule": "SMILE",
        "assetAnimationUrl": "https://cdn.symma.app/animations/smile_isotonic.gif",
        "assetTutorialVideoUrl": "https://cdn.symma.app/videos/smile_isotonic.mp4"
      }
    },
    {
      "id": "aabbccdd-eeff-0011-2233-445566778899",
      "orderIndex": 1,
      "sets": 3,
      "repsPerSet": 8,
      "targetHoldSeconds": 5,
      "restBetweenSets": 20,
      "difficultyLevel": 1.2,
      "strictMode": true,
      "exercise": {
        "id": "b9c8d7e6-f5a4-3210-9876-543210fedcba",
        "name": "Elevación de Cejas Isométrica",
        "keyName": "brow_raise_isometric",
        "description": "Ejercicio de contracción sostenida del músculo frontal.",
        "type": "ISOMETRIC",
        "category": "CORE",
        "mobileModule": "BROWS",
        "assetAnimationUrl": "https://cdn.symma.app/animations/brow_raise.gif",
        "assetTutorialVideoUrl": null
      }
    }
  ]
}
```

---

### 3.9 Sesiones

Registro de sesiones de ejercicio completadas por el paciente. Este endpoint es utilizado por la aplicación móvil para sincronizar los resultados de ejercicio con el servidor, ya sea en tiempo real o en modo de sincronización diferida (cuando el dispositivo recupera conectividad).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/sessions` | Registrar sesión completada |

---

#### POST /sessions

**Descripción:** Registra en el servidor el resultado de una sesión de ejercicios completada por el paciente. Calcula automáticamente la duración (a partir de `startTime` y `endTime`), el puntaje general de la sesión y lo vincula a la rutina especificada. Los campos `isSynced` y `syncedAt` son de uso local en la app móvil y no deben enviarse en este payload.  
**Autenticación:** Bearer JWT (Paciente)  
**Etiqueta:** Sessions

**Request Body:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `routineId` | string (UUID) | Sí | ID de la rutina a la que pertenece esta sesión |
| `startTime` | string (ISO 8601 UTC) | Sí | Timestamp de inicio de la sesión (con sufijo `Z`) |
| `endTime` | string (ISO 8601 UTC) | Sí | Timestamp de finalización de la sesión (con sufijo `Z`) |
| `items` | array | Sí | Lista de resultados por ejercicio (mínimo 1) |
| `items[].exerciseId` | string (UUID) | Sí | ID del ejercicio ejecutado |
| `items[].repsCompleted` | integer (≥0) | Sí | Número de repeticiones completadas |
| `items[].difficulty` | integer | No | Nivel de dificultad reportado (por defecto: 0) |
| `items[].averageAccuracy` | number (0–100) | No | Precisión promedio en porcentaje (puntuación de simetría facial) |
| `items[].seriesData` | any | No | Datos detallados por repetición en formato JSON (para análisis avanzado) |

**Respuestas:**

| Código | Descripción |
|--------|-------------|
| 201 | Éxito — retorna el objeto `SessionResponse` con el puntaje calculado |
| 400 | Datos inválidos o rutina no activa |
| 401 | Token inválido o ausente (JWT de Paciente requerido) |
| 404 | Rutina o ejercicio no encontrado |

**Ejemplo de Request:**
```json
{
  "routineId": "a3b4c5d6-e7f8-9012-abcd-ef3456789012",
  "startTime": "2026-02-10T18:18:00.000Z",
  "endTime": "2026-02-10T18:30:00.000Z",
  "items": [
    {
      "exerciseId": "e1d2c3b4-a5f6-7890-bcde-f01234567890",
      "repsCompleted": 10,
      "difficulty": 1,
      "averageAccuracy": 87.5,
      "seriesData": [
        { "rep": 1, "accuracy": 0.82 },
        { "rep": 2, "accuracy": 0.90 },
        { "rep": 3, "accuracy": 0.88 }
      ]
    },
    {
      "exerciseId": "b9c8d7e6-f5a4-3210-9876-543210fedcba",
      "repsCompleted": 8,
      "difficulty": 1,
      "averageAccuracy": 82.0
    }
  ]
}
```

**Ejemplo de Response:**
```json
{
  "id": "sess-uuid-001",
  "routineId": "a3b4c5d6-e7f8-9012-abcd-ef3456789012",
  "date": "2026-02-10T18:18:00.000Z",
  "durationSeconds": 720,
  "score": 85,
  "createdAt": "2026-02-10T18:30:05.000Z",
  "items": [
    {
      "id": "item-sess-uuid-001",
      "sessionId": "sess-uuid-001",
      "exerciseId": "e1d2c3b4-a5f6-7890-bcde-f01234567890",
      "repsCompleted": 10,
      "difficulty": 1,
      "averageAccuracy": 87.5,
      "seriesData": null
    },
    {
      "id": "item-sess-uuid-002",
      "sessionId": "sess-uuid-001",
      "exerciseId": "b9c8d7e6-f5a4-3210-9876-543210fedcba",
      "repsCompleted": 8,
      "difficulty": 1,
      "averageAccuracy": 82.0,
      "seriesData": null
    }
  ]
}
```

---

## 4. Modelos de Datos Compartidos

### RoutineStatus

| Valor | Descripción |
|-------|-------------|
| `DRAFT` | Rutina en borrador, no asignada al paciente |
| `ACTIVE` | Rutina en curso, accesible desde la app móvil |
| `COMPLETED` | Rutina finalizada (fecha de fin alcanzada) |
| `ARCHIVED` | Rutina archivada (borrado lógico) |

### PatientStatus

| Valor | Descripción |
|-------|-------------|
| `ACTIVE` | Paciente activo en tratamiento |
| `INACTIVE` | Paciente inactivo temporalmente |
| `ARCHIVED` | Paciente archivado (borrado lógico) |

### ExerciseType

| Valor | Descripción |
|-------|-------------|
| `ISOTONIC` | Movimiento dinámico (contracción con desplazamiento) |
| `ISOMETRIC` | Contracción estática sostenida sin desplazamiento |
| `MANUAL` | Ejercicio guiado manualmente por el terapeuta |
| `RELAXATION` | Ejercicio de relajación muscular |

### ExerciseCategory

| Valor | Descripción |
|-------|-------------|
| `WARMUP` | Calentamiento previo a la sesión principal |
| `CORE` | Ejercicio principal de rehabilitación |
| `COOLDOWN` | Enfriamiento posterior a la sesión |

### MobileModule

Define el módulo de visión por computadora que se activa en la app móvil para detectar el movimiento facial correspondiente al ejercicio.

| Valor | Zona Facial |
|-------|-------------|
| `SMILE` | Comisuras labiales (sonrisa) |
| `KISS` | Labios (beso) |
| `JAW` | Mandíbula |
| `BROWS` | Cejas (elevación) |
| `EYES` | Ojos (cierre) |
| `EYES_INVERSE` | Ojos (apertura forzada) |

### Gender

| Valor | Descripción |
|-------|-------------|
| `MALE` | Masculino |
| `FEMALE` | Femenino |
| `OTHER` | Otro / No especificado |

---

## 5. Códigos de Error Comunes

| Código HTTP | Nombre | Cuándo ocurre |
|-------------|--------|----------------|
| 400 | Bad Request | El cuerpo de la solicitud contiene datos inválidos, faltantes o con formato incorrecto. Los errores de validación retornan un array con los campos afectados. |
| 401 | Unauthorized | No se proporcionó el token JWT, el token es inválido, ha expirado, o se usó un token de Paciente en un endpoint de Terapeuta (o viceversa). |
| 403 | Forbidden | El usuario autenticado no tiene permisos para acceder al recurso solicitado (p. ej., un terapeuta intentando acceder a pacientes de otro terapeuta). |
| 404 | Not Found | El recurso solicitado no existe en la base de datos (paciente, rutina, ejercicio, etc.). |
| 409 | Conflict | Se intentó crear un recurso con un campo único duplicado (p. ej., `keyName` en ejercicios o correo electrónico ya registrado). |
| 422 | Unprocessable Entity | La solicitud tiene formato válido pero no puede procesarse según las reglas de negocio (p. ej., modificar una rutina `ARCHIVED`). |
| 500 | Internal Server Error | Error inesperado del servidor. Si ocurre de forma persistente, debe reportarse al equipo de desarrollo. |

### Formato de Error

Todos los errores siguen una estructura consistente:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password should not be empty"
  ],
  "error": "Bad Request"
}
```

Para errores de negocio con un solo mensaje:

```json
{
  "statusCode": 404,
  "message": "Routine with ID a3b4c5d6-e7f8-9012-abcd-ef3456789012 not found",
  "error": "Not Found"
}
```

---

## 6. Notas de Implementación

### Paginación

Los endpoints que retornan listas paginadas (`GET /patients`, `GET /routines`, `GET /exercises`) utilizan el siguiente esquema de respuesta:

```json
{
  "data": [ ... ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### Seguridad Multi-Tenant

La API implementa aislamiento por terapeuta: cada recurso (paciente, rutina, ejercicio de rutina) está vinculado al `therapistId` del JWT. Las consultas filtran automáticamente por el usuario autenticado, por lo que un terapeuta nunca puede acceder a datos de otro terapeuta, aunque conozca el ID del recurso.

### Sincronización Offline (App Móvil)

La aplicación móvil está diseñada con arquitectura offline-first:

1. Al iniciar sesión, `GET /mobile/routine/active` descarga el payload completo de la rutina.
2. El paciente ejecuta las sesiones sin necesidad de conexión.
3. Al recuperar conectividad, la app llama a `POST /sessions` para sincronizar los resultados.
4. Los campos `isSynced` y `syncedAt` son exclusivamente locales de la app SQLite y no forman parte del contrato de API.

### Escala House-Brackmann

El campo `initialParalysisDegree` sigue la **Escala de House-Brackmann** para cuantificar el grado de parálisis facial:

| Grado | Descripción Clínica |
|-------|---------------------|
| 1 | Función normal |
| 2 | Disfunción leve |
| 3 | Disfunción moderada |
| 4 | Disfunción moderada-severa |
| 5 | Disfunción severa |
| 6 | Parálisis total |
