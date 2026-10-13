# Module 3 – AI Reviewer Engine

## Project

**AI-Powered Intern Review System**

---

# Table of Contents

1. Project Overview
2. Problem Statement
3. Proposed Solution
4. System Workflow
5. Project Architecture
6. Module Breakdown
7. Module 3 Overview
8. Responsibilities
9. Scope
10. Non-Scope
11. Functional Requirements
12. Inputs
13. Outputs
14. Internal Workflow
15. API Contract
16. Project Structure
17. Development Phases
18. Coding Standards
19. Future Improvements
20. Notes for AI Coding Assistants

---

# 1. Project Overview

This project is an AI-powered add-on for an existing internship management system.

The purpose of this add-on is to automate the first level of code review for interns.

Instead of a manager manually reviewing every submission from multiple interns, the AI performs an initial review, provides detailed feedback to the intern, and generates a concise summary for the manager.

The AI is **not intended to replace the manager**. Its purpose is to reduce repetitive review work and provide faster feedback so managers can focus on mentoring and decision-making.

---

# 2. Problem Statement

Consider a company with:

* 1 Manager
* 7 Interns

Every intern regularly submits work.

The manager is responsible for:

* Reviewing code
* Checking whether the assigned task has been completed
* Finding implementation mistakes
* Providing feedback
* Tracking intern progress

As the number of interns grows, manual reviews become time-consuming and inconsistent.

Interns may wait hours or days for feedback.

Managers spend a significant amount of time reviewing similar issues repeatedly.

---

# 3. Proposed Solution

Introduce an AI Reviewer into the workflow.

Instead of directly waiting for the manager,

the intern submits work to the AI.

The AI:

* Reads the assigned work description.
* Reads the submitted project/code.
* Evaluates how closely the implementation matches the assigned work.
* Reviews implementation quality.
* Finds missing or incomplete features.
* Suggests improvements.
* Generates a concise manager summary.

This enables interns to receive immediate feedback while reducing the manager's workload.

---

# 4. Overall Workflow

Manager creates Work Description

↓

System stores Work Description

↓

Intern submits project

↓

AI Reviewer Engine (Module 3)

↓

AI analyzes submission

↓

Detailed Feedback → Intern

↓

Summary → Manager

---

# 5. Project Architecture

The project is divided into four modules.

## Module 1 – Data & Integration Layer

Responsibilities

* Integrate with the existing system
* Database operations
* Store work descriptions
* Store intern submissions
* Provide APIs for other modules

---

## Module 2 – User Interface

Responsibilities

Manager

* Create/Edit work descriptions
* View intern summaries

Intern

* Submit project
* View AI review
* View suggestions

---

## Module 3 – AI Reviewer Engine

This is the intelligence layer of the project.

It analyzes the submitted work using a Large Language Model (LLM).

This repository implements Module 3.

---

## Module 4 – Orchestration Layer

Responsibilities

* Connect all modules
* Trigger AI review
* Store AI results
* Send results to frontend
* Handle overall workflow

---

# 6. Module 3 Overview

Module 3 is an independent AI service.

It receives:

* Work Description
* Project Code

It returns:

* Intern Review
* Manager Summary

Module 3 does not interact directly with the database or frontend.

Its only responsibility is AI-based evaluation.

---

# 7. Primary Goal of Module 3

Given:

* Work Description
* Submitted Code

The AI should answer:

* Did the intern complete the assigned task?
* Is the implementation relevant?
* Is the implementation technically correct?
* What mistakes exist?
* What improvements are recommended?
* What should the manager know?

---

# 8. Responsibilities

Module 3 is responsible for:

* Building AI prompts
* Calling the selected LLM
* Receiving AI responses
* Parsing responses
* Validating outputs
* Returning structured review data

---

# 9. Out of Scope

Module 3 does NOT handle:

* User Interface
* Login
* Authentication
* Database
* Existing system integration
* Automatic triggers
* File uploads
* ZIP extraction (Version 1)

These are handled by other modules.

---

# 10. Current Scope (Version 1)

For Version 1,

assume Module 3 receives:

* Work Description
* Extracted project code

ZIP extraction will be implemented later if required.

---

# 11. Functional Requirements

The AI should be capable of:

## Requirement 1

Compare submitted work with assigned work.

---

## Requirement 2

Determine overall relevance.

---

## Requirement 3

