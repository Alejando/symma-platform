# Specification Quality Checklist: API Contracts — Single Source of Truth

**Purpose**: Validate specification completeness and quality before proceeding to planning  
**Created**: 2026-02-15  
**Last Validated**: 2026-02-15 (post-ambiguity review)  
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Ambiguity Review Log (2026-02-15)

10 ambiguities identified, all resolved:

### Fixed Directly (7)
1. **Package identity** — clarified as existing `@symma/shared-types` per Constitution Principle IV
2. **Wire format scope** — FR-002 now specifies camelCase is the JSON wire format, not a language-level convention
3. **ISO 8601 precision** — FR-005 now specifies UTC with `Z` suffix and `YYYY-MM-DD` for date-only fields
4. **US3 factual error** — corrected session history endpoint reference to `GET /routines/:id/history`
5. **`syncedAt` missing** — added per Constitution Principle II (requires both `isSynced` and `syncedAt`)
6. **FR-011/FR-012 tension** — clarified whitelist validation + strip unknown fields strategy
7. **Delete endpoints** — added to Domain Contract Map with `204 No Content` convention

### Resolved via User Clarification (3)
8. **Mobile contract consumption** → OpenAPI code generation (generate OpenAPI spec at build time → `openapi-generator` produces Kotlin data classes)
9. **Score format** → integer 0–100 (API converts from DB float 0–1; no breaking change for web)
10. **Pagination scope** → define contract AND implement on all list endpoints (patients, routines, exercises)

## Notes

- All items pass validation. Spec is ready for `/speckit.plan`.
- The spec references existing field names (e.g., `repsPerSet`, `targetHoldSeconds`) as examples of the naming standard — these are domain terms, not implementation details.
- FR-011 and FR-012 no longer reference specific libraries; they describe the validation strategy in technology-agnostic terms.
