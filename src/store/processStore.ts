import { create } from 'zustand';
import type { ProcessBatch, ImageItem, ImageIssue, ProductGroup } from '@/types';

interface ProcessState {
  currentBatch: ProcessBatch | null;
  isWatching: boolean;
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  selectedImageIds: string[];
  filterType: 'all' | 'withIssues' | 'main' | 'detail' | 'scene';
  initializeBatch: (platformId: string, folderPath: string) => void;
  addImages: (images: ImageItem[]) => void;
  replaceImages: (images: ImageItem[]) => void;
  updateImage: (id: string, updates: Partial<ImageItem>) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  addIssue: (imageId: string, issue: Omit<ImageIssue, 'id'>) => void;
  resolveIssue: (imageId: string, issueId: string) => void;
  setProductGroups: (groups: ProductGroup[]) => void;
  setStatus: (status: ProcessBatch['status']) => void;
  setProgress: (progress: number, currentStep: string) => void;
  setIsWatching: (watching: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  toggleImageSelection: (id: string) => void;
  selectAllImages: (imageIds?: string[]) => void;
  deselectAllImages: (imageIds?: string[]) => void;
  setFilterType: (type: ProcessState['filterType']) => void;
  completeBatch: () => void;
  resetBatch: () => void;
  getFilteredImages: () => ImageItem[];
  getIssueSummary: () => { type: string; count: number; severity: string }[];
}

const createEmptyBatch = (platformId: string, folderPath: string): ProcessBatch => ({
  id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`,
  platformId,
  folderPath,
  totalImages: 0,
  processedImages: 0,
  issueCount: 0,
  status: 'idle',
  images: [],
  productGroups: [],
  startTime: Date.now(),
  endTime: null,
});

export const useProcessStore = create<ProcessState>((set, get) => ({
  currentBatch: null,
  isWatching: false,
  isProcessing: false,
  progress: 0,
  currentStep: '',
  selectedImageIds: [],
  filterType: 'all',

  initializeBatch: (platformId, folderPath) => {
    set({
      currentBatch: createEmptyBatch(platformId, folderPath),
      selectedImageIds: [],
      progress: 0,
      currentStep: '',
      isProcessing: false,
    });
  },

  addImages: (images) => {
    set((state) => {
      if (!state.currentBatch) return state;
      return {
        currentBatch: {
          ...state.currentBatch,
          images: [...state.currentBatch.images, ...images],
          totalImages: state.currentBatch.images.length + images.length,
        },
      };
    });
  },

  replaceImages: (images) => {
    set((state) => {
      if (!state.currentBatch) return state;
      return {
        currentBatch: {
          ...state.currentBatch,
          images,
          totalImages: images.length,
        },
      };
    });
  },

  updateImage: (id, updates) => {
    set((state) => {
      if (!state.currentBatch) return state;
      return {
        currentBatch: {
          ...state.currentBatch,
          images: state.currentBatch.images.map((img) => (img.id === id ? { ...img, ...updates } : img)),
        },
      };
    });
  },

  removeImage: (id) => {
    set((state) => {
      if (!state.currentBatch) return state;
      return {
        currentBatch: {
          ...state.currentBatch,
          images: state.currentBatch.images.filter((img) => img.id !== id),
          totalImages: state.currentBatch.images.length - 1,
          selectedImageIds: state.selectedImageIds.filter((sid) => sid !== id),
        },
      };
    });
  },

  clearImages: () => {
    set((state) => {
      if (!state.currentBatch) return state;
      return {
        currentBatch: {
          ...state.currentBatch,
          images: [],
          totalImages: 0,
          issueCount: 0,
          productGroups: [],
        },
        selectedImageIds: [],
      };
    });
  },

  addIssue: (imageId, issue) => {
    set((state) => {
      if (!state.currentBatch) return state;
      const newIssue: ImageIssue = {
        ...issue,
        id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`,
      };
      return {
        currentBatch: {
          ...state.currentBatch,
          images: state.currentBatch.images.map((img) =>
            img.id === imageId ? { ...img, issues: [...img.issues, newIssue] } : img,
          ),
          issueCount: state.currentBatch.issueCount + 1,
        },
      };
    });
  },

  resolveIssue: (imageId, issueId) => {
    set((state) => {
      if (!state.currentBatch) return state;
      return {
        currentBatch: {
          ...state.currentBatch,
          images: state.currentBatch.images.map((img) =>
            img.id === imageId
              ? {
                  ...img,
                  issues: img.issues.map((issue) =>
                    issue.id === issueId ? { ...issue, resolved: true } : issue,
                  ),
                }
              : img,
          ),
        },
      };
    });
  },

  setProductGroups: (groups) => {
    set((state) => {
      if (!state.currentBatch) return state;
      return {
        currentBatch: {
          ...state.currentBatch,
          productGroups: groups,
        },
      };
    });
  },

  setStatus: (status) => {
    set((state) => {
      if (!state.currentBatch) return state;
      return {
        currentBatch: {
          ...state.currentBatch,
          status,
        },
      };
    });
  },

  setProgress: (progress, currentStep) => {
    set({ progress, currentStep });
  },

  setIsWatching: (watching) => set({ isWatching: watching }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  toggleImageSelection: (id) => {
    set((state) => ({
      selectedImageIds: state.selectedImageIds.includes(id)
        ? state.selectedImageIds.filter((sid) => sid !== id)
        : [...state.selectedImageIds, id],
    }));
  },

  selectAllImages: (imageIds) => {
    set((state) => {
      const idsToSelect = imageIds || state.currentBatch?.images.map((img) => img.id) || [];
      const currentSelected = new Set(state.selectedImageIds);
      idsToSelect.forEach((id) => currentSelected.add(id));
      return { selectedImageIds: Array.from(currentSelected) };
    });
  },

  deselectAllImages: (imageIds) => {
    set((state) => {
      if (!imageIds) {
        return { selectedImageIds: [] };
      }
      const idsToRemove = new Set(imageIds);
      return {
        selectedImageIds: state.selectedImageIds.filter((id) => !idsToRemove.has(id)),
      };
    });
  },

  setFilterType: (type) => set({ filterType: type }),

  completeBatch: () => {
    set((state) => {
      if (!state.currentBatch) return state;
      const issueCount = state.currentBatch.images.reduce(
        (sum, img) => sum + img.issues.filter((i) => !i.resolved).length,
        0,
      );
      return {
        currentBatch: {
          ...state.currentBatch,
          status: 'completed',
          endTime: Date.now(),
          processedImages: state.currentBatch.images.length,
          issueCount,
        },
        isProcessing: false,
        progress: 100,
        currentStep: '处理完成',
      };
    });
  },

  resetBatch: () => {
    set({
      currentBatch: null,
      isWatching: false,
      isProcessing: false,
      progress: 0,
      currentStep: '',
      selectedImageIds: [],
      filterType: 'all',
    });
  },

  getFilteredImages: () => {
    const state = get();
    if (!state.currentBatch) return [];

    const images = state.currentBatch.images;
    switch (state.filterType) {
      case 'withIssues':
        return images.filter((img) => img.issues.some((i) => !i.resolved));
      case 'main':
        return images.filter((img) => img.imageType === 'main');
      case 'detail':
        return images.filter((img) => img.imageType === 'detail');
      case 'scene':
        return images.filter((img) => img.imageType === 'scene');
      default:
        return images;
    }
  },

  getIssueSummary: () => {
    const state = get();
    if (!state.currentBatch) return [];

    const summary: Record<string, { count: number; severity: string }> = {};
    for (const img of state.currentBatch.images) {
      for (const issue of img.issues) {
        if (!summary[issue.type]) {
          summary[issue.type] = { count: 0, severity: issue.severity };
        }
        if (!issue.resolved) {
          summary[issue.type].count++;
        }
      }
    }

    return Object.entries(summary)
      .map(([type, data]) => ({ type, count: data.count, severity: data.severity }))
      .filter((item) => item.count > 0);
  },
}));
