import type { ImageRecord } from '@/types';

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<any>;
  }
}

export interface FileWithPath {
  file: File;
  path: string;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];

let savedDirectoryHandle: any = null;
const knownFilePaths = new Set<string>();

export function getKnownFilePaths(): Set<string> {
  return knownFilePaths;
}

export function addKnownFilePath(path: string): void {
  knownFilePaths.add(path);
}

export function addKnownFilePaths(paths: string[]): void {
  paths.forEach((p) => knownFilePaths.add(p));
}

export function clearKnownFilePaths(): void {
  knownFilePaths.clear();
}

function isImageFile(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export async function selectFiles(): Promise<FileWithPath[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = () => {
      const files: FileWithPath[] = [];
      if (input.files) {
        for (const file of Array.from(input.files)) {
          if (isImageFile(file.name)) {
            files.push({ file, path: file.name });
          }
        }
      }
      resolve(files);
    };

    input.oncancel = () => {
      resolve([]);
    };

    input.click();
  });
}

export async function selectFolder(): Promise<FileWithPath[]> {
  try {
    if (typeof window.showDirectoryPicker === 'function') {
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      savedDirectoryHandle = handle;
      return await readDirectory(handle);
    }

    return selectFolderLegacy();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return [];
    }
    return selectFolderLegacy();
  }
}

export function getSavedDirectoryHandle(): any {
  return savedDirectoryHandle;
}

export function clearSavedDirectoryHandle(): void {
  savedDirectoryHandle = null;
}

async function readDirectory(
  handle: any,
  basePath = '',
  files: FileWithPath[] = [],
): Promise<FileWithPath[]> {
  try {
    for await (const [name, entry] of handle.entries()) {
      const relativePath = basePath ? `${basePath}/${name}` : name;

      if (entry.kind === 'file') {
        if (isImageFile(name)) {
          try {
            const file = await entry.getFile();
            files.push({ file, path: relativePath });
          } catch (e) {
            console.warn(`无法读取文件: ${relativePath}`, e);
          }
        }
      } else if (entry.kind === 'directory') {
        await readDirectory(entry, relativePath, files);
      }
    }
  } catch (e) {
    console.warn('读取目录时出错:', e);
  }

  return files;
}

export async function reReadSavedDirectory(): Promise<FileWithPath[] | null> {
  if (!savedDirectoryHandle) return null;
  try {
    return await readDirectory(savedDirectoryHandle);
  } catch (e) {
    console.warn('重新读取保存的目录失败，可能权限已失效:', e);
    savedDirectoryHandle = null;
    return null;
  }
}

function selectFolderLegacy(): Promise<FileWithPath[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    (input as any).directory = '';

    input.onchange = () => {
      const files: FileWithPath[] = [];
      if (input.files) {
        for (const file of Array.from(input.files)) {
          if (isImageFile(file.name)) {
            const path = (file as any).webkitRelativePath || file.name;
            files.push({ file, path });
          }
        }
      }
      resolve(files);
    };

    input.oncancel = () => {
      resolve([]);
    };

    input.click();
  });
}

export async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function convertToImageRecord(img: {
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
  issues: any[];
}): ImageRecord {
  return {
    id: img.id,
    originalName: img.originalName,
    newName: img.newName,
    productCode: img.productCode,
    imageType: img.imageType,
    angle: img.angle,
    width: img.width,
    height: img.height,
    fileSize: img.fileSize,
    whiteBackgroundRatio: img.whiteBackgroundRatio,
    isDuplicate: img.isDuplicate,
    status: img.status,
    issues: img.issues,
  };
}
