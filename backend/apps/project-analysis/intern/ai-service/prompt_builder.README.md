# prompt_builder.py Documentation

---

# Purpose

`prompt_builder.py` is responsible for constructing the prompt that will be sent to the Large Language Model (LLM).

The quality of the AI review depends heavily on the quality of the prompt. Instead of embedding prompt text throughout the application, all prompt generation should be centralized in this file.

The Prompt Builder converts structured application data into a clear, consistent, and deterministic prompt.

---

# Responsibilities

`prompt_builder.py` is responsible for:

* Generating prompts for the AI provider.
* Combining the work description and project code into a structured prompt.
* Defining the AI's role and expected behavior.
* Specifying the required output format.
* Ensuring prompts remain consistent across requests.
* Supporting future prompt versions.

---

# Non-Responsibilities

`prompt_builder.py` must **NOT**:

* Call AI providers.
* Parse AI responses.
* Validate API requests.
* Perform code analysis.
* Read environment variables.
* Handle HTTP requests.
* Store prompt history.
* Implement business logic.

Its only responsibility is building prompts.

---

# Why Is This File Needed?

A good prompt should be:

* Consistent
* Reusable
* Easy to improve
* Version controlled
* Independent of API providers

Keeping prompts in one location makes it easier to:

* Improve review quality
* Experiment with prompt wording
* Add new prompt versions
* Support multiple AI providers without duplicating prompt logic

---

# Position in the Workflow

```text
Incoming Request
        │
        ▼
ReviewRequest
        │
        ▼
Prompt Builder
        │
        ▼
Prompt String
        │
        ▼
AI Provider
        │
        ▼
Raw AI Response
```

The Prompt Builder sits between validated input data and the AI provider.

---

# Inputs

The Prompt Builder receives a validated `ReviewRequest`.

Fields include:

* work_description
* project_code

The builder should treat these as trusted inputs because they have already been validated by the API layer.

---

# Output

The Prompt Builder returns a single string containing the complete prompt to send to the LLM.

Output type

```python
str
```

The AI provider should receive only this generated prompt.

---

# Prompt Structure

The generated prompt should follow a predictable structure.

```text
System Role

↓

Task Description

↓

Assigned Work

↓

Submitted Project

↓

Evaluation Instructions

↓

Output Format Requirements
```

Maintaining a consistent structure improves response reliability.

---

# Prompt Sections

## 1. AI Role

Clearly define the AI's role.

Example responsibilities:

* Act as an experienced software engineer.
* Review intern submissions.
* Compare implementation against requirements.
* Provide constructive educational feedback.

This section establishes the model's behavior.

---

## 2. Evaluation Context

Explain the review objective.

Example:

The intern was assigned a software task. Compare the submitted implementation against the assigned work and evaluate the submission fairly.

---

## 3. Work Description

Insert the manager's assigned work exactly as received.

Example

```text
Build a JWT authentication system with login, signup, password hashing, and token validation.
```

Do not rewrite or summarize the assignment.

---

## 4. Project Code

Insert the submitted project code.

Version 1 assumes the code is already extracted into plain text.

Future versions may include:

* Multiple files
* Folder structure
* Programming language metadata
* File names

---

## 5. Evaluation Guidelines

The prompt should instruct the AI to evaluate areas such as:

* Requirement completion
* Correctness
* Code quality
* Maintainability
* Missing functionality
* Best practices
* Improvement suggestions

Avoid vague instructions.

---

## 6. Tone

The AI should produce feedback that is:

* Professional
* Respectful
* Educational
* Constructive
* Actionable

Avoid:

* Insults
* Sarcasm
* Harsh criticism
* Unhelpful comments

The goal is to help interns improve.

---

## 7. Output Format

The prompt must clearly instruct the AI to return **only valid JSON**.

The JSON should conform to the application's `ReviewResponse` model.

No additional explanations, Markdown, or commentary should be requested.

---

# Prompt Design Principles

The prompt should be:

* Deterministic
* Clear
* Concise
* Structured
* Provider-independent
* Easy to modify

Avoid ambiguous language that could lead to inconsistent responses.

---

# Versioning

Prompt improvements should be managed through versioning.

Example

```text
Prompt V1
↓

Prompt V2
↓

Prompt V3
```

New versions should improve quality without changing the application's external API.

---

# Example Workflow

```text
ReviewRequest

↓

Extract work_description

↓

Extract project_code

↓

Generate Prompt

↓

Return Prompt String
```

The Prompt Builder should not perform any AI interaction.

---

# Future Enhancements

Future versions may support:

* Language-specific prompts (Python, Java, C++, etc.)
* Different prompt templates for frontend, backend, or ML projects
* Rubric-based evaluations
* Difficulty-aware scoring
* Company-specific coding standards
* Dynamic prompt selection
* Localization for multiple languages

These enhancements should be implemented without affecting the public API.

---

# Dependencies

The Prompt Builder may depend on:

* `models.py`
* Standard Python string formatting utilities

It should **not** depend on:

* FastAPI
* AI providers
* Parser
* Environment configuration
* Database modules

This keeps the component portable and easy to test.

---

# Testing Guidelines

Tests should verify that:

* Required sections are always present.
* Work descriptions are inserted correctly.
* Project code is inserted correctly.
* Output format instructions are included.
* Empty or malformed prompts are never generated from valid inputs.

Tests should focus on prompt structure rather than the AI's response quality.

---

# Coding Guidelines

* Keep prompt templates readable.
* Avoid hardcoded values scattered throughout the application.
* Use descriptive variable names.
* Minimize string duplication.
* Separate reusable prompt fragments if needed.
* Document any significant prompt changes.

---

# Notes for AI Coding Assistants

When implementing `prompt_builder.py`:

* Create a single, well-structured prompt from the validated request data.
* Keep prompt construction independent of the AI provider.
* Ensure the generated prompt always includes the AI role, task context, work description, project code, evaluation guidelines, and required JSON output format.
* Return only the generated prompt string.
* Do not call the LLM from this file.
* Do not parse responses in this file.
* Design the implementation so prompt templates can be updated or versioned easily.

The Prompt Builder is the "instruction designer" of Module 3. Its quality directly influences the consistency, accuracy, and usefulness of the AI-generated code reviews, making it one of the most critical components of the system.