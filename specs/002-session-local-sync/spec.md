# Feature Specification: Session Local Persistence and Sync

**Feature Branch**: `002-session-local-sync`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Guardar la información de una sesión de rutina de manera local en Room y sincronizarla al servidor cuando haya conexión a internet"

## Context

When a patient completes a rehabilitation routine session on the mobile app, the session data (duration, exercises performed, reps, accuracy scores) must be reliably captured and eventually reach the clinical server so therapists can track patient progress. Currently, the app attempts to send session data directly to the server at the moment of completion — if there is no internet connection, the data is silently lost. This feature ensures that **no session data is ever lost**, regardless of connectivity at the time of completion.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Routine Without Internet (Priority: P1)

A patient completes their full rehabilitation routine while in a location with no internet connection (e.g., at home with mobile data off). When they finish, the app immediately shows the completion summary screen. Later, when the device reconnects to the internet, all session data is automatically uploaded to the server without any action required from the patient.

**Why this priority**: This is the core value of the feature. Without this, session data is permanently lost whenever connectivity is unavailable, making progress tracking unreliable for therapists.

**Independent Test**: Can be fully tested by completing a routine in airplane mode, verifying the summary screen appears normally, then re-enabling connectivity and verifying the session appears in the server's session history.

**Acceptance Scenarios**:

1. **Given** the device has no internet connection, **When** the patient completes a routine session, **Then** the session data is saved locally and the completion summary is shown immediately without error.
2. **Given** a session is saved locally with pending sync status, **When** the device regains internet connectivity, **Then** the session is automatically uploaded to the server within a reasonable time (under 60 seconds).
3. **Given** a session has been successfully uploaded to the server, **When** the sync completes, **Then** the local record is marked as synced and the upload is not retried.

---

### User Story 2 - Complete Routine With Internet (Priority: P2)

A patient completes their routine while connected to the internet. The app saves the session locally first, then immediately attempts to sync it to the server. The patient sees the completion summary without any delay.

**Why this priority**: This is the happy path and must work seamlessly. The local-first approach must not degrade the experience when connectivity is available.

**Independent Test**: Can be fully tested by completing a routine with active internet, verifying the summary screen appears, and confirming the session is visible in the server within seconds.

**Acceptance Scenarios**:

1. **Given** the device has internet connectivity, **When** the patient completes a routine session, **Then** the session is saved locally and an immediate sync attempt is made.
2. **Given** an immediate sync attempt succeeds, **When** the server confirms receipt, **Then** the local record is marked as synced.
3. **Given** an immediate sync attempt fails due to a server error, **When** the failure occurs, **Then** the session remains saved locally and will be retried later, and the patient still sees the success summary.

---

### User Story 3 - Pending Sessions Sync on App Reopen (Priority: P3)

A patient had no internet for several days and completed multiple routine sessions. When they open the app again with internet available, all pending sessions are uploaded in the background without requiring any interaction.

**Why this priority**: Ensures no historical data is lost across multiple offline sessions. Important for clinical accuracy over time.

**Independent Test**: Can be tested by completing 3 sessions in airplane mode, then re-enabling connectivity and opening the app, verifying all 3 sessions appear on the server.

**Acceptance Scenarios**:

1. **Given** multiple sessions are stored locally with pending sync status, **When** the app is opened with internet connectivity, **Then** all pending sessions are uploaded to the server.
2. **Given** a batch of pending sessions is being synced, **When** one upload fails, **Then** the remaining sessions continue to be processed and the failed one is retried later.

---

### Edge Cases

- What happens when the device loses connectivity mid-sync? The session must remain in pending state and be retried.
- What happens if the app is force-closed during a session? The in-progress session data should not be persisted as a completed session.
- What happens if the server rejects a session (e.g., validation error)? The session should be marked with an error state and not retried indefinitely to avoid infinite loops.
- What happens if local storage is full? The system should log the failure and notify the user that the session could not be saved.
- What happens if the same session is uploaded twice (e.g., due to a retry after a network timeout where the server already received it)? The server must handle idempotency; the mobile app should not duplicate records.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST persist completed session data to local device storage immediately upon routine completion, before any network operation is attempted.
- **FR-002**: Each locally stored session MUST carry a synchronization status flag indicating whether it has been successfully uploaded to the server.
- **FR-003**: The app MUST attempt to upload all pending (unsynced) sessions to the server whenever an internet connection is available.
- **FR-004**: The app MUST display the session completion summary to the patient immediately after saving locally, regardless of network availability or sync outcome.
- **FR-005**: The app MUST automatically retry failed sync attempts in the background without requiring user interaction, using a scheduled background task.
- **FR-006**: The app MUST mark a session as synced only after receiving a successful confirmation from the server.
- **FR-007**: The app MUST NOT upload a session that has already been successfully synced.
- **FR-008**: Each stored session MUST capture: routine identifier, start time, end time, total duration, and the list of exercises performed with their reps completed, difficulty level, and average accuracy score.
- **FR-009**: The background sync task MUST respect device battery and network constraints (e.g., only sync on unmetered networks or when charging, if configured).
- **FR-010**: The app MUST handle server-side rejection of a session (4xx errors) by marking the session with a permanent error state and stopping retries for that session.

### Key Entities

- **Session**: Represents one completed execution of a routine. Attributes: unique local identifier, routine identifier, start time, end time, duration in seconds, overall score, sync status (pending/synced/error), creation timestamp.
- **Session Item**: Represents the result of one exercise within a session. Attributes: session identifier, exercise identifier, repetitions completed, difficulty level, average accuracy score, detailed series data.
- **Sync Status**: An enumerated state for each session — `PENDING` (not yet uploaded), `SYNCED` (successfully uploaded), `ERROR` (permanently rejected by server).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of completed sessions are persisted locally — zero data loss occurs regardless of network state at the time of completion.
- **SC-002**: The session completion summary screen appears within 1 second of the patient finishing the last exercise, with no blocking wait for network operations.
- **SC-003**: All pending sessions are uploaded to the server within 60 seconds of the device regaining internet connectivity.
- **SC-004**: Sessions completed offline are visible in the therapist's dashboard within 5 minutes of the patient's device reconnecting to the internet.
- **SC-005**: Zero duplicate sessions appear on the server, even when the same session is retried after a network timeout.
- **SC-006**: The background sync mechanism does not noticeably impact device battery life during normal usage (sync completes in under 30 seconds per session).

## Assumptions

- The session data model on the server (Session + SessionItem) already exists and the API endpoint for creating sessions is available.
- The app already captures per-exercise results (reps completed, accuracy scores) during the player flow; this feature focuses on persisting and syncing that data, not on capturing it.
- Sessions are owned by a single patient and are associated with a specific routine; no multi-device conflict resolution is required.
- The background sync will use the platform's native background task scheduling mechanism with connectivity constraints.
- Locally stored sessions that have been synced do not need to be deleted immediately; they can be retained for a reasonable period (e.g., 30 days) for offline history display in a future feature.
