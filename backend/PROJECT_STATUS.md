# Project Status: Docker Sandbox Execution System

## Overview
The Docker sandbox execution system replaces external/mock execution (e.g. Judge0 or direct host execution) with an isolated, multi-language Docker execution engine. It allows safe compilation and execution of candidate code inside transient Docker containers with strict hardware, network, and capability limits.

---

## Architecture

```
Frontend Monaco Workspace
    │
    ▼ (POST /api/v1/sandbox/execution/run)
FastAPI Backend (app.sandbox.router)
    │
    ├── Direct Sync Execution (Development / Low-Latency mode)
    │     └── app.sandbox.executor -> Docker Host Engine
    │
    └── Distributed Queue Mode (Production / Scalable mode)
          ├── Redis Queue (sandbox:jobs)
          ├── Worker (python -m app.sandbox.worker)
          │     └── Docker Host Engine (isolated containers)
          └── Redis Result Store (TTL-based result lookup)
```

---

## Security Model & Sandboxing

Every code execution is isolated within a dedicated Docker container configured with security hardening:

| Security Control | Implementation | Purpose |
|---|---|---|
| **Network Isolation** | `network_mode="none"` | Blocks all outbound and inbound socket connections (no internet or LAN access) |
| **Privilege Dropping** | `user="nobody"` | Drops root privileges inside the container |
| **Capability Drop** | `cap_drop=["ALL"]` | Removes all Linux kernel capabilities |
| **No New Privileges** | `security_opt=["no-new-privileges:true"]` | Prevents setuid binaries or privilege escalation |
| **Memory Limit** | `mem_limit="256m"`, `memswap_limit="256m"` | Hard 256MB RAM cap to prevent host memory exhaustion |
| **CPU Quota** | `cpu_period=100000`, `cpu_quota=100000` | Limits container to 1 CPU core |
| **Execution Timeout** | 10 seconds (SIGKILL on timeout) | Prevents infinite loops (`TIME_LIMIT_EXCEEDED`) |
| **Auto Cleanup** | Ephemeral volumes & container removal | Storage cleanup after each execution |
| **Server Whitelist** | Whitelisted in `languages.py` | Client input cannot customize images or system commands |
| **Information Hiding**| Response schemas hide `expected_output` | Protects test case evaluation data from candidate inspection |

---

## Supported Languages & Runtimes

All images and compilation/execution commands are strictly server-controlled:

| Language | Canonical Name | Aliases | Base Image | Compile Command | Execution Command |
|---|---|---|---|---|---|
| **Python** | `python` | `py`, `python3` | `python:3.12-slim` | None | `python3 solution.py` |
| **JavaScript** | `javascript` | `js`, `node`, `nodejs` | `node:20-slim` | None | `node solution.js` |
| **C++** | `cpp` | `c++`, `cxx` | `gcc:13` | `g++ -O2 -std=c++17 -o solution solution.cpp` | `./solution` |
| **Java** | `java` | `java17` | `eclipse-temurin:17-jdk-alpine` | `javac Solution.java` | `java Solution` |

---

## Verdict States

Every execution yields one of the standardized verdicts:

- `ACCEPTED`: Source compiled and executed successfully with return code 0 (and matched all provided test cases).
- `WRONG_ANSWER`: Test case output did not match expected output (normalized whitespace/line endings).
- `COMPILE_ERROR`: Non-zero exit code during compilation (e.g. `javac` or `g++` failure).
- `RUNTIME_ERROR`: Non-zero exit code or unhandled exception during program execution.
- `TIME_LIMIT_EXCEEDED`: Program exceeded execution timeout (10s) and was terminated.
- `INTERNAL_ERROR`: System-level fault (e.g. Docker daemon unreachable).

---

## API Endpoints

All endpoints are prefixed under `/api/v1/sandbox`:

- `GET /api/v1/sandbox/languages`: List all supported languages and their configuration specs.
- `POST /api/v1/sandbox/execution/run`: Execute code synchronously (or via worker if `async_mode=true`). Supports single stdin or batch `test_cases`.
- `GET /api/v1/sandbox/execution/jobs/{job_id}`: Poll asynchronous job execution status (`pending`, `done`, `failed`).

---

## Infrastructure & Docker Compose

- `docker-compose.yml`: Launches `redis` (port 6379), `sandbox-worker` (mounting `/var/run/docker.sock`), and optional backend container.
- `Dockerfile.sandbox-worker`: Lightweight Python 3.12 image packaging worker daemon.
- `Dockerfile.backend`: Production container for the FastAPI application.

