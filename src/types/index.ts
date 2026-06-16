export interface PlatformRule {
  id: string;
  name: string;
  logo: string;
  enabled: boolean;
  namingTemplate: string;
  imageRequirements: ImageRequirement[];
  settings: PlatformSettings;
  createdAt: number;
  updatedAt: number;
}

export interface ImageRequirement {
  type: 'main' | 'detail' | 'scene';
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  maxFileSize: number;
  aspectRatio: string;
  requireWhiteBackground: boolean;
}

export interface PlatformSettings {
  whiteBackgroundThreshold: number;
  duplicateThreshold: number;
  requiredAngles: string[];
}

export interface ImageItem {
  id: string;
  batchId: string;
  originalName: string;
  newName: string;
  productCode: string;
  imageType: 'main' | 'detail' | 'scene' | 'unknown';
  angle: string;
  width: number;
  height: number;
  fileSize: number;
  phash: string;
  whiteBackgroundRatio: number;
  isDuplicate: boolean;
  duplicateOf: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  issues: ImageIssue[];
  file: File | null;
  preview: string;
  createdAt: number;
}

export interface ImageIssue {
  id: string;
  type: 'dimension' | 'fileSize' | 'whiteBackground' | 'duplicate' | 'missingAngle' | 'naming';
  severity: 'error' | 'warning' | 'info';
  description: string;
  suggestion: string;
  resolved: boolean;
}

export interface ProcessBatch {
  id: string;
  platformId: string;
  folderPath: string;
  totalImages: number;
  processedImages: number;
  issueCount: number;
  status: 'idle' | 'scanning' | 'processing' | 'completed' | 'error';
  images: ImageItem[];
  productGroups: ProductGroup[];
  startTime: number;
  endTime: number | null;
}

export interface ProductGroup {
  id: string;
  productCode: string;
  imageIds: string[];
  missingAngles: string[];
  hasMainImage: boolean;
  hasDetailImages: boolean;
  hasSceneImages: boolean;
}

export interface ProductSnapshot {
  productCode: string;
  imageCount: number;
  angles: string[];
  missingAngles: string[];
  issueCount: number;
  issueTypes: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'initial' | 'append' | 'export';
  label: string;
  description?: string;
  snapshots: ProductSnapshot[];
}

export interface ExportConfig {
  generateUploadFolder: boolean;
  generateCompressed: boolean;
  generateIssueReport: boolean;
  generateReviewList: boolean;
  compressionQuality: number;
}

export interface ProcessRecord {
  id: string;
  platformName: string;
  folderPath: string;
  totalImages: number;
  issueCount: number;
  status: 'completed' | 'error';
  startTime: number;
  endTime: number;
  reportPath?: string;
  images?: ImageRecord[];
  groups?: ProductGroup[];
  exportContent?: {
    uploadFileCount: number;
    compressedFileCount: number;
    issueFileCount: number;
    reviewFileCount: number;
  };
  exportSnapshot?: ExportSnapshot;
  timeline?: TimelineEvent[];
}

export interface ImageRecord {
  id: string;
  originalName: string;
  newName: string;
  productCode: string;
  imageType: 'main' | 'detail' | 'scene' | 'unknown';
  angle: string;
  width: number;
  height: number;
  fileSize: number;
  whiteBackgroundRatio: number;
  isDuplicate: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  issues: ImageIssue[];
}

export type IssueType = 'dimension' | 'fileSize' | 'whiteBackground' | 'duplicate' | 'missingAngle' | 'naming';

export type ImageType = 'main' | 'detail' | 'scene' | 'unknown';

export type Severity = 'error' | 'warning' | 'info';

export interface IssueSummary {
  type: IssueType;
  count: number;
  severity: Severity;
}

export interface ScanLog {
  id: string;
  timestamp: number;
  status: 'success' | 'warning' | 'error';
  newFileCount: number;
  totalFileCount: number;
  message: string;
}

export interface ExportedFileItem {
  category: 'upload' | 'compressed' | 'issue' | 'review' | 'summary';
  filePath: string;
  fileName: string;
  productCode?: string;
  imageType?: ImageType;
  angle?: string;
  fileSize?: number;
  excluded?: boolean;
  excludedReason?: string;
}

export interface ExportSnapshot {
  timestamp: number;
  filename: string;
  config: ExportConfig;
  items: ExportedFileItem[];
}
