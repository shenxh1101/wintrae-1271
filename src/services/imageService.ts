import type { ImageItem, ImageIssue, PlatformRule, ProductGroup, ImageType } from '@/types';
import { generatePHash, getImageDataFromFile, isSimilar } from '@/utils/phash';
import { analyzeWhiteBackground, getImageDimensions, isValidAspectRatio } from '@/utils/pixelAnalyzer';
import { extractProductCode, extractImageType, extractAngle, extractSequence, generateNewName, checkNamingConflict } from '@/utils/filenameParser';
import { generateId, formatDateCompact } from '@/utils/formatters';

export async function processImageFile(
  file: File,
  batchId: string,
  platformRule: PlatformRule,
  customSkuPattern?: string,
): Promise<ImageItem> {
  const preview = await createPreview(file);
  const dimensions = await getImageDimensions(file);
  const imageData = await getImageDataFromFile(file);
  const phash = generatePHash(imageData);
  const whiteBackgroundRatio = await analyzeWhiteBackground(file);

  const productCode = extractProductCode(file.name, customSkuPattern);
  const imageType = extractImageType(file.name);
  const angle = extractAngle(file.name, platformRule.settings.requiredAngles);
  const sequence = extractSequence(file.name) || 1;

  const newName = generateNewName(platformRule.namingTemplate, {
    productCode,
    platform: platformRule.name,
    imageType,
    sequence,
    angle,
    date: formatDateCompact(Date.now()),
  });

  const imageItem: ImageItem = {
    id: generateId(),
    batchId,
    originalName: file.name,
    newName,
    productCode,
    imageType,
    angle,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: file.size,
    phash,
    whiteBackgroundRatio,
    isDuplicate: false,
    duplicateOf: null,
    status: 'pending',
    issues: [],
    file,
    preview,
    createdAt: Date.now(),
  };

  return imageItem;
}

export async function createPreview(file: File, maxSize: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取Canvas上下文'));
      return;
    }

    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}

export function validateImage(
  image: ImageItem,
  platformRule: PlatformRule,
  allImages: ImageItem[],
): ImageIssue[] {
  const issues: ImageIssue[] = [];
  const requirement = platformRule.imageRequirements.find((r) => r.type === image.imageType) || platformRule.imageRequirements[0];

  if (!requirement) return issues;

  if (image.width < requirement.minWidth || image.width > requirement.maxWidth || image.height < requirement.minHeight || image.height > requirement.maxHeight) {
    issues.push({
      id: generateId(),
      type: 'dimension',
      severity: 'error',
      description: `尺寸不合规: ${image.width}x${image.height}，要求 ${requirement.minWidth}-${requirement.maxWidth} x ${requirement.minHeight}-${requirement.maxHeight}`,
      suggestion: '请调整图片尺寸至规定范围',
      resolved: false,
    });
  }

  if (requirement.aspectRatio && requirement.aspectRatio !== 'any') {
    if (!isValidAspectRatio(image.width, image.height, requirement.aspectRatio)) {
      issues.push({
        id: generateId(),
        type: 'dimension',
        severity: 'warning',
        description: `宽高比不合规，要求 ${requirement.aspectRatio}`,
        suggestion: '请调整图片宽高比',
        resolved: false,
      });
    }
  }

  if (image.fileSize > requirement.maxFileSize) {
    const maxSizeMB = (requirement.maxFileSize / (1024 * 1024)).toFixed(1);
    const actualSizeMB = (image.fileSize / (1024 * 1024)).toFixed(1);
    issues.push({
      id: generateId(),
      type: 'fileSize',
      severity: 'warning',
      description: `文件过大: ${actualSizeMB}MB，最大 ${maxSizeMB}MB`,
      suggestion: '系统将自动压缩，或手动优化图片',
      resolved: false,
    });
  }

  if (requirement.requireWhiteBackground && image.whiteBackgroundRatio < platformRule.settings.whiteBackgroundThreshold) {
    const actualPercent = (image.whiteBackgroundRatio * 100).toFixed(0);
    const requiredPercent = (platformRule.settings.whiteBackgroundThreshold * 100).toFixed(0);
    issues.push({
      id: generateId(),
      type: 'whiteBackground',
      severity: 'warning',
      description: `非白底图片: 白色占比 ${actualPercent}%，要求 ≥${requiredPercent}%`,
      suggestion: '请使用白底图片或进行抠图处理',
      resolved: false,
    });
  }

  for (const other of allImages) {
    if (other.id === image.id || other.isDuplicate) continue;
    if (isSimilar(image.phash, other.phash, platformRule.settings.duplicateThreshold)) {
      image.isDuplicate = true;
      image.duplicateOf = other.id;
      issues.push({
        id: generateId(),
        type: 'duplicate',
        severity: 'warning',
        description: `与图片 "${other.originalName}" 重复（相似度 ${Math.round((1 - platformRule.settings.duplicateThreshold / 64) * 100)}%）`,
        suggestion: '请确认是否保留或删除重复图片',
        resolved: false,
      });
      break;
    }
  }

  const existingNames = allImages.filter((i) => i.id !== image.id).map((i) => i.newName);
  if (checkNamingConflict(image.newName, existingNames)) {
    issues.push({
      id: generateId(),
      type: 'naming',
      severity: 'error',
      description: `命名冲突: "${image.newName}" 已存在`,
      suggestion: '请修改命名模板或手动调整文件名',
      resolved: false,
    });
  }

  return issues;
}

