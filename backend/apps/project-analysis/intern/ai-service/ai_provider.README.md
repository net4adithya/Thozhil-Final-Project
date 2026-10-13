# ai_provider.py Documentation

---

# Purpose

`ai_provider.py` is responsible for communicating with the Large Language Model (LLM).

It serves as the **AI abstraction layer** for Module 3.

Instead of allowing the application to interact directly with a specific provider (such as Gemini or OpenAI), every AI request should pass through this module.

This design ensures that the rest of the application remains independent of any single AI provider.

---

# Responsibilities

`ai_provider.py` is responsible for:

* Receiving a completed prompt.
* Sending the prompt to the configured AI provider.
* Receiving the provider's response.
* Returning the raw response to the parser.
* Handling provider-specific communication.
* Converting provider errors into application-level exceptions.

---

# Non-Responsibilities

`ai_provider.py` must **NOT**:

* Build prompts.
* Parse AI responses.
* Validate request models.
* Handle HTTP requests.
* Implement business rules.
* Store review history.
* Access databases.
* Extract project files.

Its only responsibility is AI communication.

---

# Why Is This File Needed?

Without an abstraction layer, the entire application becomes tightly coupled to one provider.

Example:

```text
routes.py

↓

Gemini SDK
```

If the project later switches to OpenAI or a local model, multiple files would require changes.

With an abstraction layer:

```text
routes.py

↓

ai_provider.py

↓

Gemini

OR

OpenAI

OR

Claude

OR

Ollama
```

Only `ai_provider.py` changes when switching providers.

---

# Position in the Workflow

```text
Incoming Request
        │
        ▼
Prompt Builder
        │
        ▼
Generated Prompt
        │
        ▼
AI Provider
        │
        ▼
Raw AI Response
        │
        ▼
Parser
```

The AI provider sits between prompt generation and response parsing.

---

# Inputs

The provider receives:

```python
prompt: str
```

The prompt should already be complete.

The provider should not modify the prompt before sending it to the LLM.

---

# Output

The provider returns:

```python
raw_response: str
```

The returned value is the model's raw text output.

No parsing or validation should occur here.

---

# High-Level Workflow

```text
Receive Prompt

↓

Send Request to LLM

↓

Wait for Response

↓

Receive Raw Output

↓

Return Raw Text
```

The workflow should remain simple and deterministic.

---

# Supported Providers

The design should make it easy to support multiple providers.

Potential providers include:

* Google Gemini
* OpenAI GPT
* Anthropic Claude
* Ollama (local models)
* Azure OpenAI
* AWS Bedrock
* Hugging Face Inference API

Version 1 may implement only one provider, but the architecture should support future expansion.

---

# Provider Independence

The rest of the application should never know:

* Which provider is being used.
* Which SDK is installed.
* Which model is selected.
* How authentication works.

Those details belong exclusively inside this module.

---

# Error Handling

Provider-specific errors should never be exposed directly to the API layer.

Instead, translate them into application-level exceptions.

Examples include:

* Invalid API key
* Authentication failure
* Network timeout
* Rate limiting
* Service unavailable
* Quota exceeded
* Invalid model name

The calling layer should receive clear, consistent exceptions regardless of the underlying provider.

---

# Retry Strategy

Transient failures may be retried.

Examples:

* Temporary network interruption
* Provider timeout
* Short-lived service outage

Retries should:

* Be limited.
* Use backoff if implemented.
* Avoid infinite retry loops.

Permanent failures (such as invalid credentials) should fail immediately.

---

# Configuration

Provider configuration should come from a dedicated configuration module or environment variables.

Examples of configurable values:

* Provider name
* Model name
* API key
* Base URL
* Request timeout
* Maximum output tokens
* Temperature

These values should **not** be hardcoded.

---

# Security Considerations

The provider must never:

* Log API keys.
* Expose secrets in exceptions.
* Return sensitive provider metadata.
* Leak internal authentication details.

Sensitive information should remain confined to the configuration layer.

---

# Logging

Appropriate logs include:

* Request started
* Request completed
* Response received
* Provider unavailable
* Timeout occurred

Do **not** log:

* API keys
* Full prompts (in production)
* Full project code
* Personally identifiable information

---

# Performance Considerations

The provider should:

* Minimize unnecessary processing.
* Avoid modifying prompt content.
* Return responses as quickly as possible.
* Delegate parsing to the parser.

Network communication should be the primary responsibility.

---

# Future Enhancements

Future versions may support:

* Automatic provider selection
* Provider fallback (for example, Gemini → OpenAI)
* Model routing based on project type
* Streaming responses
* Cost tracking
* Token usage reporting
* Request caching
* Parallel provider evaluation

These enhancements should not require changes to the rest of the application.

---

# Dependency Guidelines

`ai_provider.py` may depend on:

* Provider SDKs (Gemini, OpenAI, etc.)
* Configuration module
* Standard Python libraries for networking or error handling

It should **not** depend on:

* FastAPI
* Prompt Builder
* Parser
* HTTP route definitions
* Pydantic response models

Keep the communication layer isolated.

---

# Testing Guidelines

Tests should verify that:

* Prompts are sent without modification.
* Raw responses are returned unchanged.
* Provider errors are translated correctly.
* Invalid credentials are handled gracefully.
* Timeouts produce expected exceptions.
* Network failures do not crash the application.

Tests should mock the provider rather than calling real AI services.

---

# Coding Guidelines

* Keep provider-specific code isolated.
* Avoid exposing SDK-specific classes outside this file.
* Write clean, readable methods with clear responsibilities.
* Centralize error translation.
* Make switching providers require minimal code changes.
* Avoid embedding business logic in the communication layer.

---

# Notes for AI Coding Assistants

When implementing `ai_provider.py`:

* Treat this file as the gateway between the application and the LLM.
* Accept a completed prompt string and return the model's raw text response.
* Do not modify prompts.
* Do not parse responses.
* Handle provider-specific errors internally and expose consistent application-level exceptions.
* Keep the implementation provider-agnostic wherever possible.
* Design the code so that adding or replacing an AI provider requires minimal changes.

The AI Provider is the communication layer of Module 3. Its responsibility is to reliably send prompts to an LLM and return the raw response, while shielding the rest of the application from provider-specific details and implementation changes.