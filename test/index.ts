import { fabric } from 'fabric';
import { AuxiliaryLineRenderer } from '../src/auxiliaryLineRenderer';
import { FabricAutoAdsorber } from '../src/fabricAutoAdsorber';

const canvasEl = document.createElement('canvas');
canvasEl.style.setProperty('border', `${2}px solid`);

document.body.append(canvasEl);

function fabricImageFromURL(url: string, imgOptions?: fabric.IImageOptions) {
  return new Promise<fabric.Image>((resolve, reject) => {
    try {
      fabric.Image.fromURL(url, resolve, { ...imgOptions, crossOrigin: 'anonymous' });
    } catch (error) {
      reject(error);
    }
  });
}

const canvas = new fabric.Canvas(canvasEl, { width: 600, height: 600, centeredScaling: false });
(window as any).canvas = canvas;

async function cloneObject<T extends fabric.Object>(object: T) {
  return new Promise<T>(resolve => {
    object.clone((cloned: T) => {
      resolve(cloned);
    });
  });
}

(async () => {
  const image1 = await fabricImageFromURL('/pic.png');
  image1.set({
    left: 50,
    top: 50,
    scaleX: 0.15,
    scaleY: 0.15,
    angle: 0,
  });

  const image2 = await cloneObject(image1);
  image2.set({
    left: 50,
    top: 225,
    scaleX: 0.15,
    scaleY: 0.15,
    angle: 180,
  });

  const image3 = await cloneObject(image1);
  image3.set({
    left: 50,
    top: 400,
    scaleX: 0.15,
    scaleY: 0.15,
    angle: 270,
  });

  const image4 = await cloneObject(image1);
  image4.set({
    left: 215.63246763185288,
    top: 292,
    scaleX: 0.15,
    scaleY: 0.15,
    angle: -45,
  });

  const image5 = await cloneObject(image1);
  image5.set({
    left: 400,
    top: 50,
    scaleX: 0.15,
    scaleY: 0.15,
    angle: 90,
  });

  canvas.add(image1, image2, image3, image4, image5);
  canvas.renderAll();

  const auxiliaryLineController = new FabricAutoAdsorber({ auxiliaryLineRenderer: new AuxiliaryLineRenderer() });
  auxiliaryLineController.mount(canvas);
})();
