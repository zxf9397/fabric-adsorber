import { fabric } from 'fabric';
import { getEnclosingRect, getFabricEnclosingRect, setCSSProperties } from './utils/tools';
import { AuxiliaryLine, AuxiliaryLineRendererOptions, AuxiliaryLineType, EnclosingObject } from './data';

const DEFAULT_WIDTH = 1;
const DEFAULT_STYLE = 'dashed';
const DEFAULT_COLOR = '#fd7801';

export class AuxiliaryLineRenderer {
  private container: HTMLDivElement | null = null;
  private lineMap = new Map<AuxiliaryLineType, AuxiliaryLine>();

  private lineWidth = DEFAULT_WIDTH;
  private lineStyle = DEFAULT_STYLE;
  private lineColor = DEFAULT_COLOR;

  constructor(options?: AuxiliaryLineRendererOptions) {
    this.lineWidth = typeof options?.lineWidth === 'number' ? options.lineWidth : DEFAULT_WIDTH;
    this.lineStyle = options?.lineStyle || DEFAULT_STYLE;
    this.lineColor = options?.lineColor || DEFAULT_COLOR;
  }

  /** 挂载 */
  public mount = (canvas: fabric.Canvas) => {
    this.unmount();

    const canvasEl = canvas.getElement();
    this.container = document.createElement('div');

    setCSSProperties(this.container, {
      position: 'relative',
      width: `${canvasEl.width}px`,
      height: `${canvasEl.height}px`,
      border: canvasEl.style.border,
      'border-width': canvasEl.style.borderWidth,
      'border-left-width': canvasEl.style.borderLeftWidth,
      'border-top-width': canvasEl.style.borderTopWidth,
      overflow: 'hidden',
    });

    canvasEl.after(this.container);
  };

  /** 卸载 */
  public unmount = () => {
    this.container?.remove();
    this.container = null;
    this.lineMap.clear();
  };

  /** 添加辅助线 */
  private setAuxiliaryLine(key: AuxiliaryLineType) {
    let auxiliaryLine = this.lineMap.get(key);

    if (auxiliaryLine) {
      return auxiliaryLine;
    }

    const element = document.createElement('div');
    element.setAttribute('data-auxiliary-line-key', key);
    this.container?.appendChild(element);

    const lineStyle = `${this.lineWidth}px ${this.lineStyle} ${this.lineColor}`;

    auxiliaryLine = {
      element,
      render(transform) {
        if (!element) {
          return;
        }

        const {
          left = 0,
          top = 0,
          width = 0,
          height = 0,
        } = this.active && this.effects?.length ? transform(key, this.active, this.effects) : {};

        setCSSProperties(element, {
          position: 'absolute',
          transform: `translate3d(${left}px, ${top}px, 0)`,
          width: `${width}px`,
          height: `${height}px`,
          'border-left': width === 0 && height !== 0 ? lineStyle : 'none',
          'border-top': height === 0 && width !== 0 ? lineStyle : 'none',
        });
      },
    };

    this.lineMap.set(key, auxiliaryLine);

    return auxiliaryLine;
  }

  public addEffectToAuxiliaryLine = (key: AuxiliaryLineType, active: fabric.Object, ...effect: EnclosingObject[]) => {
    const auxiliaryLine = this.setAuxiliaryLine(key);

    const effects = auxiliaryLine.effects || [];
    effects.push(...effect);

    auxiliaryLine.active = active;
    auxiliaryLine.effects = effects;
  };

  /** 清空辅助线 */
  public clearAuxiliaryLines = () => {
    this.container?.style.setProperty('visibility', 'hidden');

    this.lineMap.forEach(auxiliaryLine => {
      delete auxiliaryLine.active;
      auxiliaryLine.effects = [];
    });
  };

  private renderAuxiliaryLine(key: AuxiliaryLineType, target: fabric.Object, objects: EnclosingObject[]) {
    let left = 0,
      top = 0,
      width = 0,
      height = 0;

    const rect = getEnclosingRect(
      getFabricEnclosingRect(target.aCoords as Required<fabric.Object>['aCoords']),
      ...objects,
    );

    switch (key) {
      case 'vertical-left':
        left = objects[0].left - this.lineWidth;
        top = rect.top;
        height = rect.height;
        break;
      case 'vertical-right':
        left = objects[0].right;
        top = rect.top;
        height = rect.height;
        break;
      case 'horizon-top':
        left = rect.left;
        top = objects[0].top - this.lineWidth;
        width = rect.width;
        break;
      case 'horizon-bottom':
        left = rect.left;
        top = objects[0].bottom;
        width = rect.width;
        break;
    }

    return { left, top, width, height };
  }

  /** 渲染辅助线 */
  public renderAuxiliarylines = () => {
    this.lineMap.forEach(line => line.render?.(this.renderAuxiliaryLine.bind(this)));
    this.container?.style.setProperty('visibility', 'visible');
  };
}
