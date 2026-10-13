# THOZHIL — Authentication Bridge Architecture Document

**Date:** 2026-09-30  
**Authentication Strategy:** Non-destructive Adaptors & Header Propagation  

---

## 1. Authentication Bridge Concept

The Admin Shell owns the primary **Admin Session** (`/api/auth/login` and `/api/auth/session`).

Instead of destroying working authentication in individual applications, the **Authentication Bridge** intercepts proxied requests and injects the header credentials expected by each module:

```
THOZHIL ADMIN SESSION
       │
       ├── Resume Auth Adaptor   ──> Public / No Auth required
       ├── Interview Auth Adaptor──> Injects `x-user-role: recruiter`, `x-user-id: admin-001`
       ├── Project Auth Adaptor  ──> Injects `authorityId: manager-001`
       └── Coding Auth Adaptor   ──> Candidate Access Codes (`accessCode`) preserved for interns
```

---

## 2. Admin vs. Intern Authorization Scoping

- **Admin Role:** Full administrative access to Dashboard, Intern Directory, Hiring Decisions, Resume screening, Video Interview reports, Manager risk summaries, and Question Bank creation.
- **Intern Role:** Candidate access codes for coding assessments are strictly preserved. Candidates enter access codes to launch Monaco IDE workspaces without gaining administrative rights.

---

## 3. Secret Protection Standard

- Server secrets (`GEMINI_API_KEY`, `JWT_SECRET`, database connection passwords, Supabase service-role keys) are managed on backend processes only.
- Zero server secrets are exposed in browser Vite environment variables or client-side bundles.