---

## Frontend & Client Architecture

- `src/services/workspaceExecution.ts`: Client service interfacing with `/api/v1/sandbox/execution/run`.
- `src/components/MonacoWorkspace.tsx`: Dark-mode coding IDE component with language selection, stdin console, verdict badge, execution metrics, and error outputs.
- `src/App.tsx`: Assessment workspace and code execution routes.

---

## Test Verification

Run all test suites via pytest:

```bash
# Run unit tests (schemas, languages, test case harness)
python -m pytest tests/sandbox/test_schemas.py tests/sandbox/test_languages.py tests/sandbox/test_harness.py -v

# Run full integration test suite (requires Docker & Redis)
python -m pytest tests/sandbox -v

```

---

## Part 2: Assessment Access-Code System

### Overview
Every **published** `Assignment` (assessment) is assigned a randomly generated, globally unique 6-character access code (uppercase A–Z and digits 0–9). Interns enter this code on the **Enter Test** page to start an independent attempt (Submission).

### New Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Added `accessCode String? @unique` to `Assignment` model |
| `src/main.ts` | NestJS application bootstrap (port 3001) |
| `src/app.module.ts` | Root NestJS module |
| `src/prisma/prisma.service.ts` | Prisma client service |
| `src/prisma/prisma.module.ts` | Global Prisma module |
| `src/assessments/access-code.util.ts` | `generateAccessCode()` and `isValidAccessCode()` using `crypto.randomInt` |
| `src/assessments/assessments.service.ts` | Publish (idempotent), join (idempotent), lookup, collision retry |
| `src/assessments/assessments.controller.ts` | REST endpoints |
| `tests/assessments/assessments.test.js` | 25 automated tests (Node built-in runner) |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/assessments/:id/publish` | Authority (`X-User-Role` header) | Publish assignment, generate access code (idempotent) |
| `GET` | `/api/assessments/lookup/:code` | Any | Preview assessment info by code (no attempt created) |
| `POST` | `/api/assessments/join` | Intern (no Authority required) | Validate code and create/return submission attempt |
| `GET` | `/api/assessments/published` | Authority | List all published assessments with codes |

### Security Properties

| Rule | Enforcement |
|------|------------|
| Codes are 6 chars, A-Z0-9 only | `crypto.randomInt` + regex validation |
| Codes are globally unique | DB `@unique` constraint + collision-retry loop (10 attempts) |
| Case-insensitive entry | Input `.toUpperCase().trim()` before lookup |
| Draft assessments are inaccessible | Status check throws `BadRequestException` |
| Publishing is idempotent | Existing code preserved on re-publish |
| Multiple interns can share one code | Each creates an independent `Submission` |
| Duplicate join is idempotent | Existing active submission is returned, no duplicate created |
| Join does NOT require Authority role | `POST /join` only checks for valid JWT, not role |

### Test Results

```
node --test tests/assessments/assessments.test.js
```

```
▶ 1. generateAccessCode()
  ✔ returns exactly 6 characters
  ✔ only contains uppercase A-Z and 0-9
  ✔ generates at least 490 unique codes out of 500 calls
✔ 1. generateAccessCode() (8.126ms)
▶ 2. isValidAccessCode()
  ✔ accepts valid 6-char uppercase alphanumeric codes
  ✔ normalises lowercase to uppercase before validating
  ✔ rejects codes that are too short
  ✔ rejects codes that are too long
  ✔ rejects codes with invalid characters
  ✔ rejects non-string input
✔ 2. isValidAccessCode() (1.905ms)
▶ 3. AssessmentsService.publishAssignment()
  ✔ assigns an access code when publishing a DRAFT assignment
  ✔ preserves existing access code when re-publishing
  ✔ throws NotFoundException for non-existent assignment
✔ 3. AssessmentsService.publishAssignment() (4.876ms)
▶ 4. AssessmentsService.findPublishedByCode()
  ✔ returns assessment details for a valid published code
  ✔ is case-insensitive (lowercase input)
  ✔ throws BadRequestException for code that is too short
  ✔ throws BadRequestException for code that is too long
  ✔ throws BadRequestException for code with invalid characters
  ✔ throws NotFoundException for non-existent code
  ✔ throws BadRequestException for code belonging to a DRAFT assignment
