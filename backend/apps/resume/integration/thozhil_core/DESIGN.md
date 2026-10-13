---
name: Thozhil Core
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414754'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc0'
  primary: '#0059bb'
  on-primary: '#ffffff'
  primary-container: '#0070ea'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc7ff'
  secondary: '#00668a'
  on-secondary: '#ffffff'
  secondary-container: '#40c2fd'
  on-secondary-container: '#004d6a'
  tertiary: '#5c5c5c'
  on-tertiary: '#ffffff'
  tertiary-container: '#747474'
  on-tertiary-container: '#fcfcfc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7cd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  h1-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  stats-number:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

The design system is anchored in **Professional Minimalism** and **Analytical Clarity**. It is designed for high-stakes recruitment environments where data density must coexist with ease of use. The aesthetic rejects decorative flourishes in favor of structural integrity and utilitarian elegance.

The brand personality is authoritative yet accessible, positioning the platform as a reliable partner in human capital management. The UI avoids "tech-hype" tropes, focusing instead on high-contrast information displays, structured reporting modules, and a calm, white-space-heavy environment that reduces cognitive load during intensive screening tasks.

## Colors

The palette is functional and high-contrast. 
- **Primary Blue** is used for critical actions and primary navigation, symbolizing trust and professional stability.
- **Secondary Light Blue** serves as a supportive accent for interactive states, hover effects, and category tagging.
- **Tertiary Black** is reserved for high-level typography and primary iconography to ensure maximum legibility.
- **Neutral Light Gray** defines the canvas, providing a soft background that allows white surface cards to pop with subtle elevation. 

Avoid using gradients. Use solid fills to maintain a clean, analytical feel. For data visualization, use a scale of the primary blue combined with neutral grays to ensure reports remain professional and "sober."

## Typography

This design system uses **Inter** exclusively to leverage its exceptional legibility and systematic feel. 

- **Hierarchy:** Use bold weights for headers to create clear entry points in data-heavy screens.
- **Micro-copy:** Labels and captions should use the `label-md` style with increased letter spacing for clarity in small formats.
- **Analytical Data:** For recruitment metrics and reporting numbers, use the `stats-number` style to emphasize key performance indicators.
- **Consistency:** Maintain strict adherence to the line-height tokens to ensure vertical rhythm is preserved in multi-column layouts.

## Layout & Spacing

The design system employs a **12-column fixed-grid** for desktop to ensure structured analysis layouts, transitioning to a fluid single-column for mobile. 

- **The 4px Rule:** All spacing between elements must be a multiple of 4px.
- **Horizontal Rhythm:** Use 24px gutters between dashboard widgets and report cards.
- **Content Density:** In data tables, use a 12px vertical padding (compact) to maximize visible records, while using 40px (xl) padding for landing pages and marketing sections to emphasize "breathing room."
- **Dashboard Layout:** Standardize on a 280px fixed left sidebar for navigation with a fluid main content area.

## Elevation & Depth

This design system utilizes **Tonal Layering** supplemented by **Low-contrast Outlines**. 

- **Surfaces:** The base background is `#F8F9FA`. Primary content containers (cards) are white `#FFFFFF`.
- **Borders:** Use 1px solid borders in `#E9ECEF` for all cards and containers. This provides a "blueprint" feel that is more structured than using shadows alone.
- **Shadows:** Use a single, extremely subtle ambient shadow for active or "hovered" states: `0px 4px 12px rgba(0, 0, 0, 0.05)`. 
- **Interactive Depth:** When an element is pressed, it should remove its shadow and slightly darken the border color to simulate a physical "push" into the page.

## Shapes

The shape language is **Moderate and Rounded**, balancing professional rigidity with modern approachability. 

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) corner radius.
- **Large Containers:** Dashboard panels and main content wrappers use 1rem (16px) for a softer, more modern structural feel.
- **Interactive Details:** Checkboxes should maintain a small 2px radius to remain crisp, while avatars should always be perfectly circular to contrast against the geometric grid.

## Components

### Buttons
- **Primary:** Solid `#007BFF` fill with white text. 8px radius. No gradient.
- **Secondary:** Solid `#F8F9FA` fill with `#007BFF` text and 1px border.
- **Ghost:** No fill, Primary Blue text. Used for less frequent actions like "Cancel."

### Input Fields
- White background with a 1px `#E9ECEF` border. 
- On focus: Border changes to `#3ABEF9` with a subtle 2px outer glow of the same color (20% opacity).

### Cards
- Always white background.
- 1px border is mandatory.
- Use a "Header" section within cards with a light gray bottom border to separate titles from body content.

### Recruitment Specific Components
- **Status Chips:** Use a light-tinted background (10% opacity) of the semantic color (e.g., green for "Hired") with a dark-tone text of the same hue.
- **Data Tables:** Zebra striping is discouraged; use subtle horizontal dividers only. Header row should be `#F8F9FA` with uppercase `label-md` typography.
- **Candidate Progress Bar:** Use a segmented bar (Primary Blue for completed, Neutral for remaining) rather than a smooth gradient bar to emphasize discrete stages of the recruitment funnel.