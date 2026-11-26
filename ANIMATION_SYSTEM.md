# Grovia Mart Animation System

## Purpose

Motion makes Grovia Mart feel fresh, tactile and expensive without slowing shopping.
Every animation is short, transform/opacity-first and removable. The standard is
"calm premium market", never "demo reel".

## Technology

- **Framer Motion** — route transitions, split-word hero, scroll reveals, drawer/modal,
  layout and stagger choreography.
- **CSS transitions/keyframes** — hover, sheen, marquee, badges, ambient produce art.
- **Swiper** — featured-image, department, product and customer-story carousels with
  responsive breakpoints and touch/keyboard navigation.
- **Lucide** — consistent icon feedback.
- No GSAP and no 3D runtime in the current bundle. Both are intentionally deferred until
  optimised assets justify the download cost.

## Timing standards

| Interaction | Duration | Easing |
|---|---:|---|
| Page enter/exit | 280 ms | `cubic-bezier(.22, 1, .36, 1)` |
| Section reveal | 550 ms | `cubic-bezier(.22, 1, .36, 1)` |
| Card hover | 220–280 ms | ease |
| Drawer / modal | 320 ms | `cubic-bezier(.22, 1, .36, 1)` |
| Cart item exit | 200 ms | `cubic-bezier(.22, 1, .36, 1)` |
| Toast | 240 ms | `cubic-bezier(.22, 1, .36, 1)` |
| Micro feedback | 160–200 ms | ease |

Primary buttons use a small hover lift/scale and a restrained press scale, with a visible
keyboard focus ring. The shared reduced-motion rule removes these transitions on request.

Stagger between siblings: **60–80 ms**. Reveal offset: **18–28 px**. Never exceed
**900 ms** for a single element.

## Signature choreography

### Hero
1. Eyebrow fades in.
2. Headline reveals word-by-word through an overflow mask (`y: 110% → 0`,
   slight rotate, 55 ms stagger).
3. Supporting copy, CTAs and stats follow at 80–120 ms intervals.
4. Produce art scales from `0.96` with a soft mask reveal.
5. Floating chips drift continuously (12–18 s) and pause offscreen.
6. Pointer glow follows the cursor on fine pointers only.
7. Featured imagery has manual arrows and a slide counter; autoplay pauses on hover
   and stops after interaction.

### Navigation
- Sticky header shrinks from 84 px to 68 px, gains a translucent cream surface and a
  hairline border after 32 px of scroll.
- Active nav item uses a shared-layout pill indicator.
- Search expands on focus; mobile menu is a full-height sheet with staggered links.
- Mega menu fades/translates in 180 ms; no scroll-jacking.

### Product cards
- Card lifts 4–6 px, image scales to 1.045, shadow deepens.
- Wishlist heart pops (`scale 1 → 1.25 → 1`).
- Quick-add confirms with a check state for 900 ms.
- Badges use a one-shot soft pulse, never a permanent throb.
- Quick view modal: backdrop blur + 24 px rise + 0.98 → 1 scale.
- Homepage product and department rails use touch-first carousels with responsive
  card counts, visible next/previous controls, and no document-level horizontal scroll.

### Cart & checkout
- Drawer slides from the right in 320 ms with a dimmed backdrop.
- Quantity changes animate numbers with a subtle y-shift.
- Removed lines collapse width/height and fade in 200 ms.
- Totals use a short crossfade, never a count-up that delays clarity.
- Checkout steps advance with a 200 ms horizontal slide and progress fill.
- Success screen: check draw-in + summary rise.

### Admin
- Sidebar groups expand with 180 ms height/opacity transitions.
- Tables keep native scroll; rows use a 120 ms hover tint only.
- Status changes flash a lime confirmation chip.
- Modals are 320 ms and never block form input.

## Ambient elements

- Soft aurora blobs (18–24 s) behind the hero.
- Produce marquee (40 s linear) with edge masks; pauses on hover.
- Grain/noise overlay at 3–6% opacity for tactility.
- Large footer wordmark with a slow gradient sweep (12 s).

## Accessibility

- `MotionConfig reducedMotion="user"` wraps the app.
- `prefers-reduced-motion: reduce` disables continuous movement and reduces transitions
  to 0.01 ms.
- Hero autoplay is disabled for reduced-motion preferences; every carousel remains
  manually navigable with keyboard controls.
- Reveals become immediately visible under reduced motion.
- Hover-only effects (tilt, spotlight, pointer glow) are disabled on coarse pointers.
- Focus states are never hidden.
- Toasts use `role="status"`; dialogs use `aria-modal`, focus trap, Escape close and
  focus restoration.
- No flashing, no parallax that triggers motion sickness, no autoplay video with sound.

## Performance rules

1. Animate `transform` and `opacity`; avoid layout properties.
2. `viewport={{ once: true }}` for section reveals.
3. Lazy-load route chunks and below-the-fold imagery.
4. Pause ambient animations when offscreen or when the document is hidden.
5. Use `will-change` sparingly and remove it after animation.
6. Never animate during checkout submission or block interaction.
7. Respect device capability: no custom cursor, tilt or heavy blur on touch/low-end.

## Verification

```powershell
cd grovia-mart
npm.cmd run build
npm.cmd run lint
```

Check manually at 360 px, 768 px, 1024 px, 1440 px and 1920 px, with keyboard-only
navigation and "reduce motion" enabled.
