import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { useProcessStore } from '@/store/processStore';
import { processImageFile, validateImage, groupImagesByProduct, addMissingAngleIssues, refineImageType, generateSequentialNames, buildProductSnapshots } from '@/services/imageService';
import { selectFiles, selectFolder, FileWithPath, convertToImageRecord } from '@/services/fileService';
import { exportResults } from '@/services/exportService';
import type { ImageItem, TimelineEvent } from '@/types';
import { generateId } from '@/utils/formatters';

export function useImageProcessor() {
  const { selectedPlatformId, customSkuPattern, exportConfig, getPlatformRule, addProcessRecord, updateProcessRecord, appendTimelineEvent } = useAppStore();
  const {
    currentBatch,
    isProcessing,
    initializeBatch,
    addImages,
    updateImage,
    setProductGroups,
    setStatus,
    setProgress,
    setIsProcessing,
    completeBatch,
    resetBatch,
  } = useProcessStore();

  const handleSelectFiles = useCallback(async () => {
    if (!selectedPlatformId) {
      alert('请先选择一个平台');
      return;
    }

    const platformRule = getPlatformRule(selectedPlatformId);
    if (!platformRule) {
      alert('平台规则不存在');
      return;
    }

    const files = await selectFiles();
    if (files.length === 0) return;

    await processFiles(files, platformRule);
  }, [selectedPlatformId, getPlatformRule]);

  const handleSelectFolder = useCallback(async () => {
    if (!selectedPlatformId) {
      alert('请先选择一个平台');
      return;
    }

    const platformRule = getPlatformRule(selectedPlatformId);
    if (!platformRule) {
      alert('平台规则不存在');
      return;
    }

    const files = await selectFolder();
    if (files.length === 0) return;

    await processFiles(files, platformRule);
  }, [selectedPlatformId, getPlatformRule]);

  const processFiles = useCallback(
    async (filesWithPath: FileWithPath[], platformRule: any) => {
      let batchId = currentBatch?.id;

      if (!currentBatch) {
        initializeBatch(selectedPlatformId!, filesWithPath[0]?.path || '');
        batchId = useProcessStore.getState().currentBatch?.id || generateId();
      }

      if (!batchId) {
        batchId = generateId();
      }

      setStatus('scanning');
      setIsProcessing(true);
      setProgress(0, '正在加载图片...');

      const processedImages: ImageItem[] = [];
      const total = filesWithPath.length;

      for (let i = 0; i < filesWithPath.length; i++) {
        const { file } = filesWithPath[i];
        try {
          setProgress(Math.floor((i / total) * 50), `正在处理: ${file.name} (${i + 1}/${total})`);
          const imageItem = await processImageFile(file, batchId, platformRule, customSkuPattern);
          processedImages.push(imageItem);
        } catch (error) {
          console.error('处理图片失败:', file.name, error);
        }
      }

      setProgress(50, '正在分析图片...');
      let refinedImages = refineImageType(processedImages);
      refinedImages = generateSequentialNames(refinedImages, platformRule);

      setProgress(70, '正在检测问题...');
      for (let i = 0; i < refinedImages.length; i++) {
        const img = refinedImages[i];
        setProgress(70 + Math.floor((i / refinedImages.length) * 20), `正在检测: ${img.originalName}`);

        const issues = validateImage(img, platformRule, refinedImages);
        for (const issue of issues) {
          img.issues.push(issue);
        }

        if (img.issues.length > 0) {
          img.status = 'error';
        } else {
          img.status = 'completed';
        }
      }

      setProgress(90, '正在分组整理...');
      const productGroups = groupImagesByProduct(refinedImages, platformRule);
      const imagesWithAngleIssues = addMissingAngleIssues(productGroups, refinedImages);

      addImages(imagesWithAngleIssues);
      setProductGroups(productGroups);
      completeBatch();

      addProcessRecord({
        id: batchId,
        platformName: platformRule.name,
        folderPath: filesWithPath[0]?.path || '',
        totalImages: imagesWithAngleIssues.length,
        issueCount: imagesWithAngleIssues.reduce((sum, img) => sum + img.issues.filter((i) => !i.resolved).length, 0),
        status: 'completed',
        startTime: Date.now(),
        endTime: Date.now(),
        images: imagesWithAngleIssues.map(convertToImageRecord),
        groups: productGroups,
      });

      setProgress(100, '处理完成');
    },
    [currentBatch, selectedPlatformId, customSkuPattern, initializeBatch, addImages, setProductGroups, setStatus, setProgress, setIsProcessing, completeBatch, addProcessRecord],
  );

  const handleExport = useCallback(async () => {
    if (!currentBatch || !selectedPlatformId) return;

    const platformRule = getPlatformRule(selectedPlatformId);
    if (!platformRule) return;

    setIsProcessing(true);
    setProgress(0, '正在生成导出文件...');

    try {
      const result = await exportResults(currentBatch, platformRule, exportConfig);
      setProgress(100, '导出完成');

      if (result) {
        const snapshots = buildProductSnapshots(currentBatch.images, currentBatch.productGroups);
        const exportEvent: TimelineEvent = {
          id: generateId(),
          timestamp: Date.now(),
          type: 'export',
          label: '导出完成',
          description: `生成 ${result.filename}（${result.uploadCount + result.compressedCount + (exportConfig.generateIssueReport ? 2 : 0) + (exportConfig.generateReviewList ? 1 : 0) + 1} 个文件）`,
          snapshots,
        };
        updateProcessRecord(currentBatch.id, {
          exportContent: {
            uploadFileCount: result.uploadCount,
            compressedFileCount: result.compressedCount,
            issueFileCount: result.issueCount,
            reviewFileCount: result.reviewCount,
          },
          reportPath: result.filename,
          exportSnapshot: {
            timestamp: Date.now(),
            filename: result.filename,
            config: { ...exportConfig },
            items: result.items,
          },
        });
        appendTimelineEvent(currentBatch.id, exportEvent);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [currentBatch, selectedPlatformId, getPlatformRule, exportConfig, setIsProcessing, setProgress, updateProcessRecord]);

  const handleReset = useCallback(() => {
    if (isProcessing) {
      if (!confirm('正在处理中，确定要重置吗？')) return;
    }
    resetBatch();
  }, [isProcessing, resetBatch]);

  const handleResolveIssue = useCallback(
    (imageId: string, issueId: string) => {
      useProcessStore.getState().resolveIssue(imageId, issueId);
    },
    [],
  );

  const handleUpdateImage = useCallback(
    (imageId: string, updates: Partial<ImageItem>) => {
      updateImage(imageId, updates);
    },
    [updateImage],
  );

  return {
    handleSelectFiles,
    handleSelectFolder,
    handleExport,
    handleReset,
    handleResolveIssue,
    handleUpdateImage,
    isProcessing,
  };
}
