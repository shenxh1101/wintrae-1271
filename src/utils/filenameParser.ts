import { IMAGE_EXTENSIONS } from '@/types/constants';
import type { ImageType } from '@/types';

export function extractProductCode(filename: string, customPattern?: string): string {
  const name = removeExtension(filename);

  if (customPattern) {
    try {
      const regex = new RegExp(customPattern);
      const match = name.match(regex);
      if (match) {
        return match[1] || match[0];
      }
    } catch (e) {
      // Invalid pattern, fall through
    }
  }

  const patterns = [
    /^([A-Za-z0-9]{6,20})(?=[-_ ]|$)/,
    /[-_ ]([A-Za-z0-9]{6,20})(?=[-_ ]|$)/,
    /([A-Za-z]{2,}\d{4,}|[A-Za-z]{4,}\d{2,})/,
    /^([A-Za-z0-9]+)(?=[-_ ])/,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match && match[1]) {
      const code = match[1].replace(/[-_ ]/g, '').toUpperCase();
      if (code.length >= 4 && code.length <= 30) {
        return code;
      }
    }
  }

  return name.replace(/[-_ ]/g, '').toUpperCase().slice(0, 20);
}

export function extractImageType(filename: string): ImageType {
  const lower = filename.toLowerCase();

  const mainKeywords = ['主图', 'main', '首图', '封面', '01', '主', 'first'];
  const detailKeywords = ['细节', 'detail', '特写', '展示', 'detailview', 'closeup'];
  const sceneKeywords = ['场景', 'scene', '模特', '实拍', '生活', '场景图', 'model'];

  for (const keyword of mainKeywords) {
    if (lower.includes(keyword)) return 'main';
  }

  for (const keyword of sceneKeywords) {
    if (lower.includes(keyword)) return 'scene';
  }

  for (const keyword of detailKeywords) {
    if (lower.includes(keyword)) return 'detail';
  }

  return 'unknown';
}

export function extractAngle(filename: string, availableAngles: string[]): string {
  const lower = filename.toLowerCase();

  for (const angle of availableAngles) {
    if (lower.includes(angle.toLowerCase())) {
      return angle;
    }
  }

  const anglePatterns = [
    { pattern: /正面|front|qian|正/, angle: '正面' },
    { pattern: /侧面|side|ce|侧/, angle: '侧面' },
    { pattern: /背面|back|hou|背/, angle: '背面' },
    { pattern: /顶部|top|ding|顶/, angle: '顶部' },
    { pattern: /底部|bottom|di|底/, angle: '底部' },
    { pattern: /细节|detail|xj|特写/, angle: '细节' },
  ];

  for (const { pattern, angle } of anglePatterns) {
    if (pattern.test(lower) && availableAngles.includes(angle)) {
      return angle;
    }
  }

  return '';
}

export function extractSequence(filename: string): number | null {
  const name = removeExtension(filename);
  const match = name.match(/(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/[\s]+/g, '_')
    .replace(/[_]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function removeExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return filename;
  return filename.slice(0, lastDotIndex);
}

export function getExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.slice(lastDotIndex).toLowerCase();
}

export function isImageFile(filename: string): boolean {
  const ext = getExtension(filename);
  return IMAGE_EXTENSIONS.includes(ext);
}

export function generateNewName(
  template: string,
  variables: {
    productCode: string;
    platform: string;
    imageType: string;
    sequence: number;
    angle: string;
    date: string;
  },
): string {
  const typeLabels: Record<string, string> = {
    main: '主图',
    detail: '细节图',
    scene: '场景图',
    unknown: '图片',
  };

  let name = template;
  name = name.replace('{商品编码}', variables.productCode);
  name = name.replace('{平台}', variables.platform);
  name = name.replace('{类型}', typeLabels[variables.imageType] || variables.imageType);
  name = name.replace('{序号}', variables.sequence.toString().padStart(2, '0'));
  name = name.replace('{角度}', variables.angle || '');
  name = name.replace('{日期}', variables.date);

  name = name.replace(/^[_-]+|[_-]+$/g, '');
  name = name.replace(/[_-]{2,}/g, '_');

  return sanitizeFilename(name);
}

export function checkNamingConflict(newName: string, existingNames: string[]): boolean {
  return existingNames.some((name) => name.toLowerCase() === newName.toLowerCase());
}
