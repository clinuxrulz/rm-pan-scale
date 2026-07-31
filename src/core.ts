export interface PanScaleSetters {
  setPanX: (value: number) => void;
  setPanY: (value: number) => void;
  setScale: (value: number) => void;
}

export interface PanScaleTransform {
  panX: number;
  panY: number;
  scale: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PanScaleCoreParams {
  panX: () => number;
  panY: () => number;
  scale: () => number;
  onUpdate: (fn: (setters: PanScaleSetters) => void) => void;
  minScale?: number;
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
}

export interface PanScaleCore {
  onPointerDown: (pointerId: number, x: number, y: number) => void;
  onPointerMove: (pointerId: number, x: number, y: number) => void;
  onPointerUp: (pointerId: number) => void;
  onPointerCancel: (pointerId: number) => void;
  onWheel: (x: number, y: number, deltaY: number) => void;
}

export function zoomAboutPoint(
  transform: PanScaleTransform,
  screenPoint: Point,
  factor: number,
  minScale = 0.01,
): PanScaleTransform {
  let newScale = Math.max(minScale, transform.scale * factor);
  let worldX = transform.panX + screenPoint.x / transform.scale;
  let worldY = transform.panY + screenPoint.y / transform.scale;
  return {
    panX: worldX - screenPoint.x / newScale,
    panY: worldY - screenPoint.y / newScale,
    scale: newScale,
  };
}

export function createPanScaleCore(params: PanScaleCoreParams): PanScaleCore {
  let { panX, panY, scale, onUpdate, minScale = 0.01, setPointerCapture, releasePointerCapture, } = params;
  const activePointers = new Map<number, Point>();
  let prevDist: number | undefined = undefined;
  let prevCenter: Point | undefined = undefined;
  let grabOffsetX: number | undefined = undefined;
  let grabOffsetY: number | undefined = undefined;
  let resetSinglePointerGrab = () => {
    if (activePointers.size === 1) {
      const [, pos] = activePointers.entries().next().value!;
      grabOffsetX = pos.x / scale() + panX();
      grabOffsetY = pos.y / scale() + panY();
    } else {
      grabOffsetX = undefined;
      grabOffsetY = undefined;
    }
  };

  let handlePointerUp = (pointerId: number) => {
    if (activePointers.has(pointerId)) {
      releasePointerCapture?.(pointerId);
      activePointers.delete(pointerId);
    }

    if (activePointers.size < 2) {
      prevDist = undefined;
      prevCenter = undefined;
    }

    resetSinglePointerGrab();
  };

  return {
    onPointerDown: (pointerId: number, x: number, y: number) => {
      setPointerCapture?.(pointerId);

      let pos = { x, y, };
      activePointers.set(pointerId, pos);

      if (activePointers.size === 1) {
        grabOffsetX = pos.x / scale() + panX();
        grabOffsetY = pos.y / scale() + panY();
      } else if (activePointers.size === 2) {
        grabOffsetX = undefined;
        grabOffsetY = undefined;
        let pts = Array.from(activePointers.values());
        let dx = pts[1].x - pts[0].x;
        let dy = pts[1].y - pts[0].y;
        prevDist = Math.sqrt(dx * dx + dy * dy);
        prevCenter = {
          x: 0.5 * (pts[0].x + pts[1].x),
          y: 0.5 * (pts[0].y + pts[1].y),
        };
      }
    },

    onPointerMove: (pointerId: number, x: number, y: number) => {
      if (!activePointers.has(pointerId)) {
        return;
      }

      let pos = { x, y, };
      activePointers.set(pointerId, pos);

      if (activePointers.size === 1 && grabOffsetX !== undefined && grabOffsetY !== undefined) {
        let gx = grabOffsetX;
        let gy = grabOffsetY;
        // Single finger drag / pan
        onUpdate(({ setPanX, setPanY, }) => {
          setPanX(gx - pos.x / scale());
          setPanY(gy - pos.y / scale());
        });
      } else if (activePointers.size === 2) {
        // Two finger pinch-zoom & pan
        let pts = Array.from(activePointers.values());
        let dx = pts[1].x - pts[0].x;
        let dy = pts[1].y - pts[0].y;
        let currDist = Math.sqrt(dx * dx + dy * dy);
        let currCenter = {
          x: 0.5 * (pts[0].x + pts[1].x),
          y: 0.5 * (pts[0].y + pts[1].y),
        };

        if (prevDist !== undefined && prevCenter !== undefined && prevDist > 0) {
          let oldScale = scale();
          let newScale = Math.max(minScale, oldScale * (currDist / prevDist));

          // World point that was under the previous pinch midpoint
          let worldX = panX() + prevCenter.x / oldScale;
          let worldY = panY() + prevCenter.y / oldScale;

          // Keep that world point under the current midpoint (zoom + pan)
          let newPanX = worldX - currCenter.x / newScale;
          let newPanY = worldY - currCenter.y / newScale;

          onUpdate(({ setPanX, setPanY, setScale, }) => {
            setPanX(newPanX);
            setPanY(newPanY);
            setScale(newScale);
          });
        }

        prevDist = currDist;
        prevCenter = currCenter;
      }
    },

    onPointerUp: handlePointerUp,

    onPointerCancel: handlePointerUp,

    onWheel: (x: number, y: number, deltaY: number) => {
      let wheelY = deltaY > 0 ? -1 : 1;
      if (wheelY === 0) {
        return;
      }
      let oldScale = scale();
      let next = zoomAboutPoint(
        { panX: panX(), panY: panY(), scale: oldScale, },
        { x, y, },
        Math.pow(1.1, wheelY),
        minScale,
      );
      onUpdate(({ setPanX, setPanY, setScale, }) => {
        setPanX(next.panX);
        setPanY(next.panY);
        setScale(next.scale);
      });
    },
  };
}