✔ 4. AssessmentsService.findPublishedByCode() (2.002ms)
▶ 5. AssessmentsService.joinAssessment()
  ✔ creates a new submission for an intern with a valid code
  ✔ multiple different interns get independent submissions for the same code
  ✔ joining twice returns the same submission (no duplicates)
  ✔ throws BadRequestException when joining a DRAFT/unpublished assessment
  ✔ throws BadRequestException for invalid code format on join
  ✔ throws NotFoundException for a non-existent code on join
✔ 5. AssessmentsService.joinAssessment() (1.851ms)

tests 25 | pass 25 | fail 0 | duration_ms 186.79
```

---

## Supabase PostgreSQL & Access-Code Database Integration

### 1. Supabase PostgreSQL Connection
- **Datasource Configuration**: Prisma configured in `prisma.config.ts` and `schema.prisma`.
- **Connection Mode**: Shared transaction pooler via `DATABASE_URL` for application queries and session mode via `DIRECT_URL` for migrations.
- **Environment Management**: Secrets stored securely in `.env`.
- **Connection Status**: Verified and active via `@prisma/client` + `@prisma/adapter-pg` + `pg` Pool.

### 2. Prisma Migration Status
- **Migration**: `20260915000000_init` applied to live Supabase PostgreSQL database using `prisma migrate deploy`.
- **Database Schema**: 
  - `AssessmentAccessCode` (id UUID, assessment_id TEXT, code VARCHAR(6) UNIQUE, created_at TIMESTAMPTZ)
  - `WorkDescription` (id UUID, projectId TEXT, authorityId TEXT, description TEXT, createdAt TIMESTAMPTZ)
  - `Log` (id UUID, projectId TEXT, internId TEXT, content TEXT, fileUrl TEXT, uploadedAt TIMESTAMPTZ, descriptionId UUID)
  - `Review` (id UUID, logId UUID UNIQUE, score INT, feedback TEXT, createdAt TIMESTAMPTZ)
- **Integrity**: Unique constraint enforced on `AssessmentAccessCode(code)`.

### 3. Backend Access-Code System
- `POST /api/access-codes` & `POST /access-codes`: Idempotent code generation using uniform rejection sampling (A-Z, 0-9, 6 chars), collision retry up to 10 attempts, real database persistence.
- `POST /api/access-codes/validate` & `POST /access-codes/validate`: Case-insensitive normalization, length/regex validation, returns `{ assessmentId, code }`.
- **Publish Flow Integration**: Automatically generates and stores a unique access code on assessment/work-description creation if none exists, returning `accessCode` to the caller.

### 4. Frontend Integration
- **Enter Access Code Page**: `EnterAccessCode.tsx` mapped to `/enter-code` and `/access-code`.
- **Auto-Formatting**: Automatically uppercases lowercase letters and restricts to alphanumeric characters.
- **Error & Loading States**: Clear feedback on 400/404 errors, loading indicator during network validation.
- **Navigation**: Redirects authenticated intern to the assessment on successful code verification.
- **Authority UI**: Displays generated 6-character access code with copy button in `AuthorityDashboard.tsx`.

### 5. Executed Test Verification
- **Prisma Schema Validation**: Validated via `npx prisma validate`.
- **Prisma Client Generation**: Generated (v7.8.0) via `npx prisma generate`.
- **Live Supabase Integration Tests**: `test_database_integration.js` executed against the live Supabase PostgreSQL database:
  - `[Test 1] Connected to Supabase via Prisma`: Passed
  - `[Test 2] Created and read assessment records`: Passed
  - `[Test 3] Access-code records persisted in database`: Passed
  - `[Test 4] Generated codes remain persistent across queries`: Passed
  - `[Test 5] Idempotent generation returns identical code`: Passed
  - `[Test 6] Different assessments receive unique codes`: Passed
  - `[Test 7] Case-insensitive lowercase input validation`: Passed
  - `[Test 8] Invalid codes return 404/400 errors`: Passed
  - `[Test 9] Multiple interns can use same assessment code`: Passed
  - `[Test 10] Each intern receives independent attempt/logs`: Passed
  - `[Test 11] Duplicate validation is idempotent`: Passed
- **Frontend Build**: `npm run build` executed and passed (`tsc -b && vite build` built in 15.72s with 0 errors).

---

## Part 4: Test Submission, Anti-Cheating & Integrity Engine, Gemini Review, and Authority Decision System

### 1. Overview
The system provides a production-grade, end-to-end evaluation pipeline connecting the candidate's test experience directly to AI evaluation and Authority decision making, with server-side integrity and anti-cheating controls.

```
Candidate (Access Code Entry)
    │
    ▼