export function groupImagesByProduct(images: ImageItem[], platformRule: PlatformRule): ProductGroup[] {
  const groups: Record<string, ImageItem[]> = {};

  for (const image of images) {
    if (!groups[image.productCode]) {
      groups[image.productCode] = [];
    }
    groups[image.productCode].push(image);
  }

  return Object.entries(groups).map(([productCode, groupImages]) => {
    const existingAngles = groupImages.map((img) => img.angle).filter(Boolean);
    const missingAngles = platformRule.settings.requiredAngles.filter((angle) => !existingAngles.includes(angle));

    const hasMainImage = groupImages.some((img) => img.imageType === 'main');
    const hasDetailImages = groupImages.some((img) => img.imageType === 'detail');
    const hasSceneImages = groupImages.some((img) => img.imageType === 'scene');

    return {
      id: generateId(),
      productCode,
      imageIds: groupImages.map((img) => img.id),
      missingAngles,
      hasMainImage,
      hasDetailImages,
      hasSceneImages,
    };
  });
}

export function addMissingAngleIssues(
  productGroups: ProductGroup[],
  images: ImageItem[],
  addIssue: (imageId: string, issue: Omit<ImageIssue, 'id'>) => void,
): void {
  for (const group of productGroups) {
    if (group.missingAngles.length > 0) {
      const mainImage = images.find((img) => group.imageIds.includes(img.id) && img.imageType === 'main') || images.find((img) => group.imageIds.includes(img.id));

      if (mainImage) {
        addIssue(mainImage.id, {
          type: 'missingAngle',
          severity: 'info',
          description: `商品 ${group.productCode} 缺少角度: ${group.missingAngles.join('、')}`,
          suggestion: '请补充对应角度的图片',
          resolved: false,
        });
      }
    }
  }
}

export function refineImageType(images: ImageItem[]): ImageItem[] {
  return images.map((img) => {
    if (img.imageType !== 'unknown') return img;

    let newType: ImageType = 'detail';

    if (img.whiteBackgroundRatio >= 0.9 && Math.abs(img.width - img.height) < Math.min(img.width, img.height) * 0.1) {
      newType = 'main';
    } else if (img.whiteBackgroundRatio < 0.7) {
      newType = 'scene';
    }

    return { ...img, imageType: newType };
  });
}

export function generateSequentialNames(images: ImageItem[], platformRule: PlatformRule): ImageItem[] {
  const grouped: Record<string, ImageItem[]> = {};

  for (const img of images) {
    const key = `${img.productCode}_${img.imageType}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(img);
  }

  const updatedImages: ImageItem[] = [];

  for (const group of Object.values(grouped)) {
    const sortedGroup = [...group].sort((a, b) => {
      const seqA = extractSequence(a.originalName) || 0;
      const seqB = extractSequence(b.originalName) || 0;
      return seqA - seqB;
    });

    sortedGroup.forEach((img, index) => {
      const sequence = index + 1;
      const newName = generateNewName(platformRule.namingTemplate, {
        productCode: img.productCode,
        platform: platformRule.name,
        imageType: img.imageType,
        sequence,
        angle: img.angle,
        date: formatDateCompact(Date.now()),
      });

      updatedImages.push({ ...img, newName });
    });
  }

  return updatedImages;
}
