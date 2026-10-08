---
name: Tactile Clay
colors:
  surface: '#f6faff'
  surface-dim: '#d5dbe2'
  surface-bright: '#f6faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4fb'
  surface-container: '#e8eef5'
  surface-container-high: '#e3e9f0'
  surface-container-highest: '#dde3ea'
  on-surface: '#161c21'
  on-surface-variant: '#584140'
  inverse-surface: '#2b3136'
  inverse-on-surface: '#ebf1f8'
  outline: '#8c706f'
  outline-variant: '#e0bfbd'
  surface-tint: '#ae2f34'
  primary: '#ae2f34'
  on-primary: '#ffffff'
  primary-container: '#ff6b6b'
  on-primary-container: '#6d0010'
  inverse-primary: '#ffb3b0'
  secondary: '#006a65'
  on-secondary: '#ffffff'
  secondary-container: '#79f3ea'
  on-secondary-container: '#006f69'
  tertiary: '#4950c7'
  on-tertiary: '#ffffff'
  tertiary-container: '#8a91ff'
  on-tertiary-container: '#171a9c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b0'
  on-primary-fixed: '#410006'
  on-primary-fixed-variant: '#8c1520'
  secondary-fixed: '#7cf6ec'
  secondary-fixed-dim: '#5dd9d0'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#00504c'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bfc2ff'
  on-tertiary-fixed: '#02006d'
  on-tertiary-fixed-variant: '#3035af'
  background: '#f6faff'
  on-background: '#161c21'
  surface-variant: '#dde3ea'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.015em
  headline-xl:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-xl-mobile:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: 0em
  body-lg:
    fontFamily: Outfit
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Outfit
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Outfit
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Outfit
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1.25rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 2rem
  space-xl: 3rem
---

## Brand & Style

This design system expresses a high-touch, tactile, physical aesthetic through the language of refined Claymorphism. It mimics sculptable, matte plasticine, soft rubber, and volumetric shapes floating over a pillowy canvas. The design targets modern consumer applications, creative platforms, modern fintech, and interactive tools that demand an inviting, touch-friendly, and optimistic tone.

The visual style departs from flat, sterile interfaces by rendering UI elements as inflated volumetric bodies. Highlights simulate soft top-left key lighting, dual outer shadows ground elements with ambient diffusion, and subtle inner dark bevels establish physical edge curvature. The interface feels friendly, tactile, and responsive—like physical tokens on a smooth matte desk.

## Colors

The palette balances a warm, tinted ceramic backdrop with saturated, playful candy tones. Surfaces never use pure `#FFFFFF` as a full container fill; instead, light enters via specular inner lighting tokens while the canvas remains a tinted pale slate-blue clay tone (`#E8EEF5`).

- **Canvas & Neutral Foundation**: `#E8EEF5` serves as the global canvas background. Neutral elevated surfaces use `#F0F4F9` with dark ambient shadows (`rgba(70, 90, 120, 0.14)`) and crisp bounce highlights (`rgba(255, 255, 255, 0.9)`). Text neutrals step from deep matte charcoal `#1E2530` for high contrast down to `#68778D` for subtext.
- **Primary (Clay Coral - `#FF6B6B`)**: Used for primary action buttons, destructive or critical highlights, and focal interactive cards.
- **Secondary (Tech Turquoise - `#4ECDC4`)**: Expresses freshness, success indicators, toggle states, and affirmative interactive controls.
- **Tertiary (Lavender Blue - `#7C83FD`)**: Applied to badges, secondary tools, navigational accents, and category tags.
- **Supporting Candies**: Honey Amber (`#FFB347`) for warnings/star ratings, and Fresh Mint (`#69E781`) for micro-affirmations.

## Typography

The typography leverages Outfit to achieve geometric balance, rounded terminal details, and wide open counters that echo the inflated forms of the components. 

- **Weight Discipline**: Reserve `700` (Bold) for displays, main metrics, and pill-button labels to counterweight the heavy 3D shadow depths. Body copy uses `400` (Regular) and `500` (Medium) to maintain clarity against soft clay surface elevations.
- **Rhythm & Line Heights**: Headings maintain tight line-height ratios (1.15 to 1.25) to read as cohesive visual stamps. Body text retains generous leading (1.45 to 1.55) to prevent eye fatigue over tinted clay backdrops.

## Layout & Spacing

Because claymorphic elements utilize extended drop shadows (up to 20px blur and offsets), layout boundaries require generous internal padding and clearance to prevent clipping and visual clutter.

- **Grid Architecture**: 12-column fluid grid on desktop (max-width `1280px`), adapting to 6 columns on tablet and 4 columns on mobile.
- **Padding Protocol**: Containers must feature internal padding (`space-md` or `space-lg`) that matches or exceeds their border radius to prevent nested text from encroaching on volumetric curved edges.
- **Breathing Space**: Adjacent clay cards require a minimum gap of `space-md` (`1.25rem`) to stop their soft ambient shadows from muddying into one another.

