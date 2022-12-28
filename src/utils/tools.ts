export interface Point {
  x: number;
  y: number;
}

export function setCSSProperties(element: HTMLElement, styles: Record<string, string>) {
  Object.entries(styles).forEach(([key, val]) => element.style.setProperty(key, val));
}

/** 是否在吸附范围内 */
export function withinAdsorptionRange(dynamic: number, adsorption: number, floating: number) {
  return adsorption - floating < dynamic && dynamic < adsorption + floating;
}

/** 获取外边矩 */
export function getFabricEnclosingRect(aCoords: Required<fabric.Object>['aCoords']) {
  const { tl, tr, br, bl } = aCoords;

  const left = Math.min(tl.x, tr.x, br.x, bl.x);
  const right = Math.max(tl.x, tr.x, br.x, bl.x);
  const top = Math.min(tl.y, tr.y, br.y, bl.y);
  const bottom = Math.max(tl.y, tr.y, br.y, bl.y);

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
    offsetLeft: left - tl.x,
    offsetRight: right - tl.x,
    offsetTop: top - tl.y,
    offsetBottom: bottom - tl.y,
  };
}

/** 获取外边矩 */
export function getEnclosingRect<T extends Record<'left' | 'right' | 'top' | 'bottom', number>>(...rects: T[]) {
  const left = Math.min(...rects.map(object => object.left));
  const right = Math.max(...rects.map(object => object.right));
  const top = Math.min(...rects.map(object => object.top));
  const bottom = Math.max(...rects.map(object => object.bottom));

  return { left, right, top, bottom, width: right - left, height: bottom - top };
}

export interface LinearFunction {
  k: number;
  b: number;
  func(x: number): number;
  reverseFunc(y: number): number;
  A: Point;
  B: Point;
}

export function linearFunction(pointA: Point, pointB: Point): LinearFunction {
  const k = (pointA.y - pointB.y) / (pointA.x - pointB.x);
  const b = pointA.y - k * pointA.x;
  if (k === 0) {
    const sign = Math.sign(pointB.x - pointA.x) * Infinity;
    const y = pointA.y;
    return {
      k,
      b,
      reverseFunc: () => sign,
      func: () => y,
      A: pointA,
      B: pointB,
    };
  } else if (!Number.isFinite(k)) {
    const sign = Math.sign(pointB.y - pointA.y) * Infinity;
    const x = pointA.x;
    return {
      k,
      b,
      reverseFunc: () => x,
      func: () => sign,
      A: pointA,
      B: pointB,
    };
  } else {
    return {
      k,
      b,
      reverseFunc: (y: number) => (y - b) / k,
      func: (x: number) => k * x + b,
      A: pointA,
      B: pointB,
    };
  }
}

export function perpendicularLinear(point: Point, linear: LinearFunction) {
  if (!Number.isFinite(linear.k)) {
    return linearFunction(point, { x: linear.reverseFunc(0), y: point.y });
  }

  if (linear.k === 0) {
    return linearFunction(point, { x: point.x, y: linear.func(0) });
  }

  const x = (point.x + linear.k * point.y - linear.k * linear.b) / (linear.k * linear.k + 1);
  const y = (linear.k * linear.k * point.y + linear.k * point.x + linear.b) / (linear.k * linear.k + 1);
  return linearFunction(point, { x, y });
}

/**
 * 获取点关于直线的垂点坐标
 * @param point 点
 * @param linear 直线
 * @returns 垂点
 */
export function pedalPoint(point: Point, linear: LinearFunction): Point {
  if (!Number.isFinite(linear.k)) {
    return { x: linear.reverseFunc(0), y: point.y };
  }

  if (linear.k === 0) {
    return { x: point.x, y: linear.func(0) };
  }

  const x = (point.x + linear.k * point.y - linear.k * linear.b) / (linear.k * linear.k + 1);
  const y = (linear.k * linear.k * point.y + linear.k * point.x + linear.b) / (linear.k * linear.k + 1);
  return { x, y };
}

export function toLocalPoint(
  target: fabric.Object,
  point: Point,
  originX: 'left' | 'right' | 'center' = 'left',
  originY: 'top' | 'bottom' | 'center' = 'top',
) {
  return target.toLocalPoint(point as fabric.Point, originX, originY);
}
