# for-you-
The main version 
### Priority plan to bring the beautiful UI back (safe, incremental)

- 1) Foundation guardrails
  - **Feature flag/container**: wrap new UI under a parent `data-ui="v2"` on `body` so nothing overrides current styles.
  - **Keep backgrounds**: no changes to `body.dark` (black) and `body:not(.dark)` (blue).
  - **Keyboard/mobile testing hooks**: keep current weather-test and add a simple `?uiv2=on` switch.

- 2) Core visual tokens and base classes
  - **Glass**: `.glass-ui` + `.interactive-glass` with refined blur, borders, shadows (scoped under `[data-ui="v2"]`).
  - **Buttons**: `.ui-button` sizing, hover/active states, icon handling.
  - **Type**: load handwriting fonts and map to classes (`.pen-caveat`, `.pen-kalam`, etc.) without changing defaults.

- 3) Responsive layout polish
  - **Mobile-first spacing**: container padding, safe min-heights, scroll smoothing.
  - **Touch targets**: ensure 44px min on buttons and close icons.
  - **Modal sizing**: 95vw/90vh mobile; 90vw max 1024px desktop.

- 4) Modal look and feel
  - **Transitions**: cubic-bezier scale/opacity + backdrop blur.
  - **Content surface**: gradient glass for `.modal-content` with dark variant.
  - **Scrollable columns**: `.modal-sidebar`/`.modal-main` mobile/desktop rules.

- 5) List items and “Past Letters” cards
  - **Card polish**: `.list-card` glass, hover scale, active/locked states.
  - **Number badge**: `.list-number` tone-adjusted light/dark.

- 6) Reading pane “paper” surface
  - **`.reading-paper`** for letter view with soft gradient, border, shadow; dark variant.

- 7) Top/Corner UI controls
  - **Consistent icon buttons** (theme, memory mode, goodnight) using `.ui-button`.
  - **Hover micro‑interactions**: subtle scale/opacity.

- 8) Memory navigation arrows
  - **`.memory-arrow`** show-on-hover with safe z-index and mobile visibility rules.

- 9) Goodnight overlay
  - **`#goodnight-overlay`** fade sequence + headline timing; no interference with weather layers.

- 10) Weather layer harmony
  - **Z-index contract**: `bg < clouds < lightning < weather < content`.
  - **No background tinting**; overlays use very low alpha only.

- 11) Accessibility + perf
  - **Focus rings**, prefers-reduced-motion, and shadow/blur cost caps on low-end devices.

What I’ll implement first (Step 1 next):
- Add the `[data-ui="v2"]` container and a tiny toggle (`?uiv2=on`).
- Add scoped CSS for: `.glass-ui`, `.ui-button`, `.interactive-glass` (light/dark), with no global overrides.
- Wire just one surface to use it: the main card (`.glass-ui`) so you can compare v1 vs v2 safely.

Say “go” and I’ll implement Step 1 exactly as above.