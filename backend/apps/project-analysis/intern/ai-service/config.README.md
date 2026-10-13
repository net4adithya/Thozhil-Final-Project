# config.py Documentation

---

# Purpose

`config.py` is the centralized configuration module for **Module 3 – AI Reviewer Engine**.

Its responsibility is to load, validate, and provide configuration values required by the application.

Configuration includes runtime settings such as AI provider selection, model name, API credentials, request timeouts, and other application-wide options.

No other module should read environment variables directly.

---

# Responsibilities

`config.py` is responsible for:

* Loading configuration values.
* Reading environment variables.
* Providing application settings.
* Validating required configuration.
* Supplying default values where appropriate.
* Making configuration available to other modules.

---

# Non-Responsibilities

`config.py` must **NOT**:

* Call AI providers.
* Build prompts.
* Parse AI responses.
* Handle HTTP requests.
* Perform business logic.
* Read project files.
* Store application data.
* Implement logging logic.

Its sole purpose is configuration management.

---

# Why Is This File Needed?

Without a centralized configuration module:

* API keys become scattered throughout the codebase.
* Different files read environment variables independently.
* Runtime configuration becomes difficult to maintain.
* Switching environments becomes error-prone.

With `config.py`, all configuration is managed in one location.

---

# Position in the Architecture

```text id="cfg001"
Application Startup

↓

config.py

↓

Validated Settings

↓

Application Components
```

Configuration is loaded once and shared throughout the application.

---

# Configuration Sources

Configuration should be loaded in the following order:

1. Environment variables
2. `.env` file (during local development)
3. Default values (where safe)

Sensitive values should never have hardcoded defaults.

---

# Expected Configuration Values

Version 1 may require the following settings.

## AI Provider

Purpose

Selects the LLM provider used by the application.

Examples

```text id="cfg002"
gemini

openai

ollama

claude
```

---

## Model Name

Purpose

Specifies which model should be used.

Examples

```text id="cfg003"
gemini-2.5-pro

gpt-4.1

llama3

claude-sonnet
```

---

## API Key

Purpose

Authenticates requests to the AI provider.

Characteristics

* Required for cloud providers.
* Never logged.
* Never committed to version control.
* Loaded only from secure configuration sources.

---

## Base URL

Purpose

Allows custom endpoints.

Useful for:

* Azure OpenAI
* Local inference servers
* Ollama
* Reverse proxies

---

## Request Timeout

Purpose

Maximum duration allowed for an AI request before it is considered failed.

Example

```text id="cfg004"
30 seconds
```

---

## Temperature

Purpose

Controls response randomness.

Lower values produce more consistent reviews.

Version 1 should prefer deterministic outputs.

---

## Maximum Output Tokens

Purpose

Limits response size.

Prevents excessive API usage and unexpectedly large responses.

---

## Logging Level

Purpose

Controls application logging.

Example values

```text id="cfg005"
DEBUG

INFO

WARNING

ERROR
```

Production deployments should avoid verbose logging.

---

# Environment Variables

Example variables

```text id="cfg006"
AI_PROVIDER

MODEL_NAME

API_KEY

BASE_URL

REQUEST_TIMEOUT

TEMPERATURE

MAX_OUTPUT_TOKENS

LOG_LEVEL
```

Names may evolve, but should remain descriptive and consistent.

---

# Validation Rules

Configuration should be validated during application startup.

Examples

* Required values must exist.
* Timeout must be positive.
* Temperature must be within the supported range.
* Maximum output tokens must be greater than zero.

If validation fails, the application should stop during startup rather than fail later during runtime.

---

# Error Handling

Typical configuration errors include:

* Missing API key.
* Unsupported provider.
* Invalid timeout value.
* Invalid numeric settings.
* Malformed environment variables.

These should generate clear startup errors.

---

# Security Guidelines

Configuration must protect sensitive information.

Never:

* Hardcode API keys.
* Commit secrets to Git.
* Print secrets in logs.
* Return secrets through API responses.
* Include secrets in exception messages.

Use a `.env.example` file to document required variables without exposing real values.

---

# Example Project Files

```text id="cfg007"
.env.example

.env

config.py
```

`.env` should be ignored by version control.

`.env.example` should remain in the repository.

---

# Dependency Guidelines

`config.py` may depend on:

* Pydantic Settings (recommended)
* Standard library
* Environment variable utilities

It should **not** depend on:

* FastAPI routes
* AI provider implementation
* Parser
* Prompt Builder
* Business logic

Configuration should remain independent.

---

# Usage Pattern

Application components should obtain configuration through `config.py`.

Example flow

```text id="cfg008"
config.py

↓

Validated Settings

↓

AI Provider

↓

Application
```

No component should access environment variables directly.

---

# Future Enhancements

Possible future additions include:

* Multiple provider profiles.
* Development and production configurations.
* Automatic environment detection.
* Secret manager integration (AWS Secrets Manager, Azure Key Vault, Google Secret Manager).
* Runtime configuration reload.
* Feature flags.
* Cost limits.
* Token budgets.

These enhancements should be implemented without changing the public configuration interface.

---

# Testing Guidelines

Tests should verify:

* Required configuration loads successfully.
* Missing required values raise errors.
* Invalid numeric values fail validation.
* Default values are applied correctly.
* Environment variable overrides work as expected.

Tests should not require real API keys.

---

# Coding Guidelines

* Keep configuration immutable after loading.
* Load settings once during application startup.
* Use descriptive configuration names.
* Centralize validation.
* Avoid duplicate configuration logic.
* Separate sensitive and non-sensitive settings clearly.

---

# Notes for AI Coding Assistants

When implementing `config.py`:

* Treat this file as the single source of truth for runtime configuration.
* Load all configuration from environment variables or supported configuration sources.
* Validate settings during startup.
* Expose a clean, typed configuration object for the rest of the application.
* Do not include business logic.
* Do not hardcode secrets.
* Ensure configuration remains easy to extend as new providers and features are added.

`config.py` is the foundation of the application's runtime environment. A well-designed configuration module improves security, portability, maintainability, and makes it easy to deploy Module 3 across development, testing, and production environments.