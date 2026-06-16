import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import type { ImageItem, ProcessBatch, PlatformRule, ExportConfig } from '@/types';
import { formatDate, formatDateCompact, formatFileSize, generateId } from '@/utils/formatters';
import { compressImage } from '@/utils/pixelAnalyzer';
import { downloadBlob } from './fileService';
import { ISSUE_TYPE_LABELS, SEVERITY_LABELS, IMAGE_TYPE_LABELS } from '@/types/constants';

export interface ExportResult {
  filename: string;
  uploadCount: number;
  compressedCount: number;
  issueCount: number;
  reviewCount: number;
}

export function calculateExportPreview(
  batch: ProcessBatch,
  config: ExportConfig,
): {
  upload: { count: number; products: number };
  compressed: { count: number; products: number; sizeSaved: string };
  issue: { count: number };
  review: { count: number };
  validation: {
    totalProducts: number;
    completeProducts: number;
    missingProducts: number;
    missingList: { productCode: string; missingAngles: string[]; imageCount: number }[];
  };
} {
  const uniqueProducts = new Set<string>();
  let uploadCount = 0;
  let compressedCount = 0;
  let originalSize = 0;
  let estimatedCompressedSize = 0;

  for (const img of batch.images) {
    if (img.isDuplicate) continue;
    uniqueProducts.add(img.productCode);

    if (config.generateUploadFolder) {
      uploadCount++;
      originalSize += img.fileSize;
    }
    if (config.generateCompressed) {
      compressedCount++;
      estimatedCompressedSize += img.fileSize * (1 - (1 - config.compressionQuality) * 0.6);
    }
  }

  let issueCount = 0;
  for (const img of batch.images) {
    for (const issue of img.issues) {
      if (!issue.resolved) issueCount++;
    }
  }

  let reviewCount = 0;
  if (config.generateReviewList) {
    reviewCount = batch.images.filter(
      (img) =>
        img.issues.some((i) => i.severity === 'warning' && !i.resolved) ||
        (img.whiteBackgroundRatio >= 0.85 && img.whiteBackgroundRatio < 0.95) ||
        img.imageType === 'unknown',
    ).length;
  }

  const sizeSavedKB = Math.max(0, Math.round((originalSize - estimatedCompressedSize) / 1024));

  const productImageCount: Record<string, number> = {};
  for (const img of batch.images) {
    if (img.isDuplicate) continue;
    productImageCount[img.productCode] = (productImageCount[img.productCode] || 0) + 1;
  }

  const missingList = batch.productGroups
    .filter((g) => g.missingAngles.length > 0)
    .map((g) => ({
      productCode: g.productCode,
      missingAngles: g.missingAngles,
      imageCount: productImageCount[g.productCode] || 0,
    }))
    .sort((a, b) => b.missingAngles.length - a.missingAngles.length);

  const totalProducts = batch.productGroups.length;
  const missingProducts = missingList.length;
  const completeProducts = totalProducts - missingProducts;

  return {
    upload: {
      count: config.generateUploadFolder ? uploadCount : 0,
      products: config.generateUploadFolder ? uniqueProducts.size : 0,
    },
    compressed: {
      count: config.generateCompressed ? compressedCount : 0,
      products: config.generateCompressed ? uniqueProducts.size : 0,
      sizeSaved: sizeSavedKB > 1024 ? `${(sizeSavedKB / 1024).toFixed(1)} MB` : `${sizeSavedKB} KB`,
    },
    issue: { count: config.generateIssueReport ? issueCount : 0 },
    review: { count: reviewCount },
    validation: {
      totalProducts,
      completeProducts,
      missingProducts,
      missingList,
    },
  };
}

