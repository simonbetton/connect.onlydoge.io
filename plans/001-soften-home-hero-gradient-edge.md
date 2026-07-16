# 001 — Soften the home hero gradient edge

- **Status**: DONE
- **Commit**: 3b9a486
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file, 1 class-list change

## Problem

The home hero's decorative background is a fixed-height layer. Its final linear
gradient fades vertically, but the two radial gradients are separate background
layers and are not masked. On wide viewports, the left yellow radial gradient
can still have visible color at the layer's 600px boundary, so the section clips
it into a hard horizontal bottom edge.

```tsx
/* src/components/marketing/marketing-home-page.tsx:117 — current */
<div className="pointer-events-none absolute inset-x-0 top-0 h-150 bg-[radial-gradient(circle_at_15%_12%,oklch(from_var(--primary)_l_c_h/0.42),transparent_32%),radial-gradient(circle_at_75%_0%,oklch(0.88_0.12_80/0.28),transparent_30%),linear-gradient(180deg,var(--color-hero-wash)_0%,oklch(from_var(--color-hero-wash)_l_c_h/0)_64%)]" />
```

## Target

Apply a vertical mask to the complete decorative layer so every background
layer, including both radial gradients, reaches zero opacity before the fixed
height ends.

```tsx
/* target */
<div className="mask-[linear-gradient(180deg,black_0%,black_58%,transparent_100%)] pointer-events-none absolute inset-x-0 top-0 h-150 bg-[radial-gradient(circle_at_15%_12%,oklch(from_var(--primary)_l_c_h/0.42),transparent_32%),radial-gradient(circle_at_75%_0%,oklch(0.88_0.12_80/0.28),transparent_30%),linear-gradient(180deg,var(--color-hero-wash)_0%,oklch(from_var(--color-hero-wash)_l_c_h/0)_64%)]" />
```

Do not change the radial-gradient positions, colors, opacity values, or the
layer height. The mask alone should remove the clipping seam while preserving
the hero's existing color composition.

## Repo conventions to follow

- Keep the visual treatment as a Tailwind arbitrary utility in the component;
  do not introduce a one-off global CSS selector.
- `src/components/workbench-shell.tsx:23` already uses the exact
  `mask-[linear-gradient(180deg,black_0%,black_58%,transparent_100%)]` utility
  for the same kind of multi-layer yellow page wash. Match that exemplar.

## Steps

1. In `src/components/marketing/marketing-home-page.tsx:117`, prepend
   `mask-[linear-gradient(180deg,black_0%,black_58%,transparent_100%)]` to the
   decorative background div's class list.
2. Leave the element structure and all existing background-gradient values
   unchanged.

## Boundaries

- Do NOT change `tokens.css`, `src/styles.css`, or `src/microinteractions.css`.
- Do NOT alter hero spacing, section height, overflow behavior, or content.
- Do NOT change the workbench-shell gradient.
- Do NOT add dependencies.
- If the cited class list has drifted since commit `3b9a486`, STOP and report
  instead of improvising.

## Verification

- **Mechanical**: run `bun run typecheck` and `bun run lint`; both must exit
  successfully.
- **Feel check**: run `bun run dev`, open `/`, and inspect the hero at 1440px,
  1920px, and 2560px viewport widths. Confirm:
  - the yellow wash on the left fades continuously into the page background;
  - no horizontal edge is visible at the bottom of the 600px decorative layer;
  - the upper-left yellow intensity and the upper-right warm wash still match
    the pre-change appearance;
  - the transition into the proof-stat section remains clean at narrow mobile
    widths.
- **Done when**: the home hero has no visible bottom clipping seam at any tested
  width, with no layout or content changes.