Assessment Pre-Flight & Fullscreen Lockdown (`AssessmentRoom.tsx`)
    │
    ├── Anti-Cheating Listeners (visibilitychange, window blur, prohibited shortcuts)
    │     ├── 3-Warning Limit for shortcuts (Alt+G, Win+G, F1–F12, etc.) -> Auto-Ban
    │     └── Immediate Ban on tab switch / window blur
    │
    ├── Monaco Editor + Debounced Autosave (1500ms)
    ├── Docker Sandbox Run / Test Cases Execution
    │
    ▼
Submission (`POST /api/attempts/:id/submit`)
    │
    ├── Permanent Attempt Lock (`status: SUBMITTED`)
    ├── Automated Gemini Review Pipeline (`reviewLog()`)
    │     └── Generates Score & Actionable Feedback stored in `Review`
    │
    ▼
Authority Evaluation Dashboard (`AuthorityDashboard.tsx`)
    │
    ├── Live Attempt Submissions Viewer (Code, Language, Duration, Status)
    ├── Gemini AI Review Card (Score & Feedback Breakdown)
    ├── Anti-Cheating Violations Audit Log (Timestamped violation events)
    └── Authority Decision Control (`APPROVED`, `REJECTED`, `REQUEST_RESUBMISSION`)
          └── Private Internal Notes (Hidden from candidate API responses)
