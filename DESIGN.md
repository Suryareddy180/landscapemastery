---
name: Mastery Narrative
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#404944'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#5e5f56'
  on-secondary: '#ffffff'
  secondary-container: '#e4e3d7'
  on-secondary-container: '#64655c'
  tertiary: '#2c2e2e'
  on-tertiary: '#ffffff'
  tertiary-container: '#424445'
  on-tertiary-container: '#b0b1b1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#e4e3d7'
  secondary-fixed-dim: '#c7c7bc'
  on-secondary-fixed: '#1b1c15'
  on-secondary-fixed-variant: '#46473f'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  card-padding: 32px
---

## Brand & Style

This design system embodies a premium, editorial aesthetic tailored for high-end landscape architecture and environmental design. The brand personality is authoritative yet serene, balancing the raw strength of nature with the precise hand of human mastery. 

The style utilizes a **Modern-Minimalist** approach with a **Bento Box** modular grid. It prioritizes clarity, generous whitespace, and a high-contrast relationship between deep greens and warm neutrals. The emotional goal is to evoke a sense of "quiet luxury" and organized inspiration, steering clear of fleeting trends in favor of timeless, structured layouts.

## Colors

The palette is rooted in organic tones that reflect professional landscape environments. 

- **Primary (Forest Green):** Reserved exclusively for high-priority Call to Actions (CTAs) and active states. It represents growth and precision.
- **Secondary (Warm Ivory):** The primary background surface, providing a softer, more sophisticated alternative to pure white.
- **Tertiary (Alabaster):** Used for subtle sectioning or secondary background layers to create depth without relying on shadows.
- **Neutral (Deep Charcoal):** Applied to all typography and iconography to ensure maximum legibility and an authoritative tone.
- **Surface (White):** Pure #FFFFFF is used only for the modular cards to make them pop against the Ivory/Alabaster backgrounds.

## Typography

The typographic system pairs the geometric confidence of Montserrat for headings with the systematic clarity of Inter for body text.

- **Headlines:** Use Montserrat with tighter letter-spacing for a bold, architectural feel. 
- **Body:** Use Inter for all long-form content to ensure a neutral, professional reading experience.
- **Labels:** Use uppercase Inter with increased tracking for metadata, categories, and small utility text.
- **Hierarchy:** Maintain a clear distinction between levels; display text should feel significantly more "weighty" than the functional body text.

## Layout & Spacing

This design system uses a **Bento Box (Modular Grid)** philosophy. Content is organized into distinct rectangular cells that maintain a strict horizontal and vertical alignment.

- **Grid:** A 12-column system for desktop, collapsing to 1 column for mobile.
- **Bento Cells:** Individual modules should have varying aspect ratios (e.g., 1x1, 2x1, 2x2) but must share a consistent 24px gutter.
- **Responsiveness:** On tablet, cells should reflow to a 2-column or 6-column grid. On mobile, all modules stack vertically with reduced horizontal margins.
- **Rhythm:** Use an 8px base unit for all internal component spacing to maintain mathematical consistency.

## Elevation & Depth

Depth is achieved through a combination of **Tonal Layering** and **Subtle Shadows**. 

1.  **Background Layer:** Warm Ivory (#FDFCF0).
2.  **Card Layer:** Pure White (#FFFFFF) elevated modules.
3.  **Shadows:** Use extremely soft, diffused shadows (Blur: 30px, Opacity: 4%, Color: Deep Charcoal) to make cards appear to lift off the surface gently.
4.  **Borders:** Each card features a 1px solid border in Alabaster (#F7F7F7) to provide definition where shadows are too faint to be seen. 

Avoid any heavy shadows or dark gradients. The elevation should feel airy and natural.

## Shapes

The shape language is "Softly Geometric." 

- **Cards:** Use `rounded-lg` (16px / 1rem) for all main bento containers to balance the rigid grid with a touch of organic softness.
- **Buttons:** Use `rounded-lg` for standard actions, or full `rounded-xl` for tags/chips.
- **Images:** Must follow the container's corner radius. Media should be clipped precisely to the card boundaries.

## Components

### Buttons
- **Primary:** Forest Green background, White text. No border. On hover, darken the green slightly.
- **Secondary:** Transparent background, Deep Charcoal border (1px), Deep Charcoal text.
- **Interaction:** Apply a spring-based scale effect (scale: 0.98) on click/active states.

### Bento Cards
- White background with the defined elevation (soft shadow + thin border).
- Internal padding of 32px.
- Transitions: Use a staggered entrance animation (Fade-in + Slide-up) with a spring duration of 0.6s and a damping ratio of 0.8.

### Input Fields
- Subtle Alabaster background with a bottom-only border in Deep Charcoal (2px) to mimic architectural sketches.
- Focused state: Border changes to Forest Green.

### Chips & Tags
- Used for "Mastery Level" or "Category." Small font size, uppercase, with a very light tint of the Primary color as a background (e.g., Forest Green at 5% opacity).

### Navigation
- Minimalist top bar. Links are Deep Charcoal with a Forest Green underline that expands from the center on hover.
