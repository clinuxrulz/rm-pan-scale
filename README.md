# @random-mesh/rm-pan-scale

[![npm version](https://img.shields.io/npm/v/@random-mesh/rm-pan-scale.svg)](https://www.npmjs.com/package/@random-mesh/rm-pan-scale)
[![License: MIT](https://img.shields.io/npm/l/@random-mesh/rm-pan-scale.svg)](https://github.com/clinuxrulz/rm-pan-scale)
[![GitHub stars](https://img.shields.io/github/stars/clinuxrulz/rm-pan-scale?style=social)](https://github.com/clinuxrulz/rm-pan-scale)

DOM-independent pan/zoom gesture math with an optional DOM pointer/wheel adapter.

- **npm:** [@random-mesh/rm-pan-scale](https://www.npmjs.com/package/@random-mesh/rm-pan-scale)
- **GitHub:** [clinuxrulz/rm-pan-scale](https://github.com/clinuxrulz/rm-pan-scale)

- `createPanScaleCore` — pure calculation core with no DOM dependency. Feed it
  element-local pointer coordinates and wheel deltas; it computes pan/scale updates.
  Works for any rendering target (Canvas 2D, WebGL, SVG, ...).
- `createPanScaleControl` — DOM wrapper exposing the same interface for
  `HTMLElement` targets (converts `PointerEvent`/`WheelEvent` to local coords and
  wires up optional pointer capture). This is a thin adapter; all math lives in the core.
- `zoomAboutPoint` — pure zoom-about-a-screen-point transform, shared by wheel and pinch.

## Pure core

```ts
import { createPanScaleCore } from "@random-mesh/rm-pan-scale";

const core = createPanScaleCore({
  panX: () => state.panX,
  panY: () => state.panY,
  scale: () => state.scale,
  onUpdate: (set) => {
    set.setPanX(...);
    set.setPanY(...);
    set.setScale(...);
  },
  // optional:
  minScale: 0.01,
  setPointerCapture: (pointerId) => { /* your capture logic */ },
  releasePointerCapture: (pointerId) => { /* your capture logic */ },
});

// Feed it coordinates in your own local space:
core.onPointerDown(pointerId, x, y);
core.onPointerMove(pointerId, x, y);
core.onPointerUp(pointerId);
core.onPointerCancel(pointerId);
core.onWheel(x, y, deltaY);
```

## DOM wrapper

```ts
import { createPanScaleControl } from "@random-mesh/rm-pan-scale";

const control = createPanScaleControl({
  target: () => element, // HTMLElement | undefined
  panX: () => state.panX,
  panY: () => state.panY,
  scale: () => state.scale,
  onUpdate: (set) => { ... },
});

element.addEventListener("pointerdown", control.onPointerDown);
element.addEventListener("pointermove", control.onPointerMove);
element.addEventListener("pointerup", control.onPointerUp);
element.addEventListener("pointercancel", control.onPointerCancel);
element.addEventListener("wheel", control.onWheel);
```

Gestures:

- Single pointer drag pans.
- Two pointer pinch zooms about the pinch midpoint (and pans).
- Mouse wheel zooms about the cursor position.

## Development

```
pnpm install
pnpm test
pnpm run type-check
pnpm run build
```

## Demos

Monorepo (pnpm workspace) with the library at the root and demos under `demos/`.

- `demos/mandelbrot` — WebGL2 Mandelbrot explorer using `@random-mesh/rmsl`
  for shaders and `@random-mesh/rm-pan-scale` for pan/zoom (single-pointer pan,
  two-finger pinch, wheel zoom). It feeds the pure core center-origin, +Y-up
  coordinates matching the shader's space.

```
pnpm run dev:mandelbrot     # vite dev server
pnpm run build:mandelbrot   # production build
```

