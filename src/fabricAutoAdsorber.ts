import { fabric } from 'fabric';
import { AuxiliaryLineRenderer } from './auxiliaryLineRenderer';
import {
  getFabricEnclosingRect,
  LinearFunction,
  linearFunction,
  pedalPoint,
  Point,
  toLocalPoint,
  withinAdsorptionRange,
} from './utils/tools';
import { FabricAutoAdsorberOptions, AuxiliaryLineType, CornerType, EnclosingObject, ICornerMap } from './data';

const DRAGGING_ADSORPTION = 5;
const SCALING_ADSORPTION = 5;

const CornerMap: ICornerMap = {
  tl: 'br',
  mt: 'mb',
  tr: 'bl',
  mr: 'ml',
  br: 'tl',
  mb: 'mt',
  bl: 'tr',
  ml: 'mr',
};

const FlipXAndYCornerMap: ICornerMap = {
  tl: 'br',
  br: 'tl',
  mt: 'mb',
  mb: 'mt',
  tr: 'bl',
  bl: 'tr',
  mr: 'ml',
  ml: 'mr',
};

const FlipXCornerMap: ICornerMap = {
  tl: 'tr',
  tr: 'tl',
  mr: 'ml',
  ml: 'mr',
  br: 'bl',
  bl: 'br',
  mt: 'mt',
  mb: 'mb',
};

const FlipYCornerMap: ICornerMap = {
  tl: 'bl',
  bl: 'tl',
  mt: 'mb',
  mb: 'mt',
  tr: 'br',
  br: 'tr',
  ml: 'ml',
  mr: 'mr',
};

export class FabricAutoAdsorber<T extends fabric.Canvas> {
  private canvas: T | null = null;
  private lineRenderer: AuxiliaryLineRenderer | null = null;

  private working = false;
  private draggingAdsorption = DRAGGING_ADSORPTION;
  private scalingAdsorption = SCALING_ADSORPTION;
  private objects: EnclosingObject[] = [];

  constructor(options?: FabricAutoAdsorberOptions) {
    this.draggingAdsorption = Math.abs(
      typeof options?.draggingAdsorption === 'number' ? options.draggingAdsorption : DRAGGING_ADSORPTION,
    );
    this.scalingAdsorption = Math.abs(
      typeof options?.scalingAdsorption === 'number' ? options.scalingAdsorption : SCALING_ADSORPTION,
    );
    this.lineRenderer = options?.auxiliaryLineRenderer ? options.auxiliaryLineRenderer : null;
  }

  public mount(canvas: T) {
    this.unmount();

    this.lineRenderer?.mount(canvas);

    this.canvas = canvas;

    this.canvas.on('mouse:down', this.handleWorkBefore);
    this.canvas.on('object:moving', this.handleWork);
    this.canvas.on('object:scaling', this.handleWork);
    this.canvas.on('mouse:up', this.handleWorkAfter);
  }

  public unmount() {
    if (this.canvas) {
      this.canvas.off('mouse:down', this.handleWorkBefore);
      this.canvas.off('object:moving', this.handleWork);
      this.canvas.off('object:scaling', this.handleWork);
      this.canvas.off('mouse:up', this.handleWorkAfter);
    }

    this.lineRenderer?.unmount();
  }

