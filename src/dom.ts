import { createPanScaleCore } from "./core";
import type { PanScaleSetters } from "./core";

export interface PanScaleControlParams {
  target: () => HTMLElement | undefined;
  panX: () => number;
  panY: () => number;
  scale: () => number;
  onUpdate: (fn: (setters: PanScaleSetters) => void) => void;
  disable?: () => boolean,
  minScale?: number;
}

export interface PanScaleControl {
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onPointerCancel: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onWheel: (e: WheelEvent) => void;
}

export function createPanScaleControl(params: PanScaleControlParams): PanScaleControl {
  let { target, panX, panY, scale, onUpdate, minScale, } = params;

  let core = createPanScaleCore({
    panX,
    panY,
    scale,
    onUpdate,
    minScale,
    setPointerCapture: (pointerId: number) => {
      let target2 = target();
      if (target2 === undefined) {
        return;
      }
      try {
        target2.setPointerCapture(pointerId);
      } catch (_) {}
    },
    releasePointerCapture: (pointerId: number) => {
      let target2 = target();
      if (target2 === undefined) {
        return;
      }
      try {
        target2.releasePointerCapture(pointerId);
      } catch (_) {}
    },
  });

  return {
    onPointerDown: (e: PointerEvent) => {
      if (params.disable?.()) {
        return;
      }
      let target2 = target();
      if (target2 === undefined) {
        return;
      }
      let rect = target2.getBoundingClientRect();
      core.onPointerDown(e.pointerId, e.clientX - rect.left, e.clientY - rect.top);
    },

    onPointerMove: (e: PointerEvent) => {
      if (params.disable?.()) {
        return;
      }
      let target2 = target();
      if (target2 === undefined) {
        return;
      }
      let rect = target2.getBoundingClientRect();
      core.onPointerMove(e.pointerId, e.clientX - rect.left, e.clientY - rect.top);
    },

    onPointerUp: (e: PointerEvent) => {
      let target2 = target();
      if (target2 === undefined) {
        return;
      }
      core.onPointerUp(e.pointerId);
    },

    onPointerCancel: (e: PointerEvent) => {
      let target2 = target();
      if (target2 === undefined) {
        return;
      }
      core.onPointerCancel(e.pointerId);
    },

    onWheel: (e: WheelEvent) => {
      if (params.disable?.()) {
        return;
      }
      let target2 = target();
      if (target2 === undefined) {
        return;
      }
      let rect = target2.getBoundingClientRect();
      core.onWheel(e.clientX - rect.left, e.clientY - rect.top, e.deltaY);
    },
  };
}
