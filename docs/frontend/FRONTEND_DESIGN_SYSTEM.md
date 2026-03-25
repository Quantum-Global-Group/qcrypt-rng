# Frontend design system (mockup-aligned)

This document consolidates the **Zinc “Restrained Lab & Technical Editorial”** system used in the Stitch HTML mockups. The authoritative narrative and rules live in:

`stitch_quantum_oracle_prd_cybersecurity/stitch_quantum_oracle_prd_cybersecurity/zinc_protocol/DESIGN.md`

Implementation target: **`quantum-oracle-ui`** with **build-time Tailwind** (do not use the mockups’ CDN Tailwind in production).

---

## 1. Creative north star

- **Name:** “The Calibrated Instrument.”
- **Not:** neon-cyber tropes; **yes:** laboratory equipment, technical journals, intentional density on an **8px grid**, tonal surfaces.
- **Text:** Prefer `on-surface` / `on-background` off-whites over pure white (`#e4e1e6` range per tokens below).

---

## 2. Global HTML / theme switches

- Set **`class="dark"`** on `<html>` so dark tokens match the mockups.
- **Body background:** `#131316` (`background` / `surface`).
- **Icons:** Mockups use **Material Symbols Outlined** (Google Fonts). You may swap to another icon set if you maintain a 1:1 mapping for nav and actions.

---

## 3. Typography

| Role | Font | Usage |
|------|------|--------|
| UI, headings, body | **Inter** (variable) | All chrome and readable copy |
| Technical artifacts | **JetBrains Mono** | IPs, hashes, keys, logs, raw API values |

**Scale (from DESIGN.md)**

| Token | Size | Use |
|-------|------|-----|
| Display | 3.5rem | Critical metrics / security scores |
| Headline | 1.5rem–2rem | Page titles |
| Title | 1rem–1.125rem | Card / section titles |
| Body | 0.875rem | Descriptions, status |
| Label | 0.6875rem, uppercase, +0.05em tracking | Table headers, metadata |

---

## 4. Surfaces and semantics

### No-line rule

- Avoid **1px solid borders** for sectioning. Use **background tier shifts** instead.
- **Ghost border** only where needed (inputs, a11y): `outline-variant` at ~20% opacity.

### Semantic accents (functional, not decorative)

| Meaning | Token | Hex (reference) |
|---------|--------|-----------------|
| Verified / stable | `secondary` | `#4edea3` |
| Simulated / caution | `tertiary` | `#ffb95f` |
| Degraded / action | `error` | `#ffb4ab` |
| Primary / navigation intent | `primary` | `#adc6ff` |

### Glass overlays

- Modals / command palette: `surface-container-highest` at **~0.8 opacity** + **12px backdrop-blur** (per DESIGN.md).

### Elevation

- Prefer **tonal layering** over heavy shadows.
- Floating elements: soft shadow, **32px blur**, **0 spread**, **~6% opacity** of `on-background` (see DESIGN.md).

---

## 5. Components (summary)

- **Buttons:** Primary uses `primary-container` bg + `on-primary-container` text; secondary uses `surface-container-high` + subtle outline. **No gradients.** Hover = one step up the surface tier.
- **Inputs:** `surface-container-lowest`, ghost border, focus ring `primary` (no glow). Label above, not placeholder-as-label.
- **Tables:** No row dividers; vertical padding 8–12px; row hover `surface-container-low`; monospace for technical columns.
- **Chips:** Small radius; accent at ~15% opacity background, full-opacity text.

---

## 6. Tailwind color tokens (from mockup `code.html`)

Copy these into `quantum-oracle-ui/tailwind.config.ts` under `theme.extend.colors` (keys use hyphens to match class names like `bg-surface-container-low`).

| Token | Hex |
|-------|-----|
| `background` | `#131316` |
| `surface` | `#131316` |
| `surface-dim` | `#131316` |
| `surface-bright` | `#39393c` |
| `surface-container-lowest` | `#0e0e11` |
| `surface-container-low` | `#1b1b1e` |
| `surface-container` | `#1f1f22` |
| `surface-container-high` | `#2a2a2d` |
| `surface-container-highest` | `#353438` |
| `surface-variant` | `#353438` |
| `surface-tint` | `#adc6ff` |
| `on-background` | `#e4e1e6` |
| `on-surface` | `#e4e1e6` |
| `on-surface-variant` | `#c2c6d6` |
| `inverse-surface` | `#e4e1e6` |
| `inverse-on-surface` | `#303033` |
| `outline` | `#8c909f` |
| `outline-variant` | `#424754` |
| `primary` | `#adc6ff` |
| `on-primary` | `#002e6a` |
| `primary-container` | `#4d8eff` |
| `on-primary-container` | `#00285d` |
| `primary-fixed` | `#d8e2ff` |
| `primary-fixed-dim` | `#adc6ff` |
| `on-primary-fixed` | `#001a42` |
| `on-primary-fixed-variant` | `#004395` |
| `inverse-primary` | `#005ac2` |
| `secondary` | `#4edea3` |
| `on-secondary` | `#003824` |
| `secondary-container` | `#00a572` |
| `on-secondary-container` | `#00311f` |
| `secondary-fixed` | `#6ffbbe` |
| `secondary-fixed-dim` | `#4edea3` |
| `on-secondary-fixed` | `#002113` |
| `on-secondary-fixed-variant` | `#005236` |
| `tertiary` | `#ffb95f` |
| `on-tertiary` | `#472a00` |
| `tertiary-container` | `#ca8100` |
| `on-tertiary-container` | `#3e2400` |
| `tertiary-fixed` | `#ffddb8` |
| `tertiary-fixed-dim` | `#ffb95f` |
| `on-tertiary-fixed` | `#2a1700` |
| `on-tertiary-fixed-variant` | `#653e00` |
| `error` | `#ffb4ab` |
| `on-error` | `#690005` |
| `error-container` | `#93000a` |
| `on-error-container` | `#ffdad6` |

Also extend:

```ts
fontFamily: {
  headline: ['Inter', 'sans-serif'],
  body: ['Inter', 'sans-serif'],
  label: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
borderRadius: {
  DEFAULT: '0.125rem',
  lg: '0.25rem',
  xl: '0.5rem',
  full: '0.75rem',
},
```

Use **`rounded` / `rounded-lg`** per DESIGN.md (avoid oversized radii except status pips).

---

## 7. Do’s and don’ts (short)

**Do:** monospace for machine-generated strings; density with grid alignment; instrument grays for calm.  
**Don’t:** gradients; pure `#fff` for primary text; decorative glows; arbitrary large corner radii.
