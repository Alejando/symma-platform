# RFC-000: [Título de la Funcionalidad]

| Estado | Draft / In Review / Approved / Implemented |
| :--- | :--- |
| **Autor** | [Nombre] |
| **Fecha** | [Fecha] |
| **Ticket** | [Link a Linear] |

## 1. Resumen
Un párrafo simple explicando qué vamos a construir. (Ej: Implementar un servicio en segundo plano para sincronizar sesiones cuando haya WiFi).

## 2. Motivación
¿Por qué hacemos esto? ¿Qué problema de negocio resuelve? (Ej: Los pacientes rurales no tienen datos móviles y necesitan guardar su progreso).

## 3. Diseño Técnico Propuesto

### 3.1 Arquitectura
(Diagramas o explicación de flujo).

### 3.2 Cambios en Base de Datos
(Si aplica, poner el esquema Prisma nuevo).

### 3.3 API Contracts
(Si aplica, qué endpoints nuevos se crearán).
POST /sync/sessions
{ ... }

### 3.4 Dependencias Nuevas
(¿Vamos a instalar una librería nueva? ¿Cuál? ¿Por qué esa y no otra?).

### 3.5 Consideraciones de Seguridad / Privacidad
(Crítico para Symma: ¿Cómo protegemos los datos del paciente aquí?).

## 4. Alternativas Descartadas
Explica qué otras opciones consideraste y por qué no las elegiste. (Ej: "Pensamos usar Firebase Sync, pero lo descartamos porque necesitamos control total de los datos por la ley LFPDPPP").

## 5. Plan de Trabajo (Tasks)
- [ ] Tarea 1
- [ ] Tarea 2