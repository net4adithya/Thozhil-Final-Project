# routes.py Documentation

---

# Purpose

`routes.py` defines all HTTP API endpoints exposed by **Module 3 – AI Reviewer Engine**.

It acts as the **controller layer** of the application.

Its job is to receive requests, coordinate the review pipeline, and return structured responses.

It should **not** contain AI logic, prompt construction, or response parsing.

Those responsibilities belong to dedicated modules.

---

# Responsibilities

`routes.py` is responsible for:

* Defining API endpoints.
* Receiving incoming HTTP requests.
* Validating request data using Pydantic models.
* Calling the appropriate business components in the correct order.
* Returning structured API responses.
* Handling application-level exceptions.

---

# Non-Responsibilities

`routes.py` must **NOT**:

* Build prompts.
* Communicate directly with AI providers.
* Parse raw AI responses.
* Store API keys.
* Contain prompt templates.
* Implement business rules.
* Perform database operations.
* Extract ZIP files.
* Read project files.

Those belong to other modules.

---

# Current Endpoints

Version 1 exposes a single endpoint.

```http
POST /review
```

Future endpoints may include:

```http
GET /health

GET /providers

POST /review/batch

POST /review/retry
```

Only implement `POST /review` in Version 1.

---

# Endpoint Responsibilities

The `/review` endpoint coordinates the review process.

High-level flow:

```text
Incoming Request

↓

Validate Request

↓

Build Prompt

↓

Generate AI Response

↓

Parse Response

↓

Return Structured Review
```

The route should only orchestrate these steps.

It should not implement them.

---

# Request Model

The endpoint accepts:

```python
ReviewRequest
```

Current fields:

* work_description
* project_code

The route should rely on FastAPI + Pydantic for automatic validation.

Do not manually validate fields that Pydantic already validates.

---

# Response Model

The endpoint returns:

```python
ReviewResponse
```

Containing:

* InternReview
* ManagerSummary

Always return the Pydantic response model.

Never return raw AI output.

---

# Request Lifecycle

The route should execute the following sequence.

## Step 1

Receive HTTP request.

↓

## Step 2

Validate request body.

↓

## Step 3

Generate prompt using Prompt Builder.

↓

## Step 4

Call AI Provider.

↓

## Step 5

Receive raw AI response.

↓

## Step 6

Parse and validate response.

↓

## Step 7

Return structured JSON.

---

# Internal Dependencies

The route may communicate with:

```text
models.py

↓

prompt_builder.py

↓

ai_provider.py

↓

parser.py
```

The route should never communicate directly with configuration files or environment variables.

---

# Error Handling

The route should gracefully handle expected failures.

Examples include:

---

## Invalid Request

Return

```http
400 Bad Request
```

Example causes:

* Empty work description
* Empty project code

---

## Validation Error

FastAPI automatically returns:

```http
422 Unprocessable Entity
```

Do not duplicate FastAPI's validation logic.

---

## AI Provider Failure

Examples:

* Timeout
* Invalid API key
* Rate limiting
* Network failure

Return

```http
503 Service Unavailable
```

with a meaningful error message.

---

## Parsing Failure

If the parser cannot produce valid output,

return

```http
500 Internal Server Error
```

Never expose raw AI output or stack traces to the client.

---

# Response Principles

Every successful response must:

* Follow the ReviewResponse schema.
* Contain validated data.
* Never contain malformed JSON.
* Never include debugging information.
* Never expose provider-specific details.

---

# Dependency Flow

The route acts only as an orchestrator.

```text
POST /review

↓

ReviewRequest

↓

Prompt Builder

↓

AI Provider

↓

Parser

↓

ReviewResponse

↓

HTTP Response
```

No component should bypass this flow.

---

# Logging

The route may log:

* Request received
* Review started
* Review completed
* Processing time
* Errors

Do **not** log:

* API keys
* Full project code
* Sensitive user information

---

# Performance Considerations

The route should remain lightweight.

It should avoid:

* Heavy computation
* AI processing logic
* Prompt generation
* JSON parsing logic

These tasks belong to specialized modules.

---

# Future Expansion

Future versions may add:

* Batch review endpoints
* Async review processing
* Streaming AI responses
* Voice review generation
* Review history retrieval
* Health check endpoint
* Provider status endpoint

The current implementation should be designed so these additions can be introduced without restructuring the file.

---

# Coding Guidelines

* Keep endpoint functions small and readable.
* Use dependency injection where appropriate.
* Keep orchestration logic linear and easy to follow.
* Return only validated Pydantic models.
* Raise meaningful HTTP exceptions.
* Avoid duplicated code.
* Keep the routing layer independent of AI implementation details.

---

# Notes for AI Coding Assistants

When implementing `routes.py`:

* Treat this file as the application's controller.
* Do not implement AI logic here.
* Do not construct prompts here.
* Do not parse AI responses here.
* Simply coordinate the workflow by calling the appropriate modules.
* Ensure every endpoint has clear request and response models.
* Keep the implementation clean, modular, and easy to extend.

The goal of `routes.py` is to provide a stable HTTP interface while delegating all business logic to the appropriate components.