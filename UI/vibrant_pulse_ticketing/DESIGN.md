---
name: Vibrant Pulse Ticketing
colors:
  surface: '#f8f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f8f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e7e8eb'
  surface-container-highest: '#e1e2e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4a3f'
  inverse-surface: '#2e3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7b6f'
  outline-variant: '#bccabc'
  surface-tint: '#006d3d'
  primary: '#006d3d'
  on-primary: '#ffffff'
  primary-container: '#2dc275'
  on-primary-container: '#004927'
  inverse-primary: '#53df8f'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#006c49'
  on-tertiary: '#ffffff'
  tertiary-container: '#24c188'
  on-tertiary-container: '#004930'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#72fca9'
  primary-fixed-dim: '#53df8f'
  on-primary-fixed: '#00210f'
  on-primary-fixed-variant: '#00522c'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9fc'
  on-background: '#191c1e'
  surface-variant: '#e1e2e5'
  mint-bright: '#A7F3D0'
  slate-surface: '#1E2329'
  slate-subtle: '#333C48'
  surface-light: '#F8FAFC'
  urgency-coral: '#FF4D4D'
  sold-out-gray: '#94A3B8'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies a modern, high-energy event discovery and transactional ticketing marketplace. Drawing inspiration from fast-paced urban entertainment platforms, the interface balances high-impact cultural excitement with clear, low-friction purchasing flows.

The target audience spans live-event seekers—from festival attendees and arena concertgoers to corporate conference visitors—as well as event organizers seeking professional credibility. The UI evokes anticipation, clarity, trust, and momentum. 

The aesthetic is Modern Commercial with Glassmorphism accents:
- **Clean Structural Foundations:** Deep slate neutrals provide sharp contrast, allowing event poster artwork and key calls-to-action to lead the visual narrative.
- **Vibrant Accents:** High-voltage emerald greens and electric mints inject vitality into ticket tiers, availability indicators, and interactive states.
- **Tactile Depth:** Translucent overlays, soft layered elevation, and crisp geometric borders keep dense checkout flows and filter matrices effortlessly digestible.

## Colors

The color palette pairs an energetic chromatic spectrum with structured, dark architectural anchors.

- **Primary (`#2DC275`):** Energetic emerald green driving primary conversions, success states, booking actions, and immediate-engagement moments.
- **Secondary (`#0EA5E9`):** Vibrant cyan serving as the digital utility hue, spotlighting AI concierge interactions, interactive seat map markers, and discovery filters.
- **Tertiary (`#10B981`):** Deep mint providing tonal modulation for secondary active states, badges, and progress bar progressions.
- **Neutral (`#121517`):** Deep carbon slate ensuring optimal contrast on typography, dark headers, and high-impact hero modules.

### Functional Tokens & Overlays
- **`mint-bright` (`#A7F3D0`):** Soft high-contrast tint used for pill tag backgrounds, badge fills, and hover ring glows.
- **`slate-surface` (`#1E2329`):** Card surfaces in dark-theme panels and sticky footer utility zones.
- **`surface-light` (`#F8FAFC`):** Default ambient background across standard marketplace feeds.
- **`urgency-coral` (`#FF4D4D`):** "Few tickets left", timer countdowns, and real-time cart expiry warnings.

## Typography

The type system blends the energetic geometry of **Plus Jakarta Sans** for display titles and event names with the utilitarian legibility of **Inter** for dense transactional interfaces, pricing tiers, and metadata.

- **Headlines:** Display titles lean heavily on tight tracking (`-0.01em` to `-0.02em`) and bold weights to emulate contemporary festival posters while retaining readability over ambient imagery.
- **Body:** Standard body copy maintains open proportions for clarity across event details, terms, and purchase instructions.
- **Labels & Numbers:** Small uppercase tags, date chips, and countdown counters use slightly widened letter spacing (`0.02em` to `0.04em`) with medium-to-bold weights to remain distinct against colored backgrounds.

## Layout & Spacing

The layout is built around a structured 12-column responsive fluid grid with strict maximum container widths to guarantee readable event feeds and stable transactional checkouts:
- **Desktop (1200px+):** Max canvas constrained to 1280px. 12-column grid with `1.5rem` gutters and `2rem` page margins. Used for multi-column discovery views (4-column event card grids) and asymmetric 8:4 splits on event detail and checkout flows.
- **Tablet (768px - 1199px):** 8-column grid with `1rem` gutters and `1.5rem` margins. Event cards collapse to 2-column or 3-column rows. The checkout summary transitions from a fixed sidebar to a collapsible top/bottom sheet.
- **Mobile (< 768px):** 4-column grid with `1rem` margins and `0.75rem` gutters. Cards reflow to single full-width feeds or horizontal carousel rails. Primary conversion buttons anchor to a sticky bottom sheet.

