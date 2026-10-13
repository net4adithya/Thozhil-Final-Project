# API Contract

# Module 3 – AI Reviewer Engine (v4)

---

# Purpose

This document defines the public API contract exposed by Module 3.

It specifies:

* Available endpoints
* Request format
* Response format
* Validation rules
* Error responses

This contract is the agreement between **Module 3** and **Module 4**.

As long as this contract remains unchanged, the internal implementation of Module 3 can evolve freely.

---

# Breaking Change: v1 → v2

The `project_code: string` field has been **removed**.

It is replaced by `program_files: array<ProgramFile>`.

This change enables multi-file intern submissions (1–10 files) with proper language metadata.

---

# Additive Change: v3 → v4

Two new fields added to `intern_review`:

- `speech_text: string` — TTS-optimized version of `feedback`. Abbreviations spelled out, code-style references rewritten as spoken phrases, no em-dashes, shorter sentences. Intended for the Browser Speech API or a cloud TTS provider.
- `audio_supported: boolean` — Always `true` in the current browser-mode implementation. Signals to Module 2 that audio playback is available.

This is a **non-breaking additive change**. Existing integrations that ignore unknown fields are unaffected.

---

# TTS Provider Configuration

Set `TTS_PROVIDER` in `.env` to control where speech synthesis happens:

| Value | Behaviour |
|-------|-----------|
| `browser` (default) | Module 3 returns `speech_text`. Module 2 calls the Browser Speech API. |
| `google_tts` | Future: Module 3 generates audio server-side via Google Cloud TTS. |
| `elevenlabs` | Future: Module 3 generates high-quality audio via ElevenLabs. |

---

# Base Information

**Module Name**: AI Reviewer Engine

**Protocol**: HTTP/HTTPS

**Data Format**: JSON

**Framework**: FastAPI

**Current API Version**: v2

---

# API Overview

```
POST /review
```

Evaluate an intern's submitted project against the assigned work description.

---

# Request Contract

## Endpoint

```http
POST /review
```

## Content Type

```http
Content-Type: application/json
```

## Request Body

```json
{
    "work_description": "string",
    "program_files": [
        {
            "filename": "string",
            "language": "string",
            "content": "string"
        }
    ]
}
```

---

## Request Fields

### work_description

Type: `string`

Required: Yes

Description: The official task assigned by the manager.

Validation:
- Required
- Cannot be empty or whitespace only

---

### program_files

Type: `array<ProgramFile>`

Required: Yes

Validation:
- Minimum 1 file
- Maximum 10 files
- Each file must have a non-empty filename, language, and content

#### ProgramFile Object

| Field      | Type   | Required | Description                                          |
|------------|--------|----------|------------------------------------------------------|
| `filename` | string | Yes      | Original filename including extension (e.g. auth.py) |
| `language` | string | Yes      | Programming language or file type (e.g. python)      |
| `content`  | string | Yes      | Full text content of the file                        |

---

## Example Request

```json
{
    "work_description": "Build a JWT Authentication System with login, signup, password hashing, and a protected route.",
    "program_files": [
        {
            "filename": "auth.py",
            "language": "python",
            "content": "def login(): pass\ndef signup(): pass"
        },
        {
            "filename": "models.py",
            "language": "python",
            "content": "class User:\n    id: int\n    email: str"
        }
    ]
}
```

---

# Successful Response

Status: `200 OK`

## Response Structure

```json
{
    "intern_review": {
        "score": 0,
        "feedback": "",
        "strengths": [],
        "missing": [],
        "suggestions": []
    },
    "manager_summary": {
        "overall_score": 0,
        "summary": "",
        "risk_level": "low",
        "recommendation": ""
    }
}
```

---

# Intern Review Object

| Field            | Type            | Description                                                                   |
|------------------|-----------------|-------------------------------------------------------------------------------|
| `score`          | integer (0–100) | Holistic evaluation score                                                     |
| `feedback`       | string          | Conversational spoken-prose review. May include technical terms and filenames.|
| `speech_text`    | string          | TTS-optimized version of feedback. Abbreviations expanded, filenames spoken, no em-dashes, shorter sentences. Pass directly to Browser Speech API. |
| `audio_supported`| boolean         | Always `true` — indicates Module 2 should activate audio playback             |
| `bugs`           | array<string>   | Specific bugs, security issues, or anti-patterns found in the code            |
| `missing`        | array<string>   | Requirements not yet implemented                                              |
| `suggestions`    | array<string>   | Actionable improvement recommendations                                        |