  private handleDrag(e: fabric.IEvent) {
    this.lineRenderer?.clearAuxiliaryLines();

    const active = e.target as Required<fabric.Object>;
    const activeCache = this.objects.find(item => item.target === active) as EnclosingObject;

    const activeLeft = active.left + activeCache.offsetLeft;
    const activeRight = active.left + activeCache.offsetRight;
    const activeTop = active.top + activeCache.offsetTop;
    const activeBottom = active.top + activeCache.offsetBottom;

    this.objects.forEach(object => {
      if (object.target === active) {
        return;
      }

      if (withinAdsorptionRange(activeLeft, object.left, this.draggingAdsorption)) {
        active.set('left', object.left - activeCache.offsetLeft);

        this.lineRenderer?.addEffectToAuxiliaryLine('vertical-left', active, object);
      } else if (withinAdsorptionRange(activeLeft, object.right, this.draggingAdsorption)) {
        active.set('left', object.right - activeCache.offsetLeft);

        this.lineRenderer?.addEffectToAuxiliaryLine('vertical-right', active, object);
      }

      if (withinAdsorptionRange(activeRight, object.right, this.draggingAdsorption)) {
        active.set('left', object.right - activeCache.offsetRight);

        this.lineRenderer?.addEffectToAuxiliaryLine('vertical-right', active, object);
      } else if (withinAdsorptionRange(activeRight, object.left, this.draggingAdsorption)) {
        active.set('left', object.left - activeCache.offsetRight);

        this.lineRenderer?.addEffectToAuxiliaryLine('vertical-left', active, object);
      }

      if (withinAdsorptionRange(activeTop, object.top, this.draggingAdsorption)) {
        active.set('top', object.top - activeCache.offsetTop);

        this.lineRenderer?.addEffectToAuxiliaryLine('horizon-top', active, object);
      } else if (withinAdsorptionRange(activeTop, object.bottom, this.draggingAdsorption)) {
        active.set('top', object.bottom - activeCache.offsetTop);

        this.lineRenderer?.addEffectToAuxiliaryLine('horizon-bottom', active, object);
      }

      if (withinAdsorptionRange(activeBottom, object.bottom, this.draggingAdsorption)) {
        active.set('top', object.bottom - activeCache.offsetBottom);

        this.lineRenderer?.addEffectToAuxiliaryLine('horizon-bottom', active, object);
      } else if (withinAdsorptionRange(activeBottom, object.top, this.draggingAdsorption)) {
        active.set('top', object.top - activeCache.offsetBottom);

        this.lineRenderer?.addEffectToAuxiliaryLine('horizon-top', active, object);
      }
    });

    this.lineRenderer?.renderAuxiliarylines();
  }

  /**
   * TODO:
   * 1. minScaleLimit
   * 2. centeredScaling
   */
  private handleScale(e: fabric.IEvent) {
    this.lineRenderer?.clearAuxiliaryLines();
    const active = e.target as Required<fabric.Object>;
    const transform = e.transform as fabric.Transform;

    if ([transform.originX, transform.originY].some(pos => pos === ('center' as any))) {
      return;
    }

    const pointer = e.pointer as Point;
    const shiftKey = transform.shiftKey;
    const flipX = transform.original.flipX !== active.flipX;
    const flipY = transform.original.flipY !== active.flipY;

    let corner = transform.corner as CornerType;
    if (flipX && flipY) {
      corner = FlipXAndYCornerMap[corner];
    } else if (flipX) {
      corner = FlipXCornerMap[corner];
    } else if (flipY) {
      corner = FlipYCornerMap[corner];
    }

    const angle = (360 + (active.angle % 360)) % 360;
    const rect = getFabricEnclosingRect(active.aCoords);

    let position: Point | undefined;
    let localPosition: Point | undefined;

    this.objects.some(object => {
      if (object.target === active) {
        return;
      }

      const diagonal = linearFunction(active.oCoords[corner], active.oCoords[CornerMap[corner]]);
      const eventPoint = pedalPoint(pointer, diagonal);

      let touchPoint: Point | undefined;
      switch (corner) {
        case 'tl':
        case 'br':
          if (angle !== 45 && angle !== 225) {
            if (withinAdsorptionRange(eventPoint.x, object.right, this.scalingAdsorption)) {
              touchPoint = { x: object.right, y: shiftKey ? pointer.y : diagonal.func(object.right) };
              this.updateAuxiliaryLine({ key: 'vertical-right', active, rect, object });
            } else if (withinAdsorptionRange(eventPoint.x, object.left, this.scalingAdsorption)) {
              touchPoint = { x: object.left, y: shiftKey ? pointer.y : diagonal.func(object.left) };
              this.updateAuxiliaryLine({ key: 'vertical-left', active, rect, object });
            }
          }

          if (angle !== 135 && angle !== 315) {
            if (withinAdsorptionRange(eventPoint.y, object.bottom, this.scalingAdsorption)) {
              touchPoint = { x: shiftKey ? pointer.x : diagonal.reverseFunc(object.bottom), y: object.bottom };
              this.updateAuxiliaryLine({ key: 'horizon-bottom', active, rect, object });
            } else if (withinAdsorptionRange(eventPoint.y, object.top, this.scalingAdsorption)) {
              touchPoint = { x: shiftKey ? pointer.x : diagonal.reverseFunc(object.top), y: object.top };
              this.updateAuxiliaryLine({ key: 'horizon-top', active, rect, object });
            }
          }
          break;
        case 'tr':
        case 'bl':
          if (angle !== 135 && angle !== 315) {
            if (withinAdsorptionRange(eventPoint.x, object.right, this.scalingAdsorption)) {
              touchPoint = { x: object.right, y: shiftKey ? pointer.y : diagonal.func(object.right) };
              this.updateAuxiliaryLine({ key: 'vertical-right', active, rect, object });
            } else if (withinAdsorptionRange(eventPoint.x, object.left, this.scalingAdsorption)) {
              touchPoint = { x: object.left, y: shiftKey ? pointer.y : diagonal.func(object.left) };
              this.updateAuxiliaryLine({ key: 'vertical-left', active, rect, object });
            }
          }

          if (angle !== 45 && angle !== 225) {
            if (withinAdsorptionRange(eventPoint.y, object.bottom, this.scalingAdsorption)) {
              touchPoint = { x: shiftKey ? pointer.x : diagonal.reverseFunc(object.bottom), y: object.bottom };
              this.updateAuxiliaryLine({ key: 'horizon-bottom', active, rect, object });
            } else if (withinAdsorptionRange(eventPoint.y, object.top, this.scalingAdsorption)) {
              touchPoint = { x: shiftKey ? pointer.x : diagonal.reverseFunc(object.top), y: object.top };
              this.updateAuxiliaryLine({ key: 'horizon-top', active, rect, object });
            }
          }
          break;
      }

      if (!touchPoint) {
        return;
      }

      switch (corner) {
        case 'tl':
          position = touchPoint;
          localPosition = toLocalPoint(active, touchPoint, 'right', 'bottom');
          break;
        case 'tr':
          position = pedalPoint(touchPoint, linearFunction(active.oCoords.tl, active.oCoords.bl));
          localPosition = toLocalPoint(active, touchPoint, 'left', 'bottom');
          break;
        case 'br':
          position = active.oCoords.tl;
          localPosition = toLocalPoint(active, touchPoint, 'left', 'top');
          break;
        case 'bl':
          position = pedalPoint(touchPoint, linearFunction(active.oCoords.tl, active.oCoords.tr));
          localPosition = toLocalPoint(active, touchPoint, 'right', 'top');
          break;
      }
    });

    if (position && localPosition) {
      active.set({
        left: position.x,
        top: position.y,
        scaleX: Math.abs(localPosition.x) / active.width,
        scaleY: Math.abs(localPosition.y) / active.height,
      });
    }

    this.lineRenderer?.renderAuxiliarylines();
  }