```

### 2. Database Schema Additions (`prisma/schema.prisma`)
Applied migration `20260915100000_add_assessment_attempt` to live Supabase PostgreSQL:
- **`AssessmentAttempt`**:
  - `id`: UUID primary key
  - `assessmentId`: references `WorkDescription(id)`
  - `internId`: candidate identifier
  - `code`: persisted candidate solution
  - `language`: selected runtime language
  - `status`: `IN_PROGRESS` | `SUBMITTED` | `TERMINATED`
  - `warningCount`: integer counter (0 to 3)
  - `isBanned`: boolean ban flag
  - `banReason`: text explanation of termination reason
  - `bannedAt`: timestamp of termination
  - `submittedAt`: timestamp of submission lock
  - `authorityDecision`: `APPROVED` | `REJECTED` | `REQUEST_RESUBMISSION`
  - `authorityNotes`: private reviewer notes
  - `authorityDecidedAt`: timestamp of lead decision
- **`AttemptViolation`**:
  - `id`: UUID primary key
  - `attemptId`: references `AssessmentAttempt(id)` (CASCADE onDelete)
  - `type`: `TAB_SWITCH` | `PROHIBITED_SHORTCUT` | `FULLSCREEN_EXIT` | `COPY_PASTE_ATTEMPT`
  - `details`: context description (e.g. key combination, warning count)
  - `createdAt`: timestamp of violation
- **`Review` (Extended)**:
  - Added optional 1-to-1 relation `attempt AssessmentAttempt? @relation(fields: [attemptId], references: [id])`

### 3. Server-Side Security & Anti-Cheating Architecture
All security rules are strictly enforced server-side:
- **Session Isolation**: Candidates accessing the same 6-character access code receive isolated `AssessmentAttempt` records with independent code, warnings, and submission state.
- **Autosave**: Debounced updates to `POST /api/attempts/:id/autosave` persist code changes without overwriting submitted or terminated attempts.
- **Immediate Ban on Tab/Window Switch**: If `visibilitychange` (state `hidden`) or `window.blur` triggers, `POST /api/attempts/:id/terminate` immediately sets `status="TERMINATED"`, `isBanned=true`, records the violation in `AttemptViolation`, and permanently locks the session.
- **3-Warning Shortcut Limit**: Prohibited keys (`Alt+G`, `Win+G`, `Meta+G`, `F1–F12`, developer tools shortcuts) invoke `POST /api/attempts/:id/warning`. On the 3rd warning, the server transitions the attempt to `TERMINATED` and locks the intern out.
- **Immutable Submission**: Once `POST /api/attempts/:id/submit` is called, the attempt is locked as `SUBMITTED`. Any subsequent autosave, edit, warning, or submit calls are rejected.
- **Information Hiding**: Candidate-facing endpoints (`GET /api/attempts/:id`) sanitize and omit `authorityNotes` to protect internal evaluation deliberations.

### 4. Automated Gemini Review Integration
When an attempt is submitted:
1. The server reads the candidate code and assessment requirements.
2. The code is dispatched to the Gemini review pipeline (`reviewLog`).
3. The generated score and feedback are stored in a new `Review` record linked directly to `attemptId`.
4. Both candidate and Authority have access to review feedback upon completion.

### 5. Authority Decision Workflow
The Authority Lead can view all submitted and terminated candidate attempts via `GET /api/authority/submissions`:
- Inspect complete submitted source code with syntax highlighting.
- Inspect detailed anti-cheating audit trail showing exact violation timestamps and categories.
- Review Gemini AI scoring and feedback.
- Record final hiring/evaluation decisions (`APPROVED`, `REJECTED`, `REQUEST_RESUBMISSION`) with private internal notes (`POST /api/authority/submissions/:id/decision`).

### 6. Test Suite & Verification Results
- **Prisma Schema Migration**: Verified and deployed (`20260915100000_add_assessment_attempt`).
- **Prisma Client**: Re-generated with PostgreSQL adapter.
- **Automated Integration Test Suite (`test_submission_pipeline.js`)**:
  - `[Test 1] Fixtures initialized (WorkDescription + AccessCode)`: PASSED
  - `[Test 2] Session isolation between candidates on same assessment`: PASSED
  - `[Test 3] Autosave state persistence`: PASSED
  - `[Test 4] 3-Warning ban enforcement & violation audit logging`: PASSED
  - `[Test 5] Immediate termination on tab switch`: PASSED
  - `[Test 6] Submission lock & immutable status`: PASSED
  - `[Test 7] Review created & associated with Attempt`: PASSED
  - `[Test 8] Authority decision recording & candidate private notes privacy projection`: PASSED
  - **Result: 8/8 tests passed successfully against live Supabase PostgreSQL.**
---

## Part 5: Complete End-to-End System Integration & Production Readiness

### 1. Final E2E Test Suite Execution (`e2e_integration_test.js`)
A live end-to-end integration test exercising all 9 system phases over HTTP and Supabase PostgreSQL was executed with zero errors:

| Phase | Scenario Tested | Status |
|---|---|---|
| **Phase 1** | Assessment Creation (`POST /api/work-descriptions`) & 6-char A-Z/0-9 Access Code Generation | PASSED |
| **Phase 2** | Access Code Validation (`POST /api/access-codes/validate`) with lowercase case-insensitivity | PASSED |
| **Phase 3** | Multi-intern Session Isolation (Independent `AssessmentAttempt` records on same code) | PASSED |
| **Phase 4** | Debounced Autosave (`POST /api/attempts/:id/autosave`) with DB verification | PASSED |
| **Phase 5** | Anti-Cheating 3-Warning Shortcut Limit (`POST /api/attempts/:id/warning`) & Automatic Ban | PASSED |
| **Phase 6** | Anti-Cheating Immediate Ban on Tab Switch / Window Blur (`POST /api/attempts/:id/terminate`) | PASSED |
| **Phase 7** | Candidate Submission (`POST /api/attempts/:id/submit`), Lockout & Gemini Review Generation | PASSED |
| **Phase 8** | Authority Evaluation (`GET /api/authority/submissions`, `POST /decision`) with Private Notes | PASSED |
| **Phase 9** | Security & Privacy Projection (`GET /api/attempts/:id` strictly excludes `authorityNotes`) | PASSED |

### 2. Operational & Security Characteristics

- **Supabase PostgreSQL & Prisma**: Active connection via transaction-mode pooler (`DATABASE_URL`) and direct migration pooler (`DIRECT_URL`). Zero mock databases in active runtime.
- **Access Codes**: Uniform 6-character random alphanumeric generation (A-Z, 0-9), collision retry (up to 10 attempts), case-insensitive input parsing.
- **Anti-Cheating Controls**:
  - `document.visibilitychange` and `window.blur` trigger immediate termination and ban.
  - Prohibited keystrokes (`Alt+G`, `Win+G`, `Meta+G`, `F1-F12`, `Ctrl+Shift+I/J/C`, `Ctrl+U`) trigger warnings up to a hard cap of 3 before automatic ban.
  - Clipboard paste events into the code editor are blocked.
  - *Browser/OS Note*: Key combinations intercepted at the OS level by Windows/macOS before reaching the browser viewport (such as certain global Win+Key system commands) cannot be synthetically captured by clientside JavaScript; however, all events exposed to DOM `keydown` are strictly captured, rate-limited, and audited.
- **Submission Immutability**: Submitted or terminated attempts reject all subsequent edits, warnings, or submissions with HTTP 400/403/409.
- **Evaluation Privacy**: Authority notes are stored securely on `AssessmentAttempt.authorityNotes` and filtered from all candidate-facing response projections.
