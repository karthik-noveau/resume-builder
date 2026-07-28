# Document 3

# Resume Data Schema Specification (RDSS)

This is one of the most important documents.

The Resume Data Schema becomes the single source of truth for:

* Editor
* Templates
* IndexedDB
* Autosave
* PDF Export
* Future migrations
* Undo / Redo

AI agents must never invent additional fields outside this schema.

---

# 1. Schema Versioning

```text
Current Version: 1

Schema ID:
resume-schema-v1
```

All resumes must contain:

```typescript
schemaVersion: 1
```

Future versions must use migration scripts.

---

# 1a. Date Format

All date string fields (`createdAt`, `updatedAt`, `startDate`, `endDate`, `issueDate`, `lastExportedAt`, `lastOpenedAt`) must use:

```text
ISO 8601

Example:
2024-01-15T10:30:00.000Z
```

User-facing date fields (`startDate`, `endDate`) may store partial dates:

```text
2024-01
2024
Present
```

System date fields (`createdAt`, `updatedAt`) must always be full ISO 8601.

---

# 2. Root Resume Object

```typescript
Resume
```

Required fields:

```typescript
{
  id: string
  schemaVersion: number

  title: string

  createdAt: string
  updatedAt: string

  templateId: string
  themeId: string
  fontPresetId: string

  personalInfo: PersonalInfo

  summary: SummarySection

  experience: ExperienceSection[]

  education: EducationSection[]

  skills: SkillSection[]

  projects: ProjectSection[]

  certifications: CertificationSection[]

  customSections: CustomSection[]

  settings: ResumeSettings
}
```

---

# 3. Base Section Contract

Every section must inherit:

```typescript
{
  id: string

  type: SectionType

  visible: boolean

  order: number

  createdAt: string

  updatedAt: string
}
```

`type` must be a discriminated union literal — never a plain `string`:

```typescript
type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'custom'
```

Each section's `type` value is fixed and must match the section kind exactly. The `type` field is used to identify sections during template rendering and undo/redo reconstruction.

This applies to:

```text
Summary

Experience

Education

Skills

Projects

Certifications

Custom Sections
```

---

# 4. Personal Information

```typescript
PersonalInfo
```

```typescript
{
  fullName: string

  headline: string

  email: string

  phone: string

  location: string

  website: string

  linkedin: string

  github: string

  portfolio: string

  profileImage?: string
}
```

---

Validation

```text
Email must be valid.

LinkedIn URL optional.

GitHub URL optional.

Profile image optional.
```

---

# 5. Summary Section

```typescript
SummarySection
```

```typescript
{
  id: string

  visible: boolean

  content: string
}
```

---

Maximum:

```text
3000 characters
```

---

# 6. Experience Section

```typescript
ExperienceSection
```

```typescript
{
  id: string

  visible: boolean

  company: string

  role: string

  location: string

  startDate: string

  endDate: string

  current: boolean

  description: string[]

  technologies: string[]
}
```

---

Validation

```text
Company required

Role required

Start date required

Description optional

Technologies optional
```

---

# 7. Education Section

```typescript
EducationSection
```

```typescript
{
  id: string

  visible: boolean

  institution: string

  degree: string

  fieldOfStudy: string

  location: string

  startDate: string

  endDate: string

  grade: string

  description: string[]
}
```

---

# 8. Skills Section

```typescript
SkillSection
```

```typescript
{
  id: string

  visible: boolean

  category: string

  skills: Skill[]
}
```

---

Skill

```typescript
{
  id: string

  name: string

  level?: number
}
```

---

Level Range

```text
1 - 5
```

Optional.

ATS templates may ignore levels.

---

# 9. Projects Section

```typescript
ProjectSection
```

```typescript
{
  id: string

  visible: boolean

  title: string

  description: string

  technologies: string[]

  url: string

  github: string

  startDate: string

  endDate: string
}
```

---

# 10. Certifications Section

```typescript
CertificationSection
```

```typescript
{
  id: string

  visible: boolean

  title: string

  issuer: string

  issueDate: string

  credentialId: string

  credentialUrl: string
}
```

---

# 11. Generic List Item

Used by:

```text
Awards

Languages

Interests

Achievements

Volunteer Work

Publications
```

---

```typescript
GenericListItem
```

```typescript
{
  id: string

  title: string

  subtitle: string

  description: string

  startDate?: string

  endDate?: string

  url?: string
}
```

---

# 12. Custom Section

