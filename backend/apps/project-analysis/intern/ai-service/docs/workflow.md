# Workflow Documentation

# AI-Powered Intern Review System

---

# Purpose

This document explains the complete workflow of the AI-Powered Intern Review System.

It describes how information flows through the system, how each module interacts with the others, and what happens from the moment a manager creates a task until the AI review reaches both the intern and the manager.

This document focuses on **process flow**, not implementation details.

---

# Overall Workflow

The system consists of two primary users:

* **Manager (Authority)**
* **Intern**

The manager defines the work.

The intern completes the work.

The AI evaluates the work.

The manager receives a concise progress summary.

---

# High-Level Workflow

```text
Manager Creates Work Description
            │
            ▼
Work Description Stored
            │
            ▼
Intern Completes Assigned Task
            │
            ▼
Intern Submits Project
            │
            ▼
AI Review Triggered
            │
            ▼
AI Reviews Project
            │
            ▼
AI Generates Results
       │               │
       ▼               ▼
Intern Feedback   Manager Summary
```

---

# Complete System Workflow

## Step 1 — Manager Creates Work Description

The manager creates the assignment for the intern.

Example

```text
Build a Login Authentication System.

Requirements

- Login API
- Signup API
- JWT Authentication
- Password Hashing
```

The work description becomes the reference document for evaluation.

---

## Step 2 — Store Work Description

Module 1 stores the work description in the existing system.

The AI is **not involved** in this step.

---

## Step 3 — Intern Works on the Project

The intern develops the assigned feature.

Example

```text
Authentication Module

auth.py

login()

signup()

jwt.py
```

---

## Step 4 — Intern Submits Work

The intern submits the completed work.

For Version 1 of this project, Module 3 assumes it receives readable project code.

Future versions may support ZIP uploads and automatic code extraction.

---

## Step 5 — AI Review Is Triggered

Module 4 detects a new submission.

Module 4 sends a request to Module 3.

Example request

```json
{
  "work_description": "...",
  "project_code": "..."
}
```

At this point, Module 3 begins processing.

---

# Module 3 Workflow

Module 3 is responsible only for AI-based evaluation.

---

## Step 6 — Validate Input

The request is validated before contacting the AI.

Checks include:

* Work description exists.
* Project code exists.
* Request format is valid.

If validation fails, an error is returned immediately.

---

## Step 7 — Build AI Prompt

The Prompt Builder prepares a structured prompt.

The prompt includes:

* Work description
* Submitted code
* Review instructions
* Expected JSON format

The Prompt Builder does **not** communicate with the AI.

Its only responsibility is prompt construction.

---

## Step 8 — Call AI Provider

The AI Provider receives the prompt.

It sends the prompt to the configured LLM.

Possible providers include:

* Gemini
* Sarvam AI
* OpenAI

Future providers:

* Ollama
* Local LLMs

The provider returns the raw AI response.

---

## Step 9 — Parse AI Response

The parser processes the raw response.

Responsibilities include:

* Remove markdown formatting (if present).
* Extract JSON.
* Validate JSON syntax.
* Convert JSON into application models.

If parsing fails, an error is returned for handling by Module 4.

---

## Step 10 — Validate Output

The parsed response is validated using the application's data models.

Checks include:

* Required fields exist.
* Data types are correct.
* Values fall within expected ranges (for example, scores between 0 and 100).

Only validated responses continue.

---

## Step 11 — Return Structured Review

Module 3 returns structured review data.

Example

```json
{
  "intern_review": {
    "score": 88,
    "feedback": "...",
    "strengths": [],
    "missing": [],
    "suggestions": []
  },
  "manager_summary": {
    "overall_score": 88,
    "summary": "..."
  }
}
```

Module 3's work is complete at this point.

---

# Module 4 Workflow

Module 4 receives the structured review.

Responsibilities include:

* Store review results.
* Associate review with the correct intern.
* Associate review with the correct project.
* Make review available to the frontend.

---

# Intern Workflow

The intern opens the dashboard.

The frontend retrieves the stored review.

The intern sees:

* Overall score
* Detailed feedback
* Strengths
* Missing features
* Suggested improvements

The intern uses this feedback to improve the project before the manager performs a final review.

---

# Manager Workflow

The manager views a simplified dashboard.

Instead of detailed AI output, the manager receives:

* Overall progress score
* Short summary
* Key observations

This allows the manager to quickly identify interns who may need additional support.

---

# End-to-End Sequence Diagram

```text
Manager
    │
    │ Create Work Description
    ▼
Module 1
    │
    ▼
Database
    │
    ▼
Intern
    │
    │ Submit Project
    ▼
Module 4
    │
    ▼
Module 3
    │
    ├── Validate Request
    ├── Build Prompt
    ├── Call AI
    ├── Parse Response
    └── Build Structured Output
    │
    ▼
Module 4
    │
    ├── Store Results
    ├── Notify Frontend
    │
    ▼
Frontend
    ├── Intern Dashboard
    └── Manager Dashboard
```

---

# Error Handling Workflow

If an error occurs at any stage, the workflow should stop gracefully.

Examples include:

### Invalid Request

Return a validation error.

---

### AI Provider Timeout

Return a service unavailable error.

---

### Invalid AI Response

Return a parsing error.

---

### Empty Project Code

Return an input validation error.

---

### Missing Work Description

Return an input validation error.

---

# Current Version Scope

Version 1 includes:

* Work description input
* Project code input
* AI evaluation
* Intern review generation
* Manager summary generation

Version 1 does **not** include:

* ZIP extraction
* Git repository analysis
* Incremental reviews
* Voice feedback
* Background processing

---

# Future Workflow Enhancements

Future versions may extend the workflow as follows:

```text
Intern Uploads ZIP
        │
        ▼
ZIP Extraction
        │
        ▼
Project Analysis
        │
        ▼
AI Review
        │
        ▼
Generate Review
```

Other future enhancements include:

* Reviewing only changed files (Git diff).
* Multiple review iterations.
* Review history and trend analysis.
* Team-level analytics.
* Voice feedback using Text-to-Speech.
* Security and performance-specific review modes.

---

# Workflow Design Principles

The workflow is designed with the following principles:

* Clear separation of responsibilities between modules.
* AI processing isolated within Module 3.
* Structured communication using defined request and response models.
* Independent modules that can be developed and tested in parallel.
* Easy integration with different AI providers.
* Scalable workflow for future enhancements without major architectural changes.

The goal is to create a maintainable and extensible AI review pipeline that provides immediate, actionable feedback to interns while giving managers concise visibility into project progress.