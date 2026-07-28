/**
 * V1 schema — initial database structure.
 *
 * Dexie handles this migration automatically via version(1).stores()
 * in database.ts. This file documents the V1 schema contract and
 * serves as the base for future migration scripts.
 *
 * Schema: resume-schema-v1
 *
 * Tables:
 *   resumes   — keyed by id, indexed on updatedAt, title
 *   settings  — keyed by id (singleton: 'global')
 *   images    — keyed by id, indexed on resumeId
 *   templates — keyed by id, indexed on category
 *
 * Future migrations must:
 *   1. Add a new version(N).stores({...}).upgrade() block in database.ts
 *   2. Add a vN.migration.ts documenting the change
 *   3. Never remove required fields from existing records
 *   4. Provide defaults for all new required fields
 */

export const V1_SCHEMA_VERSION = 1 as const

export const V1_TABLES = {
  resumes: 'id, updatedAt, title',
  settings: 'id',
  images: 'id, resumeId',
  templates: 'id, category',
} as const
