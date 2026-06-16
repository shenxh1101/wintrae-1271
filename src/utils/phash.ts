import { P_HASH_SIZE, P_HASH_SMALL_SIZE } from '@/types/constants';

export function generatePHash(imageData: ImageData): string {
  const smallSize = P_HASH_SIZE;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = smallSize;
  canvas.height = smallSize;
  ctx.putImageData(imageData, 0, 0);

  const smallCanvas = document.createElement('canvas');
  const smallCtx = smallCanvas.getContext('2d');
  if (!smallCtx) return '';

  smallCanvas.width = smallSize;
  smallCanvas.height = smallSize;
  smallCtx.drawImage(canvas, 0, 0, smallSize, smallSize);

  const imageDataSmall = smallCtx.getImageData(0, 0, smallSize, smallSize);
  const grayPixels = convertToGrayscale(imageDataSmall);

  const dct = applyDCT(grayPixels, smallSize);

  const dctSmall: number[] = [];
  for (let y = 0; y < P_HASH_SMALL_SIZE; y++) {
    for (let x = 0; x < P_HASH_SMALL_SIZE; x++) {
      dctSmall.push(dct[y * smallSize + x]);
    }
  }

  const sum = dctSmall.reduce((a, b) => a + b, 0);
  const avg = sum / dctSmall.length;

  let hash = '';
  for (let i = 0; i < dctSmall.length; i++) {
    hash += dctSmall[i] >= avg ? '1' : '0';
  }

  return hash;
}

function convertToGrayscale(imageData: ImageData): number[] {
  const pixels: number[] = [];
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    pixels.push(gray);
  }

  return pixels;
}

function applyDCT(pixels: number[], size: number): number[] {
  const dct: number[] = new Array(size * size).fill(0);

  for (let u = 0; u < size; u++) {
    for (let v = 0; v < size; v++) {
      let sum = 0;
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;

      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const pixel = pixels[y * size + x];
          sum +=
            pixel *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
        }
      }

      dct[v * size + u] = (2 / size) * cu * cv * sum;
    }
  }

  return dct;
}

export function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

export function isSimilar(hash1: string, hash2: string, threshold: number = 5): boolean {
  if (!hash1 || !hash2) return false;
  return hammingDistance(hash1, hash2) <= threshold;
}

export async function getImageDataFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取Canvas上下文'));
      return;
    }

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(imageData);
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = URL.createObjectURL(file);
  });
}
