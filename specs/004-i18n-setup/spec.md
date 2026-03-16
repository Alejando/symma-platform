# Feature Specification: Internationalization (i18n) Setup

**Feature Branch**: `004-i18n-setup`  
**Created**: 2026-03-03  
**Status**: Draft  
**Input**: User description: "Implementar Internacionalización en todas las aplicaciones con prioridad al español, compartiendo traducciones entre apps. Sin selector de idioma por ahora, solo español. Mostrar traducciones de enums en la vista conservando valores originales en BD."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualización de Interfaz en Español (Priority: P1)

Como usuario hispanohablante, quiero ver toda la interfaz de usuario (web y móvil) en español para poder utilizar la plataforma en mi idioma nativo sin barreras de comprensión.

**Why this priority**: Es el objetivo principal de la feature. Sin esto, no hay valor entregado. El español es el idioma prioritario para los usuarios objetivo de Symma.

**Independent Test**: Navegar por cualquier pantalla de la aplicación web o móvil y verificar que todos los textos visibles (etiquetas, botones, mensajes, títulos) aparecen en español.

**Acceptance Scenarios**:

1. **Given** un usuario accede a la aplicación web, **When** visualiza cualquier página, **Then** todos los textos de la interfaz (menús, botones, etiquetas, mensajes) se muestran en español.
2. **Given** un usuario abre la aplicación móvil, **When** navega por las diferentes pantallas, **Then** todos los textos de la interfaz se muestran en español.
3. **Given** un usuario realiza una acción que genera un mensaje de éxito o error, **When** el sistema muestra el mensaje, **Then** el mensaje aparece en español.

---

### User Story 2 - Visualización de Enums Traducidos (Priority: P1)

Como usuario, quiero ver los valores de enumeraciones (estados, tipos, categorías) traducidos al español en la interfaz, mientras el sistema mantiene los valores técnicos originales internamente.

**Why this priority**: Los enums son parte fundamental de la información mostrada al usuario. Mostrar "PENDING" en lugar de "Pendiente" rompe la experiencia en español.

**Independent Test**: Visualizar cualquier campo que muestre un enum (ej: estado de paciente, tipo de sesión) y verificar que aparece la traducción en español.

**Acceptance Scenarios**:

1. **Given** un registro tiene un campo enum con valor "ACTIVE", **When** el usuario visualiza ese registro en la interfaz, **Then** ve "Activo" en lugar de "ACTIVE".
2. **Given** un usuario envía un formulario con un campo enum, **When** el sistema guarda el dato, **Then** almacena el valor original del enum (ej: "PENDING") en la base de datos.
3. **Given** la API retorna datos con enums, **When** la aplicación web/móvil los muestra, **Then** presenta la traducción correspondiente al español.

---

### User Story 3 - Traducciones Compartidas entre Aplicaciones (Priority: P2)

Como desarrollador, quiero que las traducciones estén centralizadas en un paquete compartido para mantener consistencia entre web, API y móvil, y evitar duplicación de esfuerzo.

**Why this priority**: Reduce mantenimiento y garantiza consistencia. Es infraestructura que habilita escalabilidad futura.

**Independent Test**: Modificar una traducción en el paquete compartido y verificar que el cambio se refleja en todas las aplicaciones que la consumen.

**Acceptance Scenarios**:

1. **Given** una traducción existe en el paquete compartido, **When** la aplicación web necesita mostrar ese texto, **Then** obtiene la traducción del paquete compartido.
2. **Given** una traducción existe en el paquete compartido, **When** la aplicación móvil necesita mostrar ese texto, **Then** obtiene la traducción del paquete compartido.
3. **Given** se actualiza una traducción en el paquete compartido, **When** se reconstruyen las aplicaciones, **Then** todas reflejan la traducción actualizada.

---

### User Story 4 - Preparación para Multi-idioma Futuro (Priority: P3)

Como equipo de desarrollo, queremos que la arquitectura de i18n permita agregar nuevos idiomas en el futuro sin refactorización significativa.

**Why this priority**: No es necesario para el MVP pero evita deuda técnica. La arquitectura correcta ahora facilita expansión futura.

