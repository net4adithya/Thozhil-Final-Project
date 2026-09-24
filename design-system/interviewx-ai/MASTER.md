# InterviewX AI — Design System Master Specification

> **Single Source of Truth** for InterviewX AI.
> Built on principles of mature, human-designed enterprise software (Linear, Stripe, Ashby, Greenhouse).

---

## 1. Core Design Philosophy
- **Identity**: A serious, professional recruitment and assessment platform that happens to use AI.
- **Tone**: Calm, precise, trustworthy, human, and grounded.
- **Anti-Patterns Strictly Prohibited**:
  - ❌ Sci-fi reticle corners or HUD brackets
  - ❌ Neon accents and glowing orb animations
  - ❌ Rainbow gradient borders or gradient button fills
  - ❌ Translucent text overlapping navigation
  - ❌ Emojis as UI icons
  - ❌ Indiscriminate 24px/32px rounded bubbly cards
  - ❌ Technical jargon in user-facing UI (no STT, TTS, WebSocket, inference in candidate or recruiter views)

---

## 2. Color Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `Primary` | `#1D4ED8` | Primary actions, key focus rings, active states |
| `Primary Hover` | `#1E40AF` | Hover state for primary actions |
| `Primary Light` | `#EFF6FF` | Selected background tint, subtle highlights |
| `Background` | `#F8FAFC` | Page-level background |
| `Surface (Card)` | `#FFFFFF` | Core container surfaces |
| `Border` | `#E2E8F0` | Standard structural borders |
| `Border Subtle` | `#F1F5F9` | Dividers and table cell borders |
| `Text Heading` | `#0F172A` | High-contrast headings and primary labels |
| `Text Body` | `#334155` | Body copy and descriptions |
| `Text Muted` | `#64748B` | Metadata, timestamps, helper text |
| `Success` | `#16A34A` | Passed assessments, hire recommendations |
| `Warning` | `#D97706` | In-progress assessments, review required |
| `Danger` | `#DC2626` | Terminated sessions, violations, do not hire |

---

## 3. Typography Scale (Plus Jakarta Sans)

| Level | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | 24px (`text-2xl`) | 700 (Bold) | 1.25 | `-0.02em` | Page header |
| **Section Heading** | 16px (`text-base`) | 600 (Semibold) | 1.4 | `-0.01em` | Panel / section title |
| **Card Title** | 14px (`text-sm`) | 600 (Semibold) | 1.4 | `normal` | Subsections & table headers |
| **Body Text** | 13px (`text-xs` / `13px`)| 400 (Regular) | 1.5 | `normal` | General descriptions |
| **Caption / Meta** | 11px (`text-[11px]`) | 500 (Medium) | 1.4 | `0.01em` | Badges, timestamps, small tags |

---

## 4. Geometric & Surface Tokens
- **Border Radius**:
  - `rounded-sm` (6px): Form inputs, select dropdowns, search bars
  - `rounded-md` (8px): Action buttons, secondary buttons, tooltips
  - `rounded-xl` (12px): Standard cards, modal panels, table wrappers
  - `rounded-full` (9999px): Strictly for status badges, tags, and circular avatars
- **Shadows**:
  - `shadow-xs`: Buttons, form inputs, small chips
  - `shadow-sm`: Standard data cards, metric containers
  - `shadow-dropdown`: Popovers, floating menus
  - `shadow-modal`: Dialog windows

---

## 5. Component Standards
- **Buttons**:
  - Primary: Solid `#1D4ED8` background, white text, subtle hover darken. No gradients.
  - Secondary: White background, 1px `#CBD5E1` border, `#334155` text.
  - Danger: `#DC2626` background or border for destructive actions.
- **Tables**:
  - High information density, subtle `#F8FAFC` headers, 1px `#E2E8F0` cell borders, hover `#F8FAFC`.
- **Forms**:
  - Visible labels with `#334155` color, crisp `#E2E8F0` borders, `#1D4ED8` 2px focus ring.
- **Candidate Assessment Rooms**:
  - Human language only: *"Interviewer Speaking"*, *"Listening — Your Turn"*, *"Preparing next question"*, *"Connected"*.
  - Clean video containers without sci-fi HUD brackets.
