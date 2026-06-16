import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { useProcessStore } from '@/store/processStore';
import { processImageFile, validateImage, groupImagesByProduct, addMissingAngleIssues, refineImageType, generateSequentialNames } from '@/services/imageService';
import { selectFolder, FileWithPath } from '@/services/fileService';
import type { ImageItem } from '@/types';
import { generateId } from '@/utils/formatters';

export function useFileWatcher() {
  const { selectedPlatformId, customSkuPattern, getPlatformRule, addProcessRecord } = useAppStore();
  const {
    currentBatch,
    isWatching,
    setIsWatching,
    setIsProcessing,
    initializeBatch,
    addImages,
    replaceImages,
    setProductGroups,
    setStatus,
    setProgress,
    completeBatch,
  } = useProcessStore();

  const knownFilesRef = useRef<Set<string>>(new Set());

  const processFilesInternal = useCallback(
    async (filesWithPath: FileWithPath[], platformRule: any, append: boolean) => {
      let batchId = currentBatch?.id;

      if (!currentBatch && !append) {
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
      const existingImages = append ? useProcessStore.getState().currentBatch?.images || [] : [];
      const allExistingImages = append ? [...existingImages, ...refinedImages] : refinedImages;

      for (let i = 0; i < refinedImages.length; i++) {
        const img = refinedImages[i];
        setProgress(70 + Math.floor((i / refinedImages.length) * 20), `正在检测: ${img.originalName}`);

        const issues = validateImage(img, platformRule, allExistingImages);
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
      const allImages = append ? [...existingImages, ...refinedImages] : refinedImages;
      const productGroups = groupImagesByProduct(allImages, platformRule);
      const imagesWithAngleIssues = addMissingAngleIssues(productGroups, allImages);

      if (append && existingImages.length > 0) {
        replaceImages(imagesWithAngleIssues);
      } else {
        addImages(refinedImages);
      }
      setProductGroups(productGroups);
      completeBatch();

      if (!append) {
        addProcessRecord({
          id: batchId,
          platformName: platformRule.name,
          folderPath: filesWithPath[0]?.path || '',
          totalImages: imagesWithAngleIssues.length,
          issueCount: imagesWithAngleIssues.reduce((sum, img) => sum + img.issues.filter((i) => !i.resolved).length, 0),
          status: 'completed',
          startTime: Date.now(),
          endTime: Date.now(),
        });
      }

      setProgress(100, '处理完成');
    },
    [currentBatch, selectedPlatformId, customSkuPattern, initializeBatch, addImages, replaceImages, setProductGroups, setStatus, setProgress, setIsProcessing, completeBatch, addProcessRecord],
  );

  const startWatching = useCallback(async () => {
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

    knownFilesRef.current.clear();
    for (const f of files) {
      knownFilesRef.current.add(f.path);
    }

    await processFilesInternal(files, platformRule, false);
    setIsWatching(true);
  }, [selectedPlatformId, getPlatformRule, processFilesInternal, setIsWatching]);

  const stopWatching = useCallback(() => {
    setIsWatching(false);
    knownFilesRef.current.clear();
  }, [setIsWatching]);

  const checkForNewFiles = useCallback(async () => {
    if (!selectedPlatformId) {
      alert('请先选择一个平台');
      return;
    }

    const latestBatch = useProcessStore.getState().currentBatch;
    if (!latestBatch) {
      alert('请先开始监控并选择文件夹');
      return;
    }

    const platformRule = getPlatformRule(selectedPlatformId);
    if (!platformRule) return;

    const files = await selectFolder();
    if (files.length === 0) return;

    const newFiles: FileWithPath[] = [];
    for (const f of files) {
      if (!knownFilesRef.current.has(f.path)) {
        newFiles.push(f);
        knownFilesRef.current.add(f.path);
      }
    }

    if (newFiles.length === 0) {
      alert('没有检测到新图片');
      return;
    }

    await processFilesInternal(newFiles, platformRule, true);
    alert(`检测到 ${newFiles.length} 张新图片，已追加到处理列表`);
  }, [selectedPlatformId, getPlatformRule, processFilesInternal]);

  useEffect(() => {
    return () => {
      knownFilesRef.current.clear();
    };
  }, []);

  return {
    isWatching,
    startWatching,
    stopWatching,
    checkForNewFiles,
  };
}