---

# Manager Summary Object

| Field            | Type                              | Description                                   |
|------------------|-----------------------------------|-----------------------------------------------|
| `overall_score`  | integer (0–100)                   | Simplified score for quick managerial review  |
| `summary`        | string                            | Short paragraph — readable in under 30 seconds|
| `risk_level`     | `"low"` `"medium"` `"high"` `"critical"` | Current submission risk assessment   |
| `recommendation` | string                            | Single-sentence managerial action             |

### risk_level Values

| Value      | Meaning                                                      |
|------------|--------------------------------------------------------------|
| `low`      | Submission is on track, only minor polish needed             |
| `medium`   | Meaningful gaps exist but core work is visible               |
| `high`     | Significant portions of requirements are missing or broken   |
| `critical` | Fundamental issues, nothing functional, or completely off-spec |

---

# Example Response

```json
{
    "intern_review": {
        "score": 45,
        "feedback": "You have got a solid start here. The login and signup routes are in place and the JWT integration looks correct. The main thing to address is password hashing — right now the `auth.py` file stores passwords in plain text.",
        "speech_text": "You have got a solid start here. The login and signup routes are in place and the JSON Web Token integration looks correct. The main thing to address is password hashing. Right now the auth dot py file stores passwords in plain text.",
        "audio_supported": true,
        "strengths": [
            "Clean separation of routes using Flask Blueprints",
            "Correct JWT generation and expiration logic"
        ],
        "bugs": [
            "Passwords stored as plain text in the users dict — bcrypt is required",
            "SECRET_KEY hardcoded in source — must be loaded from environment variables"
        ],
        "missing": [
            "Password hashing using bcrypt",
            "Protected route requiring a valid JWT",
            "Unit tests"
        ],
        "suggestions": [
            "Integrate bcrypt to hash passwords during signup",
            "Create a decorator to protect routes by validating the JWT"
        ]
    },
    "manager_summary": {
        "overall_score": 45,
        "summary": "The intern has set up a basic Flask structure but critical requirements are missing.",
        "risk_level": "high",
        "recommendation": "Assign a senior engineer to mentor the intern through security best practices."
    }
}
```

---

# Error Responses

| Status | Condition                              | Example detail                             |
|--------|----------------------------------------|--------------------------------------------|
| `422`  | Missing field or type mismatch         | `"field required"` (FastAPI auto-generated)|
| `400`  | Blank field passed validation          | `"Work description cannot be empty."`      |
| `503`  | AI provider unreachable or no API key  | `"AI provider is currently unavailable."`  |
| `504`  | AI provider exceeded timeout window    | `"AI provider did not respond within 60 seconds."` |
| `500`  | AI returned unparseable output         | `"Unable to parse AI response."`           |

---

# Validation Rules

| Field                           | Rule                                                           |
|---------------------------------|----------------------------------------------------------------|
| `work_description`              | Required, non-empty, non-whitespace                            |
| `program_files`                 | Required, 1–10 items                                           |
| `program_files[].filename`      | Required, non-empty string                                     |
| `program_files[].language`      | Required, non-empty string                                     |
| `program_files[].content`       | Optional — empty content is coerced to `""`                    |
| `intern_review.score`           | Integer 0–100                                                  |
| `intern_review.speech_text`     | Non-empty string, no markdown, no em-dashes                    |
| `intern_review.audio_supported` | Boolean — always `true` in browser mode                       |
| `intern_review.bugs`            | Array of strings — empty array `[]` if no bugs                |
| `manager_summary.overall_score` | Integer 0–100                                                  |
| `manager_summary.risk_level`    | One of: `low`, `medium`, `high`, `critical`                   |

---

# API Stability Guidelines

* Do not rename existing response fields.
* Do not remove existing response fields.
* Add new optional fields where possible.
* Validate every request and response using Pydantic models.
* Bump the version constant in `prompt_builder.py` (`PROMPT_VERSION`) when the prompt changes.
