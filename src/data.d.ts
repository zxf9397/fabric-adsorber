import { getFabricEnclosingRect } from './utils/tools';
import { AuxiliaryLineRenderer } from './auxiliaryLineRenderer';

export interface AuxiliaryLine {
  element: HTMLDivElement;
  effects?: EnclosingObject[];
  render?: (
    transform: (
      key: AuxiliaryLineType,
      target: fabric.Object,
      objects: EnclosingObject[],
    ) => Record<'left' | 'top' | 'width' | 'height', number>,
  ) => void;
  active?: fabric.Object;
}

export interface AuxiliaryLineRendererOptions {
  /**
   * 辅助线宽度
   * @default 1
   */
  lineWidth?: number;

  /**
   * 辅助线样式
   * @default "dashed"
   */
  lineStyle?: 'dotted' | 'dashed' | 'solid';

  /**
   * 辅助线颜色
   * @default "#fd7801"
   */
  lineColor?: string;
}

export interface EnclosingObject extends ReturnType<typeof getFabricEnclosingRect> {
  target: fabric.Object;
}

export interface FabricAutoAdsorberOptions {
  /**
   * 拖拽吸附值
   * 靠近外接矩边框线多少像素时自动吸附
   * @default 5
   */
  draggingAdsorption?: number;

  /**
   * 缩放吸附值
   * 靠近外接矩边框线多少像素时自动吸附
   * @default 5
   */
  scalingAdsorption?: number;

  /**
   * 辅助线渲染
   */
  auxiliaryLineRenderer?: AuxiliaryLineRenderer;
}

export type AuxiliaryLineType = 'vertical-left' | 'vertical-right' | 'horizon-top' | 'horizon-bottom';

export type CornerType = 'tl' | 'mt' | 'tr' | 'mr' | 'br' | 'mb' | 'bl' | 'ml';

export type ICornerMap = Readonly<Record<CornerType, CornerType>>;