## Elevation & Depth

Depth in this system is formed by a quadri-directional light model combining external ambient lighting with inner rim specular physics. All clay elements omit hard outlines in favor of the four-phase shadow stack:

1. **Outer Key Shadow**: Shifts down-right (`8px to 16px`), tinted with the surface's background darkness (`rgba(30, 45, 65, 0.12)`).
2. **Outer Ambient Bounce**: Shifts top-left (`-8px to -14px`), tinted bright pure white (`rgba(255, 255, 255, 0.75)` to `0.9`), visually separating the element from the matte canvas.
3. **Inner Glaze Highlight**: Inset down-right (`inset 2px 2px 4px rgba(255, 255, 255, 0.8)`), providing a soft pillowy edge reflection.
4. **Inner Bevel Undercut**: Inset top-left (`inset -2px -2px 4px rgba(0, 0, 0, 0.08)` to `0.12`), providing bottom-lip occlusion to simulate physical clay mass.

### Elevation Hierarchy

- **Level 0 (Recessed / Inset)**: Inputs, toggled wells, and active states. 
  `box-shadow: inset 4px 4px 8px rgba(70, 90, 120, 0.16), inset -4px -4px 8px rgba(255, 255, 255, 0.8);`
- **Level 1 (Resting Cards & Tiles)**:
  `box-shadow: 8px 8px 16px rgba(70, 90, 120, 0.10), -8px -8px 16px rgba(255, 255, 255, 0.85), inset 2px 2px 3px rgba(255, 255, 255, 0.7), inset -2px -2px 3px rgba(70, 90, 120, 0.06);`
- **Level 2 (Interactive Floating / Hover)**: Buttons and focused cards.
  `box-shadow: 12px 14px 24px rgba(70, 90, 120, 0.14), -10px -10px 20px rgba(255, 255, 255, 0.95), inset 3px 3px 5px rgba(255, 255, 255, 0.85), inset -3px -3px 5px rgba(70, 90, 120, 0.10);`
- **Level 3 (Modals / Overlays)**:
  `box-shadow: 20px 24px 36px rgba(50, 70, 95, 0.20), -16px -16px 32px rgba(255, 255, 255, 1.0), inset 4px 4px 6px rgba(255, 255, 255, 0.9), inset -4px -4px 6px rgba(50, 70, 95, 0.12);`

## Shapes

The shape philosophy rejects sharp corners. Every boundary is extruded, bulbous, and soft to mimic molded compound.

- **Pill Shaping (Full Radius)**: Mandated for primary and secondary action buttons, status tags, badges, search bars, and segmented tab pills.
- **Card Enclosures (`rounded-2xl` to `rounded-3xl` / 1.5rem - 2rem)**: Applied to medium and large surface cards, modals, and list row wrappers.
- **Micro UI (`rounded-xl` / 1rem)**: The absolute minimum allowed curvature; reserved only for tight spaces like dropdown menus and checkboxes.

## Components

### Buttons
- **Primary (Clay Coral)**: Rendered in `#FF6B6B` with white text. Employs colored drop shadow (`8px 10px 20px rgba(255, 107, 107, 0.35)`), negative white top-bounce, and inner specular highlight (`inset 2px 2px 3px rgba(255, 255, 255, 0.5)`).
- **Secondary (Clay Neutral)**: Surface colored in `#F0F4F9` with dark charcoal text `#1E2530`. Uses standard Level 1 clay shadow stack.
- **Interaction**: On `:hover`, translateY(-2px) with expanded shadows. On `:active`, translateY(2px) and swap outer shadow stack with the Level 0 inset depressed stack.

### Cards
- Standard containers use `#F3F7FC` over `#E8EEF5`. Internal padding is strictly `space-lg` (`2rem`).
- Cards avoid 1px border lines entirely. Structural containment is achieved solely through the 4-phase clay elevation profile.

### Input Fields & Controls
- **Inputs**: Sit in an embossed, pressed-in cavity. Background uses `#E2E9F2` with inset shadows (`inset 3px 3px 6px rgba(70, 90, 120, 0.14), inset -3px -3px 6px rgba(255, 255, 255, 0.9)`). On focus, transition the inner top highlight to `#4ECDC4` glow.
- **Checkboxes & Radios**: 24px wide rounded squares or circles with deep inset cavities. Checked state inflates an inner clay bead colored in primary coral or turquoise.

### Chips & Badges
- Pill-shaped (`rounded-full`) tags displaying category meta or filters.
- Default state features a subtle floating clay style; active state snaps into a saturated candy clay surface with white typography.

### Sliders & Toggles
- **Track**: Inset concave groove with deep ambient interior shading.
- **Thumb**: Inflated spherical bead using Level 2 elevation that visually overhangs the track edges.