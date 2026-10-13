# THOZHIL — Admin Shell Architecture Document

**Date:** 2026-09-30  
**Application Path:** `apps/admin-shell`  
**Dev Port:** `3000`  
**Build Status:** Verified (`SUCCESS`)  

---

## 1. Executive Summary & Core Purpose

The **Thozhil Admin Shell** is an **orchestrator** application designed to provide a unified administrative interface across the platform suite.

### Key Architectural Constraint:
> **The Admin Shell is an ORCHESTRATOR — NOT a replacement or rewrite of the four underlying applications.**

It does **NOT** copy or duplicate business logic, components, APIs, databases, or authentication mechanisms from any of the four standalone applications (Project A, Project B, Project C, or Project D).

---

## 2. Shell Responsibilities

The Admin Shell is strictly scoped to the following 7 core responsibilities:

1. **Admin Authentication Indicator:** Shows current administrative session validation state.
2. **Admin Session Management:** Maintains persistent admin state across module switches.
3. **Unified Navigation Sidebar:** Fixed left-hand navigation panel for seamless module switching.
4. **Platform Dashboard:** High-level platform metrics, module health status, and quick-launch cards.
5. **Intern Details Directory:** Centralized candidate overview (`/interns`) and individual intern assessment view (`/interns/:id`).
6. **Module Navigation:** Client-side routing across module routes without page reloads.
7. **Single-Tab Module Mounting & Launching:** Embedded `<ModuleFrame>` container launching each target app at its dedicated port in the **SAME browser tab**.

---

## 3. Sidebar Navigation Specification

The sidebar is fixed on the left and contains **exactly** the following 6 navigation items:

| # | Sidebar Label | Route | Icon | Action / Mounted Target |
|---|---|---|---|---|
| 1 | **Dashboard** | `/dashboard` | `LayoutDashboard` | High-level system overview & module status |
| 2 | **AI Resume Screener** | `/resume` | `FileText` | Mounts Project B (`http://localhost:5020`) |
| 3 | **AI Video Interviewer** | `/interview` | `Video` | Mounts Project A (`http://localhost:5011`) |
| 4 | **AI Project Analyser** | `/project-analysis` | `FolderKanban` | Mounts Project C (`http://localhost:5032`) |
| 5 | **AI Coding Interviewer** | `/coding` | `Code` | Mounts Project D (`http://localhost:5041`) |
| 6 | **Intern Details** | `/interns` | `Users` | Candidate directory & cross-module evaluation cards |

---

## 4. Single-Tab Browser Navigation Guarantee

### **Strict Anti-Patterns Prohibited & Enforced:**
- ❌ **No `window.open()`**
- ❌ **No `target="_blank"`**
- ❌ **No external browser windows or tabs**

All navigation occurs entirely within the **same single browser window/tab** using client-side React Router DOM navigation. Module views are rendered directly in the main content canvas using the non-invasive `<ModuleFrame>` launcher.

---

## 5. Shell Route Mapping

The Admin Shell implements the following clean route hierarchy:

```
/                             -> Redirects to /dashboard
/dashboard                    -> DashboardPage (Platform Overview)
/resume                       -> ResumeModulePage (Mounts http://localhost:5020)
/interview                    -> InterviewModulePage (Mounts http://localhost:5011)
/project-analysis             -> ProjectAnalysisModulePage (Mounts http://localhost:5032)
/coding                       -> CodingModulePage (Mounts http://localhost:5041)
/interns                      -> InternsListPage (Candidate Directory)
/interns/:id                  -> InternDetailPage (Detailed Candidate Profile)
```

---

## 6. Technical Implementation Details

- **Technology Stack:** React 18, TypeScript, Vite 5, React Router DOM 6, Tailwind CSS.
- **Standalone Build:** Compiles cleanly via `npx nx build admin-shell` (Output: `apps/admin-shell/dist`).
- **Icon System:** Self-contained SVG icon system (`src/components/Icons.tsx`), eliminating third-party UI package dependencies.
- **Module Health Monitor:** Automatically pings each target app port (`5020`, `5011`, `5032`, `5041`) and renders live status badges.
- **Zero Impact on Original Apps:** None of the four original applications were modified during shell creation.