  /**
   * TODO:
   * 1. minScaleLimit
   * 2. centeredScaling
   */
  private handleScaleXOrY(e: fabric.IEvent) {
    this.lineRenderer?.clearAuxiliaryLines();

    const transform = e.transform as fabric.Transform;
    if ([transform.originX, transform.originY].some(pos => pos === ('center' as any))) {
      return;
    }

    const active = e.target as Required<fabric.Object>;
    const pointer = e.pointer as Point;

    let corner = transform.corner as CornerType;
    if (transform.original.flipX !== active.flipX) {
      corner = FlipXCornerMap[corner];
    } else if (transform.original.flipY !== active.flipY) {
      corner = FlipYCornerMap[corner];
    }

    let xLinear: LinearFunction;
    let yLinear: LinearFunction;
    let position: Point | undefined;
    let localPosition: Point | undefined;

    const angle = (360 + (active.angle % 360)) % 360;
    const rect = getFabricEnclosingRect(active.aCoords);

    const firstOrThirdQuadrant = (0 <= angle && angle < 90) || (180 <= angle && angle < 270);

    if ((firstOrThirdQuadrant && corner === 'ml') || (!firstOrThirdQuadrant && corner === 'mr')) {
      xLinear = linearFunction(active.oCoords.bl, active.oCoords.br);
      yLinear = linearFunction(active.oCoords.tl, active.oCoords.tr);
    } else if ((firstOrThirdQuadrant && corner === 'mr') || (!firstOrThirdQuadrant && corner === 'ml')) {
      xLinear = linearFunction(active.oCoords.tl, active.oCoords.tr);
      yLinear = linearFunction(active.oCoords.bl, active.oCoords.br);
    } else if ((firstOrThirdQuadrant && corner === 'mt') || (!firstOrThirdQuadrant && corner === 'mb')) {
      xLinear = linearFunction(active.oCoords.tr, active.oCoords.br);
      yLinear = linearFunction(active.oCoords.tl, active.oCoords.bl);
    } else {
      xLinear = linearFunction(active.oCoords.tl, active.oCoords.bl);
      yLinear = linearFunction(active.oCoords.tr, active.oCoords.br);
    }

    const xPoint = pedalPoint(pointer, xLinear);
    const yPoint = pedalPoint(pointer, yLinear);

    this.objects.forEach(object => {
      if (object.target === active) {
        return;
      }

      const { xTouchPoint, yTouchPoint } = this.getTouchedPoint({
        angle,
        xPoint,
        yPoint,
        xLinear,
        yLinear,
        object,
        active,
        rect,
      });

      if (firstOrThirdQuadrant) {
        switch (corner) {
          case 'ml':
            if (xTouchPoint) {
              position = pedalPoint(xTouchPoint, yLinear);
              localPosition = toLocalPoint(active, position, 'right', 'bottom');
            }

            if (yTouchPoint) {
              position = yTouchPoint;
              localPosition = toLocalPoint(active, position, 'right', 'bottom');
            }
            break;
          case 'mr':
            if (xTouchPoint) {
              position = active.aCoords.tl;
              localPosition = toLocalPoint(active, xTouchPoint, 'left', 'bottom');
            }

            if (yTouchPoint) {
              position = active.aCoords.tl;
              localPosition = toLocalPoint(active, yTouchPoint, 'left', 'top');
            }
            break;
          case 'mt':
            if (xTouchPoint) {
              position = pedalPoint(xTouchPoint, yLinear);
              localPosition = toLocalPoint(active, position, 'right', 'bottom');
            }

            if (yTouchPoint) {
              position = yTouchPoint;
              localPosition = toLocalPoint(active, position, 'right', 'bottom');
            }
            break;
          case 'mb':
            if (xTouchPoint) {
              position = active.aCoords.tl;
              localPosition = toLocalPoint(active, xTouchPoint, 'right', 'top');
            }

            if (yTouchPoint) {
              position = active.aCoords.tl;
              localPosition = toLocalPoint(active, yTouchPoint, 'left', 'top');
            }
            break;
        }
      } else {
        switch (corner) {
          case 'ml':
            if (xTouchPoint) {
              position = xTouchPoint;
              localPosition = toLocalPoint(active, position, 'right', 'bottom');
            }

            if (yTouchPoint) {
              position = pedalPoint(yTouchPoint, xLinear);
              localPosition = toLocalPoint(active, position, 'right', 'bottom');
            }
            break;
          case 'mr':
            if (xTouchPoint) {
              position = active.aCoords.tl;
              localPosition = toLocalPoint(active, xTouchPoint, 'left', 'top');
            }

            if (yTouchPoint) {
              position = active.aCoords.tl;
              localPosition = toLocalPoint(active, yTouchPoint, 'left', 'bottom');
            }
            break;
          case 'mt':
            if (xTouchPoint) {
              position = pedalPoint(xTouchPoint, xLinear);
              localPosition = toLocalPoint(active, position, 'right', 'bottom');
            }

            if (yTouchPoint) {
              position = pedalPoint(yTouchPoint, xLinear);
              localPosition = toLocalPoint(active, position, 'right', 'bottom');
            }
            break;
          case 'mb':
            if (xTouchPoint) {
              position = active.aCoords.tl;
              localPosition = toLocalPoint(active, xTouchPoint, 'left', 'top');
            }

            if (yTouchPoint) {
              position = active.aCoords.tl;
              localPosition = toLocalPoint(active, yTouchPoint, 'right', 'top');
            }
            break;
        }
      }
    });

    if (position && localPosition) {
      active.set({
        left: position.x,
        top: position.y,
        scaleX: Math.abs(localPosition.x) / active.width,
        scaleY: Math.abs(localPosition.y) / active.height,
      });
    }

    this.lineRenderer?.renderAuxiliarylines();
  }