**Independent Test**: Agregar un archivo de traducciones para un nuevo idioma (ej: inglés) y verificar que la estructura lo soporta sin cambios en el código de las aplicaciones.

**Acceptance Scenarios**:

1. **Given** la arquitectura de i18n está implementada, **When** un desarrollador agrega un nuevo archivo de idioma, **Then** el sistema puede cargar las traducciones sin modificar código existente.
2. **Given** existe un mecanismo de fallback, **When** una traducción no existe en el idioma seleccionado, **Then** el sistema muestra la traducción del idioma por defecto (español).

---

### Edge Cases

- ¿Qué sucede cuando una clave de traducción no existe? El sistema debe mostrar la clave como fallback y registrar un warning en desarrollo.
- ¿Cómo se manejan textos con variables/interpolación (ej: "Bienvenido, {nombre}")? El sistema debe soportar placeholders en las traducciones.
- ¿Qué pasa con textos muy largos que no caben en el espacio de UI? Las traducciones deben considerar la longitud y el diseño debe ser flexible.
- ¿Cómo se manejan plurales (ej: "1 paciente" vs "5 pacientes")? El sistema debe soportar reglas de pluralización.
- ¿Qué sucede si la app móvil no tiene conexión y necesita traducciones? Las traducciones deben estar embebidas en el bundle de la app.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar toda la interfaz de usuario en español por defecto.
- **FR-002**: El sistema DEBE proporcionar traducciones para todos los valores de enums utilizados en la interfaz.
- **FR-003**: El sistema DEBE mantener los valores originales de enums en la base de datos (sin traducir).
- **FR-004**: El sistema DEBE centralizar las traducciones en un paquete compartido accesible por web, API y móvil.
- **FR-005**: El sistema DEBE soportar interpolación de variables en las traducciones (ej: "Hola, {nombre}").
- **FR-006**: El sistema DEBE soportar reglas de pluralización en español.
- **FR-007**: El sistema DEBE proporcionar un mecanismo de fallback cuando una traducción no existe.
- **FR-008**: El sistema DEBE permitir agregar nuevos idiomas sin modificar código de las aplicaciones.
- **FR-009**: La aplicación móvil DEBE incluir las traducciones en el bundle para funcionar offline.
- **FR-010**: El sistema DEBE registrar warnings en modo desarrollo cuando se detecten claves de traducción faltantes.

### Key Entities

- **Translation**: Representa un texto traducido. Contiene: clave única, valor traducido, idioma, namespace/contexto opcional.
- **Locale**: Representa un idioma soportado. Contiene: código de idioma (ej: "es", "en"), nombre del idioma, estado activo.
- **EnumTranslation**: Mapeo entre valores de enum y sus traducciones. Contiene: nombre del enum, valor original, traducción por idioma.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de los textos visibles en la interfaz web están en español.
- **SC-002**: 100% de los textos visibles en la interfaz móvil están en español.
- **SC-003**: 100% de los valores de enums mostrados en la interfaz tienen traducción al español.
- **SC-004**: 0 valores de enum en inglés visibles para el usuario final.
- **SC-005**: Las traducciones compartidas se utilizan en al menos 2 aplicaciones (web y móvil).
- **SC-006**: Agregar un nuevo idioma requiere solo agregar archivos de traducción, sin cambios en código de aplicaciones.
- **SC-007**: El tiempo de carga de la aplicación no aumenta más de 100ms por la carga de traducciones.

## Assumptions

- El idioma español (es) será el único idioma activo en esta fase.
- No se implementará selector de idioma en la UI; el idioma será fijo.
- Los enums existentes en el sistema son conocidos y finitos.
- Las traducciones de enums se mantendrán sincronizadas manualmente con los valores definidos en el schema de Prisma.
- La aplicación móvil puede incluir traducciones como recursos estáticos en el APK.

## Out of Scope

- Selector de idioma en la interfaz de usuario.
- Detección automática de idioma del navegador/dispositivo.
- Traducciones a idiomas distintos del español.
- Traducciones de contenido generado por usuarios (notas, comentarios).
- Panel de administración para gestionar traducciones.
- Integración con servicios de traducción externos.
