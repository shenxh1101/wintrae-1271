import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { useProcessStore } from '@/store/processStore';
import { processImageFile, validateImage, groupImagesByProduct, addMissingAngleIssues, refineImageType, generateSequentialNames, buildProductSnapshots } from '@/services/imageService';
import {
  selectFolder,
  reReadSavedDirectory,
  clearSavedDirectoryHandle,
  FileWithPath,
  convertToImageRecord,
  getKnownFilePaths,
  addKnownFilePaths,
  clearKnownFilePaths,
  addScanLog,
  clearScanLogs,
} from '@/services/fileService';
import type { ImageItem, ProductGroup, TimelineEvent } from '@/types';
import { generateId } from '@/utils/formatters';

const POLL_INTERVAL_MS = 5000;

export function useFileWatcher() {
  const { selectedPlatformId, customSkuPattern, getPlatformRule, addProcessRecord, updateProcessRecord, appendTimelineEvent } = useAppStore();
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

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(false);

  const buildRecordAndSave = useCallback(
    (batchId: string, platformName: string, folderPath: string, allImages: ImageItem[], groups: ProductGroup[]) => {
      const imgRecords = allImages.map(convertToImageRecord);
      const initialEvent: TimelineEvent = {
        id: generateId(),
        timestamp: Date.now(),
        type: 'initial',
        label: '首次处理',
        description: `加载 ${allImages.length} 张图片，识别出 ${groups.length} 个商品`,
        snapshots: buildProductSnapshots(allImages, groups),
      };
      addProcessRecord({
        id: batchId,
        platformName,
        folderPath,
        totalImages: allImages.length,
        issueCount: allImages.reduce((sum, img) => sum + img.issues.filter((i) => !i.resolved).length, 0),
        status: 'completed',
        startTime: Date.now(),
        endTime: Date.now(),
        images: imgRecords,
        groups,
        timeline: [initialEvent],
      });
    },
    [addProcessRecord],
  );

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

      for (let i = 0; i < refinedImages.length; i++) {
        const img = refinedImages[i];
        setProgress(70 + Math.floor((i / Math.max(1, refinedImages.length)) * 20), `正在检测: ${img.originalName}`);

        const allForValidation = append ? [...existingImages, ...refinedImages] : refinedImages;
        const issues = validateImage(img, platformRule, allForValidation);
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
      let allImages = append ? [...existingImages, ...refinedImages] : refinedImages;

      if (append) {
        allImages = allImages.map((img) => ({
          ...img,
          issues: img.issues.filter((i) => i.type !== 'missingAngle'),
        }));
      }

      const productGroups = groupImagesByProduct(allImages, platformRule);
      const imagesWithAngleIssues = addMissingAngleIssues(productGroups, allImages);

      if (append && existingImages.length > 0) {
        replaceImages(imagesWithAngleIssues);
      } else {
        addImages(imagesWithAngleIssues);
      }
      setProductGroups(productGroups);
      completeBatch();

      if (!append) {
        buildRecordAndSave(batchId, platformRule.name, filesWithPath[0]?.path || '', imagesWithAngleIssues, productGroups);
      } else {
        const snapshots = buildProductSnapshots(imagesWithAngleIssues, productGroups);
        const prev = useAppStore.getState().getProcessRecord(batchId);
        const prevSnapshots = prev?.timeline?.slice(-1)[0]?.snapshots || [];

        const prevMissing: Record<string, number> = {};
        for (const s of prevSnapshots) prevMissing[s.productCode] = s.missingAngles.length;
        const fixedProducts: string[] = [];
        for (const s of snapshots) {
          const prevCount = prevMissing[s.productCode] ?? 999;
          if (prevCount > 0 && s.missingAngles.length < prevCount) fixedProducts.push(s.productCode);
        }

        const appendEvent: TimelineEvent = {
          id: generateId(),
          timestamp: Date.now(),
          type: 'append',
          label: `追加 ${refinedImages.length} 张图片`,
          description:
            fixedProducts.length > 0
              ? `${fixedProducts.slice(0, 3).join('、')}${fixedProducts.length > 3 ? ` 等 ${fixedProducts.length} 个商品缺图有变化` : ' 的缺图情况有变化'}`
              : undefined,
          snapshots,
        };

        updateProcessRecord(batchId, {
          totalImages: imagesWithAngleIssues.length,
          issueCount: imagesWithAngleIssues.reduce((s, img) => s + img.issues.filter((i) => !i.resolved).length, 0),
          endTime: Date.now(),
          images: imagesWithAngleIssues.map(convertToImageRecord),
          groups: productGroups,
        });
        appendTimelineEvent(batchId, appendEvent);
      }

      setProgress(100, '处理完成');
    },
    [currentBatch, selectedPlatformId, customSkuPattern, initializeBatch, addImages, replaceImages, setProductGroups, setStatus, setProgress, setIsProcessing, completeBatch, buildRecordAndSave, updateProcessRecord],
  );

  const scanForNewFiles = useCallback(
    async (showAlert = false) => {
      const state = useProcessStore.getState();
      if (state.isProcessing) return;
      if (!selectedPlatformId) return;

      const platformRule = getPlatformRule(selectedPlatformId);
      if (!platformRule) return;

      const latestBatch = state.currentBatch;
      if (!latestBatch) return;

      let files = null;
      try {
        files = await reReadSavedDirectory();
      } catch (e: any) {
        addScanLog({
          status: 'error',
          newFileCount: 0,
          totalFileCount: 0,
          message: `读取目录失败: ${e?.message || '未知错误'}`,
        });
        if (showAlert) alert('目录读取失败，请检查权限');
        return;
      }

      if (!files) {
        addScanLog({
          status: 'warning',
          newFileCount: 0,
          totalFileCount: 0,
          message: '目录权限已失效',
        });
        if (showAlert) alert('目录权限已失效，请停止监控后重新启动');
        return;
      }

      const knownPaths = getKnownFilePaths();
      const newFiles: FileWithPath[] = [];
      for (const f of files) {
        if (!knownPaths.has(f.path)) {
          newFiles.push(f);
        }
      }

      if (newFiles.length === 0) {
        addScanLog({
          status: 'success',
          newFileCount: 0,
          totalFileCount: files.length,
          message: `扫描完成，目录共 ${files.length} 张图，无新增`,
        });
        if (showAlert) alert('没有检测到新图片');
        return;
      }

      addScanLog({
        status: 'success',
        newFileCount: newFiles.length,
        totalFileCount: files.length,
        message: `发现 ${newFiles.length} 张新图片`,
      });
      addKnownFilePaths(newFiles.map((f) => f.path));
      await processFilesInternal(newFiles, platformRule, true);
      if (showAlert) alert(`检测到 ${newFiles.length} 张新图片，已追加到处理列表`);
    },
    [selectedPlatformId, getPlatformRule, processFilesInternal],
  );

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    pollTimerRef.current = setInterval(() => {
      scanForNewFiles(false).catch((e) => console.warn('自动扫描失败:', e));
    }, POLL_INTERVAL_MS);
  }, [scanForNewFiles]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

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

    clearKnownFilePaths();
    clearScanLogs();
    addKnownFilePaths(files.map((f) => f.path));
    addScanLog({
      status: 'success',
      newFileCount: files.length,
      totalFileCount: files.length,
      message: `启动监控，共加载 ${files.length} 张图片`,
    });

    await processFilesInternal(files, platformRule, false);
    setIsWatching(true);
    startPolling();
  }, [selectedPlatformId, getPlatformRule, processFilesInternal, setIsWatching, startPolling]);

  const stopWatching = useCallback(() => {
    stopPolling();
    clearSavedDirectoryHandle();
    clearKnownFilePaths();
    addScanLog({
      status: 'success',
      newFileCount: 0,
      totalFileCount: 0,
      message: '已停止监控',
    });
    setIsWatching(false);
  }, [stopPolling, setIsWatching]);

  const checkForNewFiles = useCallback(async () => {
    await scanForNewFiles(true);
  }, [scanForNewFiles]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      if (isWatching) {
        startPolling();
      }
      return;
    }
  }, [isWatching, startPolling]);

  useEffect(() => {
    const onFocus = () => {
      if (useProcessStore.getState().isWatching) {
        scanForNewFiles(false).catch((e) => console.warn('焦点触发扫描失败:', e));
      }
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      stopPolling();
    };
  }, [scanForNewFiles, stopPolling]);

  return {
    isWatching,
    startWatching,
    stopWatching,
    checkForNewFiles,
  };
}