export async function exportResults(
  batch: ProcessBatch,
  platformRule: PlatformRule,
  config: ExportConfig,
): Promise<ExportResult | null> {
  const zip = new JSZip();
  const timestamp = formatDateCompact(Date.now());
  const baseFolder = `${platformRule.name}_图片处理_${timestamp}`;

  let uploadCount = 0;
  let compressedCount = 0;

  if (config.generateUploadFolder) {
    const uploadFolder = zip.folder(`${baseFolder}/待上传`);
    if (uploadFolder) {
      uploadCount = await addImagesToFolder(uploadFolder, batch.images, platformRule, false);
    }
  }

  if (config.generateCompressed) {
    const compressedFolder = zip.folder(`${baseFolder}/压缩副本`);
    if (compressedFolder) {
      compressedCount = await addImagesToFolder(compressedFolder, batch.images, platformRule, true, config.compressionQuality);
    }
  }

  let issueCount = 0;
  if (config.generateIssueReport) {
    const issueReport = generateIssueReport(batch, platformRule);
    zip.file(`${baseFolder}/问题报告.xlsx`, issueReport);

    const issueCsv = generateIssueCsv(batch);
    zip.file(`${baseFolder}/问题清单.csv`, issueCsv);

    for (const img of batch.images) {
      for (const issue of img.issues) {
        if (!issue.resolved) issueCount++;
      }
    }
  }

  let reviewCount = 0;
  if (config.generateReviewList) {
    const { list, count } = generateReviewList(batch);
    reviewCount = count;
    zip.file(`${baseFolder}/人工复核列表.txt`, list);
  }

  const summaryReport = generateSummaryReport(batch, platformRule);
  zip.file(`${baseFolder}/处理总结.txt`, summaryReport);

  const content = await zip.generateAsync({ type: 'blob' });
  const filename = `${baseFolder}.zip`;
  downloadBlob(content, filename);

  return { filename, uploadCount, compressedCount, issueCount, reviewCount };
}

async function addImagesToFolder(
  folder: JSZip,
  images: ImageItem[],
  platformRule: PlatformRule,
  compress: boolean,
  quality: number = 0.9,
): Promise<number> {
  const grouped: Record<string, ImageItem[]> = {};
  let added = 0;

  for (const img of images) {
    if (img.isDuplicate) continue;
    const key = img.productCode;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(img);
  }

  for (const [productCode, groupImages] of Object.entries(grouped)) {
    const productFolder = folder.folder(productCode);
    if (!productFolder) continue;

    for (const img of groupImages) {
      if (!img.file) continue;

      const ext = img.originalName.slice(img.originalName.lastIndexOf('.'));
      const filename = `${img.newName}${ext}`;

      if (compress) {
        const requirement = platformRule.imageRequirements.find((r) => r.type === img.imageType) || platformRule.imageRequirements[0];
        if (requirement && img.fileSize > requirement.maxFileSize) {
          const compressedBlob = await compressImage(
            img.file,
            requirement.maxFileSize,
            requirement.minWidth,
            requirement.minHeight,
            quality,
          );
          productFolder.file(filename, compressedBlob);
          added++;
          continue;
        }
      }
      productFolder.file(filename, img.file);
      added++;
    }
  }

  return added;
}