Identify completed features.

---

## Requirement 4

Identify missing functionality.

---

## Requirement 5

Review implementation quality.

Examples include:

* Poor practices
* Missing validation
* Security concerns
* Code organization
* Maintainability

---

## Requirement 6

Provide constructive suggestions.

Feedback should be educational.

Never insulting.

Never overly harsh.

---

## Requirement 7

Generate manager summary.

Managers should receive concise information.

Interns receive detailed information.

---

# 12. Inputs

Module 3 currently expects:

ReviewRequest

Fields

work_description

String

Describes what the intern was assigned.

project_code

String

Contains the project code or extracted source code.

---

# 13. Outputs

Module 3 returns:

InternReview

Contains

* Score
* Feedback
* Strengths
* Missing Features
* Suggestions

ManagerSummary

Contains

* Overall Score
* Short Summary

---

# 14. Internal Workflow

Request

↓

Validate Request

↓

Build Prompt

↓

Call AI Provider

↓

Receive Response

↓

Parse JSON

↓

Validate Schema

↓

Return Structured Response

---

# 15. AI Review Philosophy

The AI should review like a senior developer mentoring an intern.

The AI should:

* Be constructive
* Encourage learning
* Explain mistakes
* Suggest improvements
* Avoid unnecessary criticism

The AI should NOT:

* Insult
* Assume missing information
* Invent project features
* Return unstructured responses

---

# 16. AI Provider Design

The project should never directly depend on one provider.

Instead,

AIProvider Interface

↓

Gemini

↓

OpenAI

↓

Sarvam AI

↓

Ollama

↓

Future Providers

All providers must expose the same interface.

This allows switching providers without modifying business logic.

---

# 17. Expected Response Format

The AI should always return structured JSON.

Example

{
"score": 90,
"feedback": "...",
"strengths": [],
"missing": [],
"suggestions": [],
"manager_summary": {
"overall_score": 90,
"summary": "..."
}
}

No markdown.

No extra commentary.

No explanations outside JSON.

---

# 18. Project Structure

module3/

app.py

routes.py

prompt_builder.py

ai_provider.py

parser.py

models.py

config.py

README.md

requirements.txt

.env

---

# 19. File Responsibilities

app.py

Creates FastAPI application.

Loads routers.

Application entry point.

---

routes.py

Defines API endpoints.

Receives requests.

Returns responses.

---

prompt_builder.py

Constructs prompts.

Contains prompt templates.

No API logic.

---

ai_provider.py

Communicates with LLM providers.

Implements provider abstraction.

Responsible only for AI communication.

---

parser.py

Receives raw AI output.

Extracts JSON.

Validates schema.

Handles malformed responses.

---

models.py

Contains all Pydantic models.

Defines API contracts.

Used by all other modules.

---

config.py

Loads:

* Environment variables
* API Keys
* Model configuration
* Provider configuration

---

# 20. Development Phases

Phase 0

Setup

↓

Phase 1

Pydantic Models

↓

Phase 2

AI Provider

↓

Phase 3

Prompt Builder

↓

Phase 4

Parser

↓

Phase 5

FastAPI Endpoint

↓

Phase 6

Testing

↓

Phase 7

Integration

---

# 21. Coding Standards

General Guidelines

* Keep functions small and focused.
* Follow single responsibility principle.
* Avoid duplicated logic.
* Use type hints.
* Use descriptive variable names.
* Keep prompts separate from business logic.
* Validate every AI response.
* Never trust raw LLM output directly.

---

# 22. Error Handling

The module should gracefully handle:

* Invalid requests
* Empty code
* Empty work description
* AI timeout
* Invalid JSON
* API failures
* Rate limiting

The API should return meaningful error messages instead of crashing.

---

# 23. Notes for AI Coding Assistants (Antigravity)

When implementing this project:

* Respect the responsibility of each file.
* Do not move logic between files unnecessarily.
* Maintain the AI provider abstraction.
* Keep prompt generation separate from API communication.
* Ensure all responses conform to the Pydantic models.
* Do not introduce unrelated features outside Module 3.
* Assume ZIP extraction is out of scope for Version 1.
* Keep the code modular, testable, and easy to replace with another AI provider in the future.

The objective is to build a clean, maintainable AI Review Engine that integrates easily with the other project modules while remaining independent of the frontend, database, and orchestration layers.
