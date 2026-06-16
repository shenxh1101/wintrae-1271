export async function analyzeWhiteBackground(file: File, sampleCount: number = 100): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取Canvas上下文'));
      return;
    }

    img.onload = () => {
      const width = img.width;
      const height = img.height;

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0);

      const samplePoints = generateEdgeSamplePoints(width, height, sampleCount);
      let whiteCount = 0;

      for (const point of samplePoints) {
        try {
          const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
          if (isWhitePixel(pixel)) {
            whiteCount++;
          }
        } catch (e) {
          // Skip invalid points
        }
      }

      URL.revokeObjectURL(img.src);
      const ratio = samplePoints.length > 0 ? whiteCount / samplePoints.length : 0;
      resolve(Math.round(ratio * 100) / 100);
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = URL.createObjectURL(file);
  });
}

function generateEdgeSamplePoints(width: number, height: number, count: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const edgeWidth = Math.max(10, Math.floor(Math.min(width, height) * 0.05));
  const perEdge = Math.floor(count / 4);

  for (let i = 0; i < perEdge; i++) {
    const t = i / (perEdge - 1 || 1);
    points.push({ x: Math.floor(t * (width - 1)), y: Math.floor(Math.random() * edgeWidth) });
    points.push({ x: Math.floor(t * (width - 1)), y: height - 1 - Math.floor(Math.random() * edgeWidth) });
    points.push({ x: Math.floor(Math.random() * edgeWidth), y: Math.floor(t * (height - 1)) });
    points.push({ x: width - 1 - Math.floor(Math.random() * edgeWidth), y: Math.floor(t * (height - 1)) });
  }

  const corners = [
    { x: edgeWidth, y: edgeWidth },
    { x: width - 1 - edgeWidth, y: edgeWidth },
    { x: edgeWidth, y: height - 1 - edgeWidth },
    { x: width - 1 - edgeWidth, y: height - 1 - edgeWidth },
  ];
  points.push(...corners);

  return points.slice(0, count);
}

function isWhitePixel(pixel: Uint8ClampedArray): boolean {
  const [r, g, b] = pixel;
  const rgbWhite = r > 240 && g > 240 && b > 240;

  if (rgbWhite) return true;

  const [h, s, v] = rgbToHsv(r, g, b);
  return s < 0.1 && v > 0.95;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const s = max === 0 ? 0 : (max - min) / max;
  const v = max;

  if (max === min) {
    h = 0;
  } else {
    const d = max - min;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, v];
}

export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(img.src);
      resolve({ width, height });
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

export async function compressImage(
  file: File,
  maxSize: number,
  minWidth: number,
  minHeight: number,
  quality: number = 0.9,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let currentQuality = quality;
      let width = img.width;
      let height = img.height;

      const compress = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取Canvas上下文'));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('压缩失败'));
              return;
            }

            if (blob.size <= maxSize || currentQuality <= 0.5) {
              if (blob.size > maxSize && width > minWidth && height > minHeight) {
                const scale = Math.sqrt(maxSize / blob.size) * 0.9;
                width = Math.max(minWidth, Math.floor(width * scale));
                height = Math.max(minHeight, Math.floor(height * scale));
                currentQuality = 0.8;
                compress();
              } else {
                URL.revokeObjectURL(img.src);
                resolve(blob);
              }
            } else {
              currentQuality -= 0.1;
              compress();
            }
          },
          'image/jpeg',
          currentQuality,
        );
      };

      compress();
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

export function isValidAspectRatio(
  width: number,
  height: number,
  aspectRatio: string,
  tolerance: number = 0.05,
): boolean {
  if (!aspectRatio || aspectRatio === 'any') return true;

  const [num, den] = aspectRatio.split(':').map(Number);
  if (!num || !den) return true;

  const targetRatio = num / den;
  const actualRatio = width / height;
  const diff = Math.abs(actualRatio - targetRatio) / targetRatio;

  return diff <= tolerance;
}
