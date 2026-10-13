# Architecture Documentation

# AI-Powered Intern Review System

---

# Purpose

This document explains the overall architecture of the AI-Powered Intern Review System and the role of Module 3 within the complete application.

It is intended for developers and AI coding assistants to understand how data flows through the system and how each module interacts with the others.

---

# System Overview

The project is an AI-powered extension to an existing internship management system.

Instead of managers manually reviewing every intern submission, the system automatically performs an initial AI review.

The AI generates:

* Detailed feedback for interns.
* A concise progress summary for managers.

The manager remains responsible for the final evaluation, while the AI acts as an intelligent assistant.

---

# High-Level Architecture

```text
                        Existing Internship Management System

        ┌─────────────────────────────────────────────────────────────┐
        │                                                             │
        │                     Manager (Authority)                     │
        │                                                             │
        └─────────────────────────────────────────────────────────────┘
                               │
                               │ Creates Work Description
                               ▼
                    Module 1 - Data & Integration
                               │
                               │ Stores Work Description
                               │
                               ▼
                      Existing Database / Storage
                               ▲
                               │
                      Intern uploads project
                               │
                               ▼
                    Module 4 - Orchestration Layer
                               │
                               │ Sends Review Request
                               ▼
                     Module 3 - AI Reviewer Engine
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
      Prompt Builder     AI Provider      Response Parser
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                     Structured Review Result
                               │
                               ▼
                    Module 4 - Orchestration
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
          Module 2                    Module 2
     Intern Dashboard           Manager Dashboard
```

---

# System Components

The application consists of four independent modules.

Each module has a clearly defined responsibility.

---

# Module 1 — Data & Integration Layer

## Purpose

Acts as the bridge between the existing internship management system and the AI add-on.

## Responsibilities

* Store work descriptions.
* Store intern submissions.
* Integrate with the existing database.
* Provide APIs for retrieving project information.
* Handle communication with the existing system.

## Owns

* Database
* Storage
* Existing backend integration

## Does NOT own

* AI logic
* Prompt engineering
* Frontend rendering

---

# Module 2 — User Interface

## Purpose

Provides the interface used by managers and interns.

## Manager Interface

Responsibilities

* Create work descriptions.
* Update assigned tasks.
* View AI-generated summaries.
* Track intern progress.

## Intern Interface

Responsibilities

* Submit project work.
* View AI review.
* View suggestions.
* View review history.

## Owns

* Frontend
* UI components
* User experience

## Does NOT own

* AI processing
* Prompt generation
* Review logic

---

# Module 3 — AI Reviewer Engine

## Purpose

Acts as the intelligence layer of the system.

This module evaluates the submitted project using an LLM.

Module 3 is implemented independently from the rest of the application.

It behaves like a standalone AI service.

---

# Module 4 — Orchestration Layer

## Purpose

Coordinates communication between all modules.

Responsibilities

* Trigger AI review.
* Send requests to Module 3.
* Store AI responses.
* Return responses to Module 2.

Module 4 contains business workflow logic but does not perform AI reasoning.

---

# Module Interaction

The modules communicate as follows.

```text
Module 1

↓

Module 4

↓

Module 3

↓

Module 4

↓

Module 2
```

No module should bypass Module 4.

This keeps the system loosely coupled and easier to maintain.

---

# Detailed Module 3 Architecture

Module 3 is internally divided into several components.

```text
Incoming Request

↓

Input Validation

↓

Prompt Builder

↓

AI Provider

↓

Response Parser

↓

Schema Validation

↓

Structured Response
```

Each component has only one responsibility.

---

# Internal Components

## Input Validation

Receives incoming requests.

Checks:

* Empty work description
* Empty project code
* Invalid request format

Rejects invalid requests before contacting the AI.

---

## Prompt Builder

Creates prompts for the LLM.

Responsibilities

* Insert work description.
* Insert project code.
* Define review instructions.
* Specify output format.

The prompt builder never calls the AI directly.

---

## AI Provider

Responsible for communicating with the selected LLM.

Current provider examples

* Gemini
* Sarvam AI
* OpenAI

Future providers

* Ollama
* Local LLM
* Any provider implementing the same interface

Business logic should never depend on a specific provider.

---

## Response Parser

Receives raw AI output.

Responsibilities

* Remove markdown formatting.
* Extract JSON.
* Validate JSON.
* Convert JSON into application models.

Invalid responses should never reach the rest of the application.

---

## Schema Validation

Uses Pydantic models to ensure:

* Correct field names.
* Correct data types.
* Required fields exist.

Only validated objects are returned.

---

# Request Flow

The complete request lifecycle is shown below.

```text
Intern Submission

↓

Module 4

↓

POST /review

↓

Validate Input

↓

Build Prompt

↓

AI Provider

↓

LLM

↓

Raw Response

↓

Parse Response

↓

Validate Schema

↓

Structured Review

↓

Module 4

↓

Database

↓

Frontend
```

---

# Current Scope (Version 1)

Version 1 assumes Module 3 receives already-readable project content.

Current inputs

* Work description
* Project code

Current outputs

* Intern review
* Manager summary

ZIP extraction is intentionally excluded from this version.

---

# Future Architecture

Future versions may introduce preprocessing before the AI review.

```text
ZIP Upload

↓

ZIP Extractor

↓

Project Analyzer

↓

Prompt Builder

↓

LLM

↓

Review
```

This keeps ZIP handling independent of the AI logic.

---

# AI Provider Abstraction

Module 3 should never directly depend on one AI service.

Instead, all providers implement a common interface.

```text
Application

↓

AIProvider Interface

├── GeminiProvider

├── SarvamProvider

├── OpenAIProvider

└── OllamaProvider
```

The application communicates only with the interface.

Changing providers should not require modifying business logic.

---

# Design Principles

The architecture follows several software engineering principles.

## Single Responsibility Principle

Each file performs one task only.

Examples

* Prompt Builder builds prompts.
* Parser parses responses.
* Provider communicates with AI.

---

## Loose Coupling

Modules interact through clearly defined APIs.

Each module can be developed independently.

---

## High Cohesion

Related functionality is grouped together.

Each component has a focused purpose.

---

## Replaceable AI Providers

The AI provider is abstracted.

Switching from a cloud model to a local model should require minimal changes.

---

## Schema-First Development

Pydantic models define the contracts before implementation.

This allows other modules to integrate early while Module 3 is still under development.

---

# Architecture Goals

The architecture is designed to achieve the following goals:

* Modular
* Maintainable
* Scalable
* Easy to test
* Provider-independent
* Easy to integrate
* Easy to extend
* Production-ready

Every component should remain independent so that future features—such as ZIP extraction, Git integration, multi-language support, or local LLMs—can be added without requiring major architectural changes.