```typescript
CustomSection
```

```typescript
{
  id: string

  visible: boolean

  title: string

  items: GenericListItem[]
}
```

---

# 13. Resume Settings

```typescript
ResumeSettings
```

```typescript
{
  pageSize: "A4" | "LETTER"

  margins: MarginSettings

  showProfileImage: boolean

  showSectionIcons: boolean
}
```

---

# 14. Margin Settings

```typescript
{
  top: number

  right: number

  bottom: number

  left: number
}
```

Unit:

```text
millimeters
```

---

# 15. Theme Reference

Resume stores only:

```typescript
themeId: string
```

Never store theme definitions inside resume.

---

# 16. Template Reference

Resume stores only:

```typescript
templateId: string
```

Template definitions remain separate.

---

# 17. Font Preset Reference

```typescript
fontPresetId: string
```

---

# 18. Resume Metadata

```typescript
ResumeMetadata
```

```typescript
{
  wordCount: number

  pageCount: number

  lastExportedAt?: string

  lastOpenedAt?: string
}
```

Generated automatically.

Never manually edited.

---

# 19. Validation Rules

Required

```text
Full Name

Email

At least one Experience
OR

At least one Education
```

---

Resume can be exported only when:

```text
Validation Status = PASS
```

---

# 20. Migration Rules

Future schema updates require:

```typescript
Migration
```

```typescript
{
  fromVersion: number

  toVersion: number

  migrate()
}
```

---

No breaking changes allowed.

Old resumes must always open.

---

# 21. IndexedDB Mapping

```text
resumes
```

Stores:

```typescript
Resume
```

---

```text
templates
```

Stores:

```typescript
TemplateDefinition
```

---

```text
settings
```

Stores:

```typescript
AppSettings
```

---

```text
images
```

Stores:

```typescript
ImageAsset
```

`ImageAsset` definition:

```typescript
{
  id: string

  resumeId: string

  mimeType: 'image/png' | 'image/jpeg' | 'image/webp'

  data: Uint8Array

  width: number

  height: number

  sizeBytes: number

  createdAt: string
}
```

---

# 21a. Profile Image Storage Flow

Upload → Process → Store → Reference

```text
Step 1: User selects file (PNG / JPEG / WEBP)

Step 2: Validate file size < 2MB

Step 3: Resize to max 400 × 400px using Canvas API

Step 4: Compress to JPEG quality 85

Step 5: Convert to Uint8Array

Step 6: Store as ImageAsset in IndexedDB images table

Step 7: Set personalInfo.profileImage = imageAsset.id

Step 8: On render, read ImageAsset by id and convert to data URL
```

Never store raw base64 strings in the Resume object.

Never store image data directly inside the Resume object.

Resume stores only the `id` reference.

---

# 21b. ResumeListItem

Used by the Dashboard to display resume cards without loading full Resume objects.

```typescript
interface ResumeListItem {
  id: string
  title: string
  templateId: string
  themeId: string
  updatedAt: string
  createdAt: string
  pageCount: number
}
```

`pageCount` is computed by the storage layer at save time. Default `1`.

---

# 21c. ResumeSnapshot

Used by the undo/redo stack. A snapshot is a complete deep clone of the active Resume at a point in time.

```typescript
type ResumeSnapshot = Readonly<Resume>
```

Snapshots are stored in memory only (never in IndexedDB).

Each snapshot is created by `structuredClone(activeResume)` before every mutating action.

---

# 21d. AppSettings

Singleton record stored in the IndexedDB `settings` table.

```typescript
interface AppSettings {
  id: 'global'
  themeId: string
  fontPresetId: string
  pageSize: 'A4' | 'LETTER'
  language: string
  createdAt: string
  updatedAt: string
}
```

`id` is always the literal string `'global'`. Only one row exists.

Default values on first launch:

```text
themeId: 'light'
fontPresetId: 'professional'
pageSize: 'A4'
language: 'en'
```

---

# 21e. Utility Types

Define once in `src/shared/types/utils.types.ts`. Never redefine elsewhere.

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

type NonEmptyArray<T> = [T, ...T[]]

type Nullable<T> = T | null

type ID = string
```

---

# 22. Acceptance Criteria

PASS

```text
Resume loads from storage.

Resume saves.

Template switches.

Export works.

Autosave works.

Migration works.
```

FAIL

```text
Data loss.

Schema mismatch.

Broken migrations.

Missing required fields.
```