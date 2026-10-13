# models.py Documentation

---

# Purpose

`models.py` defines all **Pydantic data models** used throughout Module 3.

These models act as the **contract** between different components of the application and between Module 3 and external modules (especially Module 4).

Every request entering the application and every response leaving the application must conform to these models.

This file should contain **only data definitions** and validation rules.

---

# Responsibilities

`models.py` is responsible for:

* Defining request models.
* Defining response models.
* Defining nested models.
* Validating incoming data.
* Validating outgoing data.
* Providing type safety across the application.
* Automatically generating API documentation through FastAPI.

---

# Non-Responsibilities

`models.py` must **NOT**:

* Call AI providers.
* Build prompts.
* Parse AI responses.
* Read environment variables.
* Perform database operations.
* Implement business logic.
* Process project files.
* Handle HTTP requests.

This file only defines the structure of data.

---

# Why Pydantic Models?

Using Pydantic provides several advantages:

* Automatic request validation.
* Automatic response validation.
* Type safety.
* Clear API contracts.
* Automatic Swagger documentation.
* Easier debugging.
* Better IDE support.

These models become the shared language between all components.

---

# Data Flow

```text
Incoming JSON

↓

ReviewRequest

↓

Business Logic

↓

InternReview

+

ManagerSummary

↓

ReviewResponse

↓

Outgoing JSON
```

Every piece of data should pass through these models.

---

# Core Models

Version 1 contains four primary models.

---

## 1. ReviewRequest

Purpose

Represents the request received by Module 3.

Fields

### work_description

Type

```python
str
```

Required

Yes

Description

The official work assigned by the manager.

Example

```text
Develop a JWT authentication system with login and signup functionality.
```

Validation

* Required
* Cannot be empty
* Should contain meaningful content

---

### project_code

Type

```python
str
```

Required

Yes

Description

The intern's submitted project code.

Version 1 assumes this is already extracted into plain text.

Validation

* Required
* Cannot be empty
* Should contain readable project code

---

## 2. InternReview

Purpose

Contains the detailed AI review intended for the intern.

Fields

---

### score

Type

```python
int
```

Range

```text
0 - 100
```

Description

Overall evaluation score.

Validation

* Integer only
* Minimum: 0
* Maximum: 100

---

### feedback

Type

```python
str
```

Description

Detailed explanation of the review.

Should include:

* completed work
* missing work
* code quality observations
* improvement guidance

Should be constructive and educational.

---

### strengths

Type

```python
list[str]
```

Description

Positive aspects identified by the AI.

Example

```text
[
    "JWT Authentication implemented",
    "Clean project organization"
]
```

---

### missing

Type

```python
list[str]
```

Description

Expected features that were not found.

Example

```text
[
    "Password Reset",
    "Unit Tests"
]
```

---

### suggestions

Type

```python
list[str]
```

Description

Actionable recommendations for improvement.

Example

```text
[
    "Use bcrypt for password hashing",
    "Write authentication tests"
]
```

Suggestions should be specific and practical.

---

## 3. ManagerSummary

Purpose

Contains a concise review intended for the manager.

Managers require a high-level overview rather than detailed technical feedback.

Fields

---

### overall_score

Type

```python
int
```

Range

```text
0 - 100
```

Description

Simplified evaluation score.

Normally mirrors the intern score in Version 1.

Future versions may introduce separate scoring criteria.

---

### summary

Type

```python
str
```

Description

A brief summary highlighting:

* progress made
* missing work
* overall status

The summary should be concise and easy to scan.

---

## 4. ReviewResponse

Purpose

Top-level response returned by the API.

Contains:

* InternReview
* ManagerSummary

This is the only response object returned by the `/review` endpoint.

Structure

```text
ReviewResponse

├── intern_review

└── manager_summary
```

---

# Validation Rules

All models should enforce validation.

Examples

ReviewRequest

* Required fields
* Non-empty strings

InternReview

* Score between 0 and 100
* Lists must contain strings

ManagerSummary

* Score between 0 and 100
* Summary cannot be empty

Validation should happen automatically through Pydantic wherever possible.

---

# Example Request

```json
{
    "work_description": "Build JWT authentication with login and signup.",
    "project_code": "def login(): ..."
}
```

---

# Example Response

```json
{
    "intern_review": {
        "score": 88,
        "feedback": "Authentication is mostly complete. Password hashing and testing should be improved.",
        "strengths": [
            "JWT implemented"
        ],
        "missing": [
            "Unit Tests"
        ],
        "suggestions": [
            "Implement bcrypt",
            "Add authentication tests"
        ]
    },
    "manager_summary": {
        "overall_score": 88,
        "summary": "Intern has completed most authentication requirements with minor improvements remaining."
    }
}
```

---

# Model Relationships

```text
ReviewRequest

↓

Processing

↓

InternReview

+

ManagerSummary

↓

ReviewResponse
```

The application should never bypass these models.

---

# Future Model Extensions

Future versions may add additional fields.

Examples

ReviewRequest

* programming_language
* project_name
* repository_url
* commit_hash
* submission_id
* intern_id

InternReview

* security_score
* maintainability_score
* performance_score
* readability_score
* complexity_score
* estimated_completion

ManagerSummary

* risk_level
* completion_percentage
* recommended_action

These fields should be added in a backward-compatible manner whenever possible.

---

# Design Principles

The models should follow these principles:

* Keep models focused and easy to understand.
* Avoid duplicated fields.
* Prefer nested models over deeply flattened structures.
* Validate data as early as possible.
* Use descriptive field names.
* Maintain backward compatibility when extending models.

---

# Notes for AI Coding Assistants

When implementing `models.py`:

* Use Pydantic `BaseModel` for all models.
* Add appropriate field validation (for example, score ranges).
* Use Python type hints throughout.
* Keep models free of business logic.
* Ensure models match the API contract exactly.
* Do not add unnecessary fields that are not part of the current specification.
* If new fields are introduced in future versions, make them optional unless they are required by the API contract.

`models.py` is the foundation of Module 3. Every other component depends on these models, so they should remain simple, stable, and well-defined.