Vertical rhythm adheres to strict 8px multiples (`0.5rem`, `1rem`, `1.5rem`, `2.5rem`), reserving `space-xl` for section separation and category transitions.

## Elevation & Depth

Visual hierarchy uses tonal surface layering combined with ambient tinted drop shadows to create clean elevation without visual clutter:

- **Level 0 (Base Canvas):** Background tone `#F8FAFC`. Flat, clean, non-distracting surface.
- **Level 1 (Cards & Standard Modules):** Surface pure white (`#FFFFFF`) with a subtle ambient shadow: `0 2px 8px -2px rgba(18, 21, 23, 0.06), 0 1px 4px -1px rgba(18, 21, 23, 0.04)` bordered by a 1px ghost border `rgba(18, 21, 23, 0.08)`.
- **Level 2 (Hover States & Dropdowns):** Elevated event cards and selection menus: `0 12px 24px -6px rgba(18, 21, 23, 0.10), 0 4px 8px -2px rgba(18, 21, 23, 0.04)`.
- **Level 3 (Sticky Checkout Sidebars & Overlays):** Dynamic side panels: `0 20px 32px -8px rgba(18, 21, 23, 0.14)`.
- **Floating AI Assistant & Modals:** Floating elements feature a dual-layer glassmorphism background: `backdrop-filter: blur(16px)`, background fill `rgba(255, 255, 255, 0.85)` (or `rgba(30, 35, 41, 0.85)` in dark variants), framed with a soft ambient cyan/mint halo shadow: `0 16px 36px -4px rgba(14, 165, 233, 0.18)`.

## Shapes

The shape system employs rounded corners (Base: `0.5rem` / `8px`) to convey a modern, friendly consumer interface while retaining professional order.

- **Standard Components:** Input fields, buttons, and alert callouts adopt `0.5rem` (`rounded-md`).
- **Cards & Surfaces:** Event poster cards, checkout summary containers, and interactive dialogs use `1rem` (`rounded-lg`) to create soft, defined content frames.
- **Interactive Tags & Badges:** Metadata badges, ticket stock tags, category chips, and floating AI triggers use full-pill styling (`rounded-full` / `9999px`) to maintain strong tactile contrast against rectangular event artwork.

## Components

### Buttons
- **Primary:** Background `#2DC275`, text white, weight `600`, height 44px (desktop) / 48px (mobile). Hover transforms to `#25A764` with a subtle elevation boost.
- **Secondary / Ghost:** White background, 1px solid border `rgba(18, 21, 23, 0.15)`, text `#121517`. Hover triggers `#F1F5F9`.
- **Floating AI Action:** Gradient fill (`#2DC275` to `#0EA5E9`), pill-shaped, crisp white label, dynamic pulse glow.

### Event Cards (Poster Prominence)
- **Ratio & Artwork:** 16:9 or 4:3 vertical image ratio, top corners clipped to `1rem`, bottom metadata container enclosed in pure `#FFFFFF`.
- **Floating Badges:** Date chip floating top-left (translucent white tile with bold month/day stack). Category pill floating top-right.
- **Pricing & Action:** Bold price tag at bottom-right (`from $XX`) using `Plus Jakarta Sans` bold, sitting opposite venue and calendar glyph icons.
- **Hover State:** Smooth `translateY(-4px)` shift with elevation level 2.

### Chips & Tags
- **Category Chips:** Horizontal scroll container; active chip has `#121517` background with white text; inactive chip has `#F1F5F9` fill with `#1E2329` text.
- **Urgency Tags:** Fill `rgba(255, 77, 77, 0.12)`, text `#FF4D4D`, bold `label-sm`, pill-shaped with left-aligned animated pulse dot.

### Form Inputs & Selection
- **Input Fields:** 44px height, background `#FFFFFF`, border 1px `rgba(18, 21, 23, 0.15)`, font `Inter` 15px. Focused state replaces border with `#2DC275` and adds a 3px ring of `rgba(45, 194, 117, 0.2)`.
- **Checkboxes & Radios:** 20px size, rounded `4px` (checkbox) or full circular (radio). Checked state filled `#2DC275` with white check/dot icon.

### Sticky Checkout Summary Card
- **Desktop Sidebar:** Locked in right 4-column span with a `top: 96px` offset. Displays tiered ticket summary, booking breakdown, promo code slot, real-time countdown timer bar, and the primary "Proceed to Pay" button.
- **Mobile Sticky Sheet:** Bottom-anchored bar with total price on left and primary button on right; swipe up expands itemized tax/fee line items.

### Floating AI Assistant Widget
- **Launcher:** Fixed to bottom-right (`bottom: 24px`, `right: 24px`), 56px circular button or pill shape with cyan/mint glow and sparkles icon.
- **Chat Window:** 380px wide, glassmorphic header, contextual recommendation event cards embedded within message bubbles.