# @random-mesh/rm-pan-scale

[![npm version](https://img.shields.io/npm/v/@random-mesh/rm-pan-scale.svg)](https://www.npmjs.com/package/@random-mesh/rm-pan-scale)
[![License: MIT](https://img.shields.io/github/license/clinuxrulz/rm-pan-scale.svg)](https://github.com/clinuxrulz/rm-pan-scale)
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

`createPanScaleCore` is stateless: your app owns the `panX` / `panY` / `scale`
values and passes in getters so the core can read them. When a gesture wants to
change the transform, the core calls `onUpdate` instead of mutating your state
directly.

`onUpdate` receives a single argument — a function. Call that function with a
`PanScaleSetters` object (`{ setPanX, setPanY, setScale }`) to commit the new
values, then run any follow-up work such as re-rendering. The indirection lets
the core apply several setter calls as one atomic update while leaving both
state ownership and post-update side effects up to you:

```ts
import { createPanScaleCore } from "@random-mesh/rm-pan-scale";

// Your own state, wherever you keep it.
let state = { panX: 0, panY: 0, scale: 1 };

const core = createPanScaleCore({
  panX: () => state.panX,
  panY: () => state.panY,
  scale: () => state.scale,
  onUpdate: (fn) => {
    fn({
      setPanX: (value) => { state.panX = value; },
      setPanY: (value) => { state.panY = value; },
      setScale: (value) => { state.scale = value; },
    });
    render(); // e.g. redraw your canvas / SVG after the transform changes
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

`createPanScaleControl` wraps the core for `HTMLElement` targets. It takes the
same getters and the same `onUpdate` contract described above; pointer capture
and client-to-local coordinate conversion are handled for you.

```ts
import { createPanScaleControl } from "@random-mesh/rm-pan-scale";

const control = createPanScaleControl({
  target: () => element, // HTMLElement | undefined
  panX: () => state.panX,
  panY: () => state.panY,
  scale: () => state.scale,
  onUpdate: (fn) => {
    fn({
      setPanX: (value) => { state.panX = value; },
      setPanY: (value) => { state.panY = value; },
      setScale: (value) => { state.scale = value; },
    });
    render();
  },
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