  private getTouchedPoint(data: {
    angle: number;
    xPoint: Point;
    yPoint: Point;
    object: EnclosingObject;
    xLinear: LinearFunction;
    yLinear: LinearFunction;
    active: fabric.Object;
    rect: ReturnType<typeof getFabricEnclosingRect>;
  }) {
    const { angle, xPoint, yPoint, object, xLinear, yLinear, active, rect } = data;

    let xTouchPoint: Point | undefined;
    let yTouchPoint: Point | undefined;

    if (angle !== 90 && angle !== 270) {
      if (withinAdsorptionRange(xPoint.x, object.right, this.scalingAdsorption)) {
        xTouchPoint = { x: object.right, y: xLinear.func(object.right) };

        this.updateAuxiliaryLine({ key: 'vertical-right', active, rect, object });
      } else if (withinAdsorptionRange(xPoint.x, object.left, this.scalingAdsorption)) {
        xTouchPoint = { x: object.left, y: xLinear.func(object.left) };

        this.updateAuxiliaryLine({ key: 'vertical-left', active, rect, object });
      }
    }

    if (angle !== 0 && angle !== 180) {
      if (withinAdsorptionRange(yPoint.y, object.bottom, this.scalingAdsorption)) {
        yTouchPoint = { x: yLinear.reverseFunc(object.bottom), y: object.bottom };

        this.updateAuxiliaryLine({ key: 'horizon-bottom', active, rect, object });
      } else if (withinAdsorptionRange(yPoint.y, object.top, this.scalingAdsorption)) {
        yTouchPoint = { x: yLinear.reverseFunc(object.top), y: object.top };

        this.updateAuxiliaryLine({ key: 'horizon-top', active, rect, object });
      }
    }

    return { xTouchPoint, yTouchPoint };
  }

