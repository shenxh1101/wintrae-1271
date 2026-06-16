import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlatformRule, ProcessRecord, ExportConfig } from '@/types';
import { DEFAULT_PLATFORM_RULES, MOCK_PROCESS_RECORDS } from '@/data/defaultRules';

interface AppState {
  platformRules: PlatformRule[];
  processRecords: ProcessRecord[];
  selectedPlatformId: string | null;
  watchFolderPath: string;
  exportConfig: ExportConfig;
  customSkuPattern: string;
  addPlatformRule: (rule: Omit<PlatformRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlatformRule: (id: string, updates: Partial<PlatformRule>) => void;
  deletePlatformRule: (id: string) => void;
  setSelectedPlatformId: (id: string | null) => void;
  setWatchFolderPath: (path: string) => void;
  setExportConfig: (config: Partial<ExportConfig>) => void;
  setCustomSkuPattern: (pattern: string) => void;
  addProcessRecord: (record: ProcessRecord) => void;
  setProcessRecords: (records: ProcessRecord[]) => void;
  getPlatformRule: (id: string) => PlatformRule | undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      platformRules: DEFAULT_PLATFORM_RULES,
      processRecords: MOCK_PROCESS_RECORDS,
      selectedPlatformId: DEFAULT_PLATFORM_RULES[0]?.id || null,
      watchFolderPath: '',
      exportConfig: {
        generateUploadFolder: true,
        generateCompressed: true,
        generateIssueReport: true,
        generateReviewList: true,
        compressionQuality: 0.9,
      },
      customSkuPattern: '',

      addPlatformRule: (rule) => {
        const newRule: PlatformRule = {
          ...rule,
          id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          platformRules: [...state.platformRules, newRule],
        }));
      },

      updatePlatformRule: (id, updates) => {
        set((state) => ({
          platformRules: state.platformRules.map((rule) =>
            rule.id === id ? { ...rule, ...updates, updatedAt: Date.now() } : rule,
          ),
        }));
      },

      deletePlatformRule: (id) => {
        set((state) => ({
          platformRules: state.platformRules.filter((rule) => rule.id !== id),
          selectedPlatformId: state.selectedPlatformId === id ? null : state.selectedPlatformId,
        }));
      },

      setSelectedPlatformId: (id) => set({ selectedPlatformId: id }),

      setWatchFolderPath: (path) => set({ watchFolderPath: path }),

      setExportConfig: (config) => {
        set((state) => ({
          exportConfig: { ...state.exportConfig, ...config },
        }));
      },

      setCustomSkuPattern: (pattern) => set({ customSkuPattern: pattern }),

      addProcessRecord: (record) => {
        set((state) => ({
          processRecords: [record, ...state.processRecords].slice(0, 100),
        }));
      },

      setProcessRecords: (records) => {
        set({ processRecords: records });
      },

      getPlatformRule: (id) => {
        return get().platformRules.find((rule) => rule.id === id);
      },
    }),
    {
      name: 'image-processor-storage',
      partialize: (state) => ({
        platformRules: state.platformRules,
        processRecords: state.processRecords,
        selectedPlatformId: state.selectedPlatformId,
        exportConfig: state.exportConfig,
        customSkuPattern: state.customSkuPattern,
      }),
    },
  ),
);
