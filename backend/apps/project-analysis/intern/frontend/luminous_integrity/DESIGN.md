---
name: ReviewAI Vision
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#414755'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#5f5e60'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfe1'
  on-secondary-container: '#636264'
  tertiary: '#005f9c'
  on-tertiary: '#ffffff'
  tertiary-container: '#0079c3'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e4e2e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1b1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#d0e4ff'
  tertiary-fixed-dim: '#9bcbff'
  on-tertiary-fixed: '#001d34'
  on-tertiary-fixed-variant: '#004a7a'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  hero-gradient-start: '#007AFF'
  hero-gradient-end: '#4FACFE'
  surface-muted: '#F9FAFB'
  border-subtle: '#F3F4F6'
  text-blue-tint: '#EFF6FF'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 60px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  title-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1280px
  section-padding-y: 96px
  gutter: 32px
  card-padding: 40px
---

## Brand & Style
ReviewAI is a high-energy, educational SaaS platform designed to bridge the gap between junior developers and senior-level code quality. The brand personality is **optimistic, professional, and technologically advanced**. 

The design style is **Modern Corporate with Glassmorphic accents**. It leverages a vibrant blue-to-cyan gradient ("Hero Wave") to create dynamic movement, contrasted against a clean, white "Pro" workspace. The aesthetic emphasizes clarity and "career acceleration" through the use of soft organic blobs, floating 3D illustrations, and high-quality whitespace that makes complex technical information feel approachable.

## Colors
The palette is dominated by **Electric Blue (#007AFF)**, which serves as the primary action color and brand identifier. 

- **Primary Blue:** Used for key brand moments, primary CTAs, and decorative highlights.
- **Brand Dark:** A deep, near-black charcoal used for secondary buttons and primary text to provide high-contrast legibility.
- **Gradients:** A signature 135-degree linear gradient from Primary Blue to Sky Blue (#4FACFE) is used for hero sections and large-scale brand surfaces.
- **Functional Neutrals:** Pure White (#FFFFFF) is the primary surface color, supported by very light grey-blues for section backgrounds to maintain a "clean-room" feel.

## Typography
The system uses **Inter** exclusively to achieve a systematic, utilitarian, and modern "tech" feel. 

Hierarchy is established through extreme weight variance—moving from **ExtraBold (800)** for primary headlines to **Regular (400)** for long-form content. Display type uses tight tracking (-0.02em) to create a high-impact, editorial look. Body text should maintain a generous line height (1.5 - 1.6) to ensure technical descriptions remain readable.

## Layout & Spacing
The system follows a **Fixed Grid** approach for desktop, centered within a 1280px container. 

- **Section Spacing:** Generous vertical padding (96px) separates major narrative blocks, creating a sense of "breathing room" typical of premium SaaS landing pages.
- **Grid:** A standard 12-column grid is used, with cards typically spanning 4 columns (3-up layout) or 6 columns (2-up layout).
- **Mobile:** Margins shrink to 24px, and all multi-column layouts stack vertically. The hero section uses an elliptical clip-path to maintain brand identity even on narrow screens.

## Elevation & Depth
Elevation is primarily handled through **Extra-diffused Ambient Shadows** and **Tonal Layering**.

- **Cards:** Use a "Low-to-High" transition. Default cards have a very soft `shadow-sm` and a subtle 1px border (#F3F4F6). On hover, they lift using a `shadow-xl` (25px blur, 10% opacity) and a -5px Y-axis translation.
- **Floating Elements:** Decorative blobs and 3D illustrations use zero shadow but rely on z-index and opacity (5-10%) to sit "behind" the UI layer.
- **Interactive Surfaces:** Buttons use `shadow-lg` to appear tactile and "pressable" against the flat background.

## Shapes
The shape language is defined by **large radii and pill-shaped interactive elements**.

- **Primary Buttons:** Always use `rounded-full` (pill shape) to emphasize a friendly, modern approachable feel.
- **Containers/Cards:** Use `rounded-2xl` (1.5rem / 24px) to soften the technical nature of the content.
- **Logo/Accents:** Small accent blocks (like the "AI" tag) use a tighter `rounded` (0.25rem - 0.5rem) to differentiate brand marks from UI containers.

## Components

### Buttons
- **Primary:** White background with Brand Blue text or Brand Dark background with White text. Always pill-shaped with bold typography.
- **Hover State:** Subtle scale-up (105%) and increased shadow depth.

### Feature Cards
- **Structure:** 40px internal padding, centered icon or illustration, followed by a Title-LG and Body-MD text.
- **Style:** White surface, subtle grey border, smooth transition on all properties.

### Input Fields
- **Newsletter Style:** Pill-shaped with semi-transparent backgrounds (White at 20% opacity) and white borders. Text is always high-contrast against the gradient footer.

### Decorative Elements
- **Wave Shapes:** Use large elliptical clip-paths to transition between the high-energy hero and the clean white content sections.
- **Status Indicators:** Use a simple blue line (4px height) to underline section headers, reinforcing the "precision" brand pillar.