  private updateAuxiliaryLine(params: {
    key: AuxiliaryLineType;
    active: fabric.Object;
    rect: ReturnType<typeof getFabricEnclosingRect>;
    object: EnclosingObject;
  }) {
    const { key, active, rect, object } = params;
    switch (key) {
      case 'vertical-left':
        (withinAdsorptionRange(rect.right, object.left, 0.00001) ||
          withinAdsorptionRange(rect.left, object.left, 0.00001)) &&
          this.lineRenderer?.addEffectToAuxiliaryLine('vertical-left', active, object);
        break;
      case 'vertical-right':
        (withinAdsorptionRange(rect.right, object.right, 0.00001) ||
          withinAdsorptionRange(rect.left, object.right, 0.00001)) &&
          this.lineRenderer?.addEffectToAuxiliaryLine('vertical-right', active, object);
        break;
      case 'horizon-top':
        (withinAdsorptionRange(rect.top, object.top, 0.00001) ||
          withinAdsorptionRange(rect.bottom, object.top, 0.00001)) &&
          this.lineRenderer?.addEffectToAuxiliaryLine('horizon-top', active, object);
        break;
      case 'horizon-bottom':
        (withinAdsorptionRange(rect.top, object.bottom, 0.00001) ||
          withinAdsorptionRange(rect.bottom, object.bottom, 0.00001)) &&
          this.lineRenderer?.addEffectToAuxiliaryLine('horizon-bottom', active, object);
        break;
    }
  }

  /**
   * collect objects when mouse:down
   * @param {fabric.IEvent} e
   */
  public handleWorkBefore = (e: fabric.IEvent) => {
    const target = e.target as Required<fabric.Object>;
    if (target && this.canvas) {
      const activeSelectionObjects =
        target.type === 'activeSelection' ? (target as fabric.ActiveSelection)._objects : null;

      this.objects = this.canvas._objects.reduce<EnclosingObject[]>((objects, object) => {
        if (!activeSelectionObjects?.includes(object)) {
          objects.push({
            ...getFabricEnclosingRect(object.aCoords as Required<fabric.Object>['aCoords']),
            target: object,
          });
        }

        return objects;
      }, []);

      activeSelectionObjects &&
        this.objects.push({
          ...getFabricEnclosingRect(target.aCoords),
          target,
        });

      this.working = true;
    }
  };

  /**
   * if the rect is within the adsorption range during object:moving or object:scaling
   * automatic adsorption
   * @param {fabric.IEvent} e
   * @returns
   */
  public handleWork = (e: fabric.IEvent) => {
    if (!this.working) {
      return;
    }

    const action = (e.transform as any).action;
    switch (action) {
      case 'drag':
        this.handleDrag(e);
        break;
      case 'scale':
        this.handleScale(e);
        break;
      case 'scaleX':
      case 'scaleY':
        this.handleScaleXOrY(e);
        break;
    }
  };

  /**
   * clean event after mouse:up
   * @param {fabric.IEvent} e
   */
  public handleWorkAfter = (e?: fabric.IEvent) => {
    if (this.working) {
      this.working = false;
      this.lineRenderer?.clearAuxiliaryLines();
    }
  };
}
