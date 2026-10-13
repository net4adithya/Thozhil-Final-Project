---
name: Industrial Logic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  success-green: '#10B981'
  warning-amber: '#F59E0B'
  error-red: '#EF4444'
  surface-gray: '#F8FAFC'
  border-subtle: '#E2E8F0'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  button-text:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1280px
---

## Brand & Style
The design system is built for the high-stakes environment of engineering management. It avoids fleeting trends in favor of a **Modern Corporate** aesthetic—one that prioritizes clarity, structural integrity, and cognitive ease. The visual narrative is "Reliable Infrastructure."

The style is characterized by:
- **Pragmatic Precision:** Every element has a functional purpose; decorative flourishes are replaced by intentional spacing and clear information hierarchy.
- **Architectural Layouts:** A focus on grid-based organization that mirrors the structured nature of engineering workflows.
- **Industrial Sophistication:** A blend of high-utility components with a refined, professional finish that feels "built to last" rather than "disposable."

## Colors
This design system utilizes a "Deep Slate" primary palette to evoke stability and authority. 

- **Primary (#0F172A):** Used for primary navigation, headings, and high-impact actions. It provides a grounded, ink-like feel.
- **Secondary (#3B82F6):** A functional "Utility Blue" reserved for interactive elements, focus states, and progress indicators.
- **Neutrals:** A scale of cool grays (Slate) used to define hierarchy in text and background layering.
- **Functional Accents:** High-saturation semantic colors (Red, Green, Amber) are used strictly for status reporting and system feedback, ensuring they stand out against the sober primary palette.

## Typography
The typographic system uses a three-font strategy to differentiate between intent:
- **Headlines (IBM Plex Sans):** A grotesque sans-serif with subtle engineered details that reflect professional reliability.
- **Body (Inter):** Chosen for its exceptional legibility in data-dense interfaces and complex dashboards.
- **Technical/Labels (JetBrains Mono):** Used for metadata, ID tags, and status labels to acknowledge the developer-centric nature of the product.

**Rhythm:** Use tighter line-heights for labels and monospaced elements, and generous line-heights for body text to maintain readability during long-form reviews.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. Content is housed within a 12-column grid that scales up to 1280px, after which it centers with generous outer margins.

- **Vertical Rhythm:** Built on a 4px baseline grid. All component heights and padding should be multiples of 4 (e.g., 8, 16, 24, 32).
- **Component Padding:** Standardize on 16px for internal card padding and 12px for smaller list items.
- **Information Density:** For manager views, use "Relaxed" spacing (24px gaps). For developer IDE-like views, use "Compact" spacing (12px gaps).

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and crisp, directional shadows rather than heavy blurs.

- **Level 0 (Background):** The canvas uses `surface-gray` (#F8FAFC) to reduce eye strain.
- **Level 1 (Cards):** Pure white (#FFFFFF) with a 1px border of `border-subtle` (#E2E8F0).
- **Level 2 (Dropdowns/Modals):** A tight, low-opacity shadow (Color: #0F172A at 8% opacity, Offset: 4px, Blur: 12px) to signify interactivity without breaking the flat professional aesthetic.
- **Interaction:** Avoid "lifting" cards on hover. Instead, use a 1px border color change to `secondary-color` to indicate focus.

## Shapes
The shape language is **Soft (0.25rem / 4px)**. This radius is applied to buttons, input fields, and cards. 

This specific roundedness is chosen to soften the "industrial" feel just enough to feel modern, while maintaining a sharp, disciplined profile that suggests precision engineering. Circles (Pills) are reserved exclusively for status badges and tags to make them instantly distinguishable from interactive buttons.

## Components
- **Buttons:** Bold and solid. Primary buttons use the Deep Slate background with white text. Secondary buttons use a subtle gray stroke with no fill. Large 44px height for main actions; 32px height for secondary toolbar actions.
- **Inputs:** High-contrast borders (1px Slate-300). On focus, the border shifts to Blue-500 with a subtle 2px outer "halo" (no blur).
- **Cards:** The primary container. No heavy shadows; use a 1px border. Card headers should have a subtle bottom divider and use the `label-caps` typography for category titles.
- **Status Chips:** Use `JetBrains Mono`. Backgrounds should be highly desaturated versions of the semantic color (e.g., 10% opacity) with a solid 100% opacity text color for maximum legibility.
- **Data Tables:** Zebra-striping is discouraged. Use thin 1px horizontal dividers and highlight rows on hover with a 2% Slate tint.