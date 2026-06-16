import { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { useProcessStore } from '@/store/processStore';
import { processImageFile } from '@/services/imageService';
import type { ImageItem } from '@/types';

export function useFileWatcher() {
  const { selectedPlatformId, customSkuPattern, getPlatformRule } = useAppStore();
  const { currentBatch, isWatching, setIsWatching, addImages, updateImage, addIssue } = useProcessStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const watchIntervalRef = useRef<number | null>(null);
  const knownFilesRef = useRef<Set<string>>(new Set());

  const startWatching = useCallback(() => {
    if (!selectedPlatformId) {
      alert('请先选择一个平台');
      return;
    }

    const platformRule = getPlatformRule(selectedPlatformId);
    if (!platformRule) {
      alert('平台规则不存在');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.webkitdirectory = true;

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      setIsWatching(true);
      knownFilesRef.current.clear();

      const initialFiles = Array.from(target.files);
      for (const file of initialFiles) {
        knownFilesRef.current.add(file.name);
      }

      watchIntervalRef.current = window.setInterval(async () => {
        if ('showDirectoryPicker' in window) {
          // Modern browsers - we would use the File System Access API here
          // For now, we'll show a message that watching is active
        }
      }, 2000);

      alert('文件夹监控已启动！\n\n注意：由于浏览器安全限制，自动监控功能有限。\n建议使用"选择文件夹"按钮手动刷新。');
    };

    input.click();
    fileInputRef.current = input;
  }, [selectedPlatformId, getPlatformRule, setIsWatching]);

  const stopWatching = useCallback(() => {
    setIsWatching(false);
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
    knownFilesRef.current.clear();
  }, [setIsWatching]);

  const checkForNewFiles = useCallback(async () => {
    if (!selectedPlatformId || !currentBatch) return;

    const platformRule = getPlatformRule(selectedPlatformId);
    if (!platformRule) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.webkitdirectory = true;

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;

      const files = Array.from(target.files);
      const newFiles: File[] = [];

      for (const file of files) {
        if (!knownFilesRef.current.has(file.name)) {
          newFiles.push(file);
          knownFilesRef.current.add(file.name);
        }
      }

      if (newFiles.length > 0) {
        const processedImages: ImageItem[] = [];

        for (const file of newFiles) {
          try {
            const imageItem = await processImageFile(file, currentBatch.id, platformRule, customSkuPattern);
            processedImages.push(imageItem);
          } catch (error) {
            console.error('处理新文件失败:', file.name, error);
          }
        }

        addImages(processedImages);
        alert(`检测到 ${newFiles.length} 张新图片，已添加到处理列表`);
      } else {
        alert('没有检测到新图片');
      }
    };

    input.click();
  }, [selectedPlatformId, currentBatch, getPlatformRule, customSkuPattern, addImages]);

  useEffect(() => {
    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, []);

  return {
    isWatching,
    startWatching,
    stopWatching,
    checkForNewFiles,
  };
}
