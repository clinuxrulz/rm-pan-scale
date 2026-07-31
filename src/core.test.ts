import { describe, expect, it, vi } from "vitest";
import { createPanScaleCore, zoomAboutPoint } from "./core";
import type { PanScaleSetters } from "./core";

interface TestState {
  panX: number;
  panY: number;
  scale: number;
}

function makeState(initial: TestState = { panX: 0, panY: 0, scale: 1 }) {
  let state: TestState = { ...initial };
  let setters: PanScaleSetters = {
    setPanX: (value) => { state = { ...state, panX: value }; },
    setPanY: (value) => { state = { ...state, panY: value }; },
    setScale: (value) => { state = { ...state, scale: value }; },
  };
  return {
    state: (): TestState => state,
    panX: (): number => state.panX,
    panY: (): number => state.panY,
    scale: (): number => state.scale,
    onUpdate: (fn: (s: PanScaleSetters) => void) => { fn(setters); },
  };
}

describe("zoomAboutPoint", () => {
  it("zooms about a screen point keeping the world point under the cursor", () => {
    let next = zoomAboutPoint({ panX: 0, panY: 0, scale: 1 }, { x: 10, y: 20 }, 2);
    expect(next).toEqual({ panX: 5, panY: 10, scale: 2 });
  });

  it("clamps scale to minScale", () => {
    let next = zoomAboutPoint({ panX: 0, panY: 0, scale: 1 }, { x: 0, y: 0 }, 0.001, 0.01);
    expect(next.scale).toBe(0.01);
  });

  it("honors a custom minScale", () => {
    let next = zoomAboutPoint({ panX: 0, panY: 0, scale: 1 }, { x: 0, y: 0 }, 0.5, 0.5);
    expect(next.scale).toBe(0.5);
  });
});

describe("createPanScaleCore", () => {
  it("pans with a single pointer", () => {
    let s = makeState({ panX: 0, panY: 0, scale: 2 });
    let core = createPanScaleCore(s);
    core.onPointerDown(1, 10, 20);
    core.onPointerMove(1, 30, 40);
    expect(s.state()).toEqual({ panX: -10, panY: -10, scale: 2 });
  });

  it("pinch-zooms around the previous center with two pointers", () => {
    let s = makeState({ panX: 0, panY: 0, scale: 1 });
    let core = createPanScaleCore(s);
    core.onPointerDown(1, 0, 0);
    core.onPointerDown(2, 100, 0);
    core.onPointerMove(1, 0, 0);
    core.onPointerMove(2, 200, 0);
    expect(s.state()).toEqual({ panX: 25, panY: 0, scale: 2 });
  });

  it("pinch clamps scale to minScale", () => {
    let s = makeState({ panX: 0, panY: 0, scale: 1 });
    let core = createPanScaleCore({ ...s, minScale: 0.5 });
    core.onPointerDown(1, 0, 0);
    core.onPointerDown(2, 100, 0);
    core.onPointerMove(1, 0, 0);
    core.onPointerMove(2, 10, 0);
    expect(s.state().scale).toBe(0.5);
  });

  it("zooms in with negative deltaY", () => {
    let s = makeState({ panX: 0, panY: 0, scale: 1 });
    let core = createPanScaleCore(s);
    core.onWheel(10, 20, -100);
    expect(s.state().scale).toBeCloseTo(1.1);
    expect(s.state().panX).toBeCloseTo(10 - 10 / 1.1);
    expect(s.state().panY).toBeCloseTo(20 - 20 / 1.1);
  });

  it("zooms out with positive deltaY", () => {
    let s = makeState({ panX: 0, panY: 0, scale: 1 });
    let core = createPanScaleCore(s);
    core.onWheel(0, 0, 100);
    expect(s.state().scale).toBeCloseTo(1 / 1.1);
    expect(s.state().panX).toBe(0);
    expect(s.state().panY).toBe(0);
  });

  it("treats zero wheel delta as a zoom-in (preserves original behavior)", () => {
    let s = makeState();
    let core = createPanScaleCore(s);
    core.onWheel(0, 0, 0);
    expect(s.state().scale).toBeCloseTo(1.1);
  });

  it("ignores moves for unknown pointers", () => {
    let s = makeState();
    let core = createPanScaleCore(s);
    core.onPointerMove(99, 5, 5);
    expect(s.state()).toEqual({ panX: 0, panY: 0, scale: 1 });
  });

  it("calls setPointerCapture on pointer down and release on pointer up", () => {
    let setCapture = vi.fn();
    let releaseCapture = vi.fn();
    let s = makeState();
    let core = createPanScaleCore({
      ...s,
      setPointerCapture: setCapture,
      releasePointerCapture: releaseCapture,
    });
    core.onPointerDown(1, 0, 0);
    core.onPointerUp(1);
    expect(setCapture).toHaveBeenCalledWith(1);
    expect(releaseCapture).toHaveBeenCalledWith(1);
  });

  it("works without capture callbacks provided", () => {
    let s = makeState();
    let core = createPanScaleCore(s);
    core.onPointerDown(1, 0, 0);
    core.onPointerUp(1);
    expect(s.state()).toEqual({ panX: 0, panY: 0, scale: 1 });
  });

  it("handles pointer cancel like pointer up, re-establishing single-pointer grab", () => {
    let s = makeState({ panX: 0, panY: 0, scale: 1 });
    let core = createPanScaleCore(s);
    core.onPointerDown(1, 0, 0);
    core.onPointerDown(2, 100, 0);
    core.onPointerCancel(2);
    core.onPointerMove(1, 50, 0);
    expect(s.state()).toEqual({ panX: -50, panY: 0, scale: 1 });
  });
});