function generateIssueReport(batch: ProcessBatch, platformRule: PlatformRule): Blob {
  const issuesData: any[] = [];
  const summaryData: any[] = [];

  const issueStats: Record<string, number> = {};

  for (const img of batch.images) {
    for (const issue of img.issues) {
      if (issue.resolved) continue;

      issuesData.push({
        '商品编码': img.productCode,
        '原文件名': img.originalName,
        '新文件名': img.newName,
        '图片类型': IMAGE_TYPE_LABELS[img.imageType] || img.imageType,
        '尺寸': `${img.width}x${img.height}`,
        '文件大小': formatFileSize(img.fileSize),
        '问题类型': ISSUE_TYPE_LABELS[issue.type] || issue.type,
        '严重程度': SEVERITY_LABELS[issue.severity] || issue.severity,
        '问题描述': issue.description,
        '处理建议': issue.suggestion,
      });

      issueStats[issue.type] = (issueStats[issue.type] || 0) + 1;
    }
  }

  summaryData.push({
    '项目': '处理平台',
    '内容': platformRule.name,
  });
  summaryData.push({
    '项目': '处理时间',
    '内容': formatDate(batch.startTime),
  });
  summaryData.push({
    '项目': '图片总数',
    '内容': batch.totalImages,
  });
  summaryData.push({
    '项目': '问题总数',
    '内容': batch.issueCount,
  });

  for (const [type, count] of Object.entries(issueStats)) {
    summaryData.push({
      '项目': ISSUE_TYPE_LABELS[type] || type,
      '内容': count,
    });
  }

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(summaryData);
  const ws2 = XLSX.utils.json_to_sheet(issuesData);

  XLSX.utils.book_append_sheet(wb, ws1, '处理总结');
  XLSX.utils.book_append_sheet(wb, ws2, '问题明细');

  return new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function generateIssueCsv(batch: ProcessBatch): string {
  const headers = ['商品编码', '原文件名', '问题类型', '严重程度', '问题描述', '处理建议'];
  const rows = [headers.join(',')];

  for (const img of batch.images) {
    for (const issue of img.issues) {
      if (issue.resolved) continue;
      rows.push(
        [
          img.productCode,
          `"${img.originalName}"`,
          ISSUE_TYPE_LABELS[issue.type] || issue.type,
          SEVERITY_LABELS[issue.severity] || issue.severity,
          `"${issue.description}"`,
          `"${issue.suggestion}"`,
        ].join(','),
      );
    }
  }

  return rows.join('\n');
}

function generateReviewList(batch: ProcessBatch): { list: string; count: number } {
  const lines: string[] = [];
  lines.push('人工复核列表');
  lines.push(`生成时间: ${formatDate(Date.now())}`);
  lines.push('='.repeat(60));
  lines.push('');

  const borderCases = batch.images.filter(
    (img) =>
      img.issues.some((i) => i.severity === 'warning' && !i.resolved) ||
      (img.whiteBackgroundRatio >= 0.85 && img.whiteBackgroundRatio < 0.95) ||
      img.imageType === 'unknown',
  );

  if (borderCases.length === 0) {
    lines.push('暂无需要人工复核的图片');
    return { list: lines.join('\n'), count: 0 };
  }

  lines.push(`共 ${borderCases.length} 张图片需要人工复核:`);
  lines.push('');

  for (let i = 0; i < borderCases.length; i++) {
    const img = borderCases[i];
    lines.push(`${i + 1}. ${img.originalName}`);
    lines.push(`   商品编码: ${img.productCode}`);
    lines.push(`   类型: ${IMAGE_TYPE_LABELS[img.imageType]}`);
    lines.push(`   白底占比: ${(img.whiteBackgroundRatio * 100).toFixed(1)}%`);
    lines.push(`   尺寸: ${img.width}x${img.height}`);
    lines.push(`   问题:`);
    for (const issue of img.issues) {
      if (!issue.resolved) {
        lines.push(`     - [${SEVERITY_LABELS[issue.severity]}] ${issue.description}`);
      }
    }
    lines.push('');
  }

  return { list: lines.join('\n'), count: borderCases.length };
}

function generateSummaryReport(batch: ProcessBatch, platformRule: PlatformRule): string {
  const lines: string[] = [];
  const duration = batch.endTime ? batch.endTime - batch.startTime : 0;

  lines.push('图片处理总结报告');
  lines.push('='.repeat(60));
  lines.push(`平台: ${platformRule.name}`);
  lines.push(`开始时间: ${formatDate(batch.startTime)}`);
  if (batch.endTime) {
    lines.push(`结束时间: ${formatDate(batch.endTime)}`);
    lines.push(`处理时长: ${formatDuration(duration)}`);
  }
  lines.push('');
  lines.push('统计信息:');
  lines.push(`  图片总数: ${batch.totalImages}`);
  lines.push(`  已处理: ${batch.processedImages}`);
  lines.push(`  问题数: ${batch.issueCount}`);
  lines.push(`  商品组数: ${batch.productGroups.length}`);
  lines.push('');

  const typeStats: Record<string, number> = {};
  const productWithMain = batch.productGroups.filter((g) => g.hasMainImage).length;
  const productWithDetail = batch.productGroups.filter((g) => g.hasDetailImages).length;
  const productWithScene = batch.productGroups.filter((g) => g.hasSceneImages).length;
  const productsMissingAngles = batch.productGroups.filter((g) => g.missingAngles.length > 0).length;

  for (const img of batch.images) {
    typeStats[img.imageType] = (typeStats[img.imageType] || 0) + 1;
  }

  lines.push('图片类型分布:');
  for (const [type, count] of Object.entries(typeStats)) {
    lines.push(`  ${IMAGE_TYPE_LABELS[type] || type}: ${count} 张`);
  }
  lines.push('');

  lines.push('商品完整性:');
  lines.push(`  有主图的商品: ${productWithMain}/${batch.productGroups.length}`);
  lines.push(`  有细节图的商品: ${productWithDetail}/${batch.productGroups.length}`);
  lines.push(`  有场景图的商品: ${productWithScene}/${batch.productGroups.length}`);
  lines.push(`  缺少角度的商品: ${productsMissingAngles}/${batch.productGroups.length}`);
  lines.push('');

  const issueStats: Record<string, number> = {};
  for (const img of batch.images) {
    for (const issue of img.issues) {
      if (!issue.resolved) {
        issueStats[issue.type] = (issueStats[issue.type] || 0) + 1;
      }
    }
  }

  if (Object.keys(issueStats).length > 0) {
    lines.push('问题统计:');
    for (const [type, count] of Object.entries(issueStats)) {
      lines.push(`  ${ISSUE_TYPE_LABELS[type] || type}: ${count} 个`);
    }
  }

  lines.push('');
  lines.push(`报告编号: ${generateId()}`);

  return lines.join('\n');
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟${seconds % 60}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}
