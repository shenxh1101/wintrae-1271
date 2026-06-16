import { isImageFile } from '@/utils/filenameParser';

export interface FileWithPath {
  file: File;
  path: string;
}

export async function selectFiles(): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        resolve(Array.from(target.files));
      } else {
        resolve([]);
      }
    };

    input.onerror = () => reject(new Error('选择文件失败'));
    input.click();
  });
}

export async function selectFolder(): Promise<FileWithPath[]> {
  try {
    if ('showDirectoryPicker' in window) {
      const directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'read',
      });

      const files: FileWithPath[] = [];
      await processDirectory(directoryHandle, '', files);
      return files;
    } else {
      return await selectFilesLegacy();
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return [];
    }
    throw error;
  }
}

async function processDirectory(
  directoryHandle: any,
  path: string,
  result: FileWithPath[],
): Promise<void> {
  for await (const [name, handle] of directoryHandle.entries()) {
    const relativePath = path ? `${path}/${name}` : name;

    if (handle.kind === 'file' && isImageFile(name)) {
      try {
        const file = await handle.getFile();
        result.push({ file, path: relativePath });
      } catch (e) {
        // Skip files that can't be accessed
      }
    } else if (handle.kind === 'directory') {
      await processDirectory(handle, relativePath, result);
    }
  }
}

async function selectFilesLegacy(): Promise<FileWithPath[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.webkitdirectory = true;

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const files: FileWithPath[] = Array.from(target.files)
          .filter((file) => isImageFile(file.name))
          .map((file) => ({
            file,
            path: (file as any).webkitRelativePath || file.name,
          }));
        resolve(files);
      } else {
        resolve([]);
      }
    };

    input.onerror = () => reject(new Error('选择文件夹失败'));
    input.click();
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot).toLowerCase();
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
