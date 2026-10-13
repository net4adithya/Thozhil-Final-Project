# parser.py Documentation

---

# Purpose

`parser.py` is responsible for converting the raw response returned by the Large Language Model (LLM) into structured, validated Python objects.

LLMs generate text, not guaranteed JSON. Even when instructed to return JSON, they may include extra text, Markdown code fences, or formatting errors.

The parser acts as the reliability layer between the AI and the rest of the application.

Its job is to ensure that **only valid, structured data** is passed to the application.

---

# Responsibilities

`parser.py` is responsible for:

* Receiving raw LLM responses.
* Cleaning unwanted formatting.
* Extracting JSON.
* Parsing JSON into Python objects.
* Validating parsed data using Pydantic models.
* Returning structured response objects.
* Raising meaningful exceptions when parsing fails.

---

# Non-Responsibilities

`parser.py` must **NOT**:

* Build prompts.
* Call AI providers.
* Modify prompts.
* Handle HTTP requests.
* Read configuration files.
* Store data in databases.
* Perform business logic.
* Evaluate code quality.

Its only job is parsing and validation.

---

# Why Is This File Needed?

LLMs are not deterministic.

Even with instructions such as:

> Return only valid JSON.

they may still produce outputs like:

Example 1

```text
Sure! Here's the review.

{
    ...
}
```

Example 2

````text
```json
{
   ...
}
```
````

Example 3

```text
The intern performed well.

{
   ...
}

Hope this helps!
```

The application cannot safely process these responses directly.

The parser ensures that only clean, validated data reaches the rest of the system.

---

# Position in the Workflow

```text
Incoming Request
        │
        ▼
Prompt Builder
        │
        ▼
AI Provider
        │
        ▼
Raw AI Response
        │
        ▼
Parser
        │
        ▼
Validated ReviewResponse
        │
        ▼
API Response
```

Every AI response must pass through this layer.

---

# Parsing Workflow

The parser should follow a predictable sequence.

```text
Receive Raw Response

↓

Clean Formatting

↓

Extract JSON

↓

Convert to Python Dictionary

↓

Validate Using Pydantic

↓

Return ReviewResponse
```

If any step fails, return a meaningful error.

---

# Step 1 – Receive Raw Response

Input

```python
raw_response: str
```

Example

````text
Sure!

```json
{
  ...
}
````

`````

The parser should assume the input is plain text.

---

# Step 2 – Clean Formatting

Responsibilities

Remove:

- Markdown code fences
- Leading or trailing whitespace
- Unnecessary introductory text (when safely identifiable)

Examples

Remove

````text
```json
`````

`````

Remove

````text
```
```
`````

Trim whitespace.

Do **not** modify the JSON content itself.

---

# Step 3 – Extract JSON

Locate the JSON object within the cleaned response.

Assume that the AI may wrap the JSON with additional commentary.

The parser should isolate only the JSON portion before attempting to decode it.

---

# Step 4 – Parse JSON

Convert the extracted JSON string into a Python dictionary.

If parsing fails:

* Raise a parsing exception.
* Do not silently ignore errors.
* Do not return partial data.

---

# Step 5 – Validate Against Models

The parsed dictionary must be validated using the application's Pydantic models.

Expected top-level model

```python
ReviewResponse
```

Validation ensures:

* Required fields exist.
* Data types are correct.
* Scores are within expected ranges.
* Lists contain strings.

Only validated objects should be returned.

---

# Step 6 – Return Structured Response

Return a fully validated `ReviewResponse` object.

The rest of the application should never interact with raw JSON.

---

# Error Handling

The parser should handle common LLM formatting issues gracefully.

---

## Case 1 – Markdown Code Fences

Input

````text
```json
{
 ...
}
```
````

Expected Result

Remove the fences and parse successfully.

---

## Case 2 – Introductory Text

Input

```text
Here is the review:

{
 ...
}
```

Expected Result

Extract only the JSON object.

---

## Case 3 – Trailing Commentary

Input

```text
{
 ...
}

Hope this helps!
```

Expected Result

Ignore the trailing commentary and parse the JSON.

---

## Case 4 – Invalid JSON

Input

```text
{
 score: ninety
}
```

Expected Result

Raise a parsing error.

Do not attempt to guess the intended structure.

---

## Case 5 – Missing Fields

Input

```json
{
    "score": 90
}
```

Expected Result

Fail Pydantic validation because required fields are missing.

---

## Case 6 – Incorrect Data Types

Input

```json
{
    "score": "excellent"
}
```

Expected Result

Validation failure.

---

# Retry Strategy (Recommended)

If parsing fails due to formatting issues, the application may optionally retry once.

Possible retry flow

```text
AI Response

↓

Parsing Failed

↓

Ask AI to return valid JSON only

↓

Receive Corrected Response

↓

Parse Again
```

Retry logic should remain outside the parser where possible.

The parser should focus on parsing, not AI interaction.

---

# Dependencies

The parser may depend on:

* json
* re (regular expressions)
* Pydantic models from `models.py`

The parser should **not** depend on:

* FastAPI
* AI providers
* Prompt builder
* Configuration

---

# Expected Functionality

The parser should expose a small, focused API.

Example responsibilities

* Parse raw AI response.
* Return validated `ReviewResponse`.

The parser should avoid exposing unnecessary helper functions publicly.

---

# Logging

The parser may log:

* Parsing started.
* Parsing completed.
* Validation failed.
* Invalid JSON detected.

Do **not** log:

* API keys.
* Sensitive project code.
* Complete AI responses in production environments.

---

# Performance Considerations

Parsing should be lightweight.

Avoid:

* Expensive processing.
* Business logic.
* AI interaction.

The parser should only transform and validate data.

---

# Future Enhancements

Possible future improvements include:

* JSON repair strategies.
* Multiple parser implementations.
* XML support (if ever required).
* Streaming response parsing.
* Confidence scoring for malformed outputs.

These should be added without changing the parser's primary responsibility.

---

# Design Principles

The parser should follow these principles:

* Single Responsibility Principle.
* Fail fast on invalid data.
* Never return partially validated objects.
* Keep parsing logic deterministic.
* Separate parsing from AI communication.
* Separate validation from business logic.

---

# Notes for AI Coding Assistants

When implementing `parser.py`:

* Focus only on parsing and validation.
* Use Python's `json` module for decoding.
* Use regular expressions only when necessary to isolate JSON.
* Validate every parsed object using the Pydantic models.
* Raise clear, descriptive exceptions on failure.
* Never silently ignore malformed responses.
* Do not implement AI retry logic inside this file.
* Keep the implementation small, readable, and easy to test.

The parser is the safety layer of Module 3. Its purpose is to protect the application from unpredictable LLM output and ensure that all downstream components receive clean, validated data.