import { requireOptionalNativeModule } from 'expo';

interface PahnavarFileStorageModule {
  saveToDownloadsAsync(
    sourceUri: string,
    fileName: string,
    mimeType: string,
    folderName: string,
  ): Promise<string>;
}

export class NativeFileStorageUnavailableError extends Error {
  constructor() {
    super('Native file storage is unavailable in the current app build.');
    this.name = 'NativeFileStorageUnavailableError';
  }
}

const PahnavarFileStorage =
  requireOptionalNativeModule<PahnavarFileStorageModule>('PahnavarFileStorage');

export const saveToDownloadsAsync = (
  sourceUri: string,
  fileName: string,
  mimeType: string,
  folderName: string,
) => {
  if (!PahnavarFileStorage) {
    throw new NativeFileStorageUnavailableError();
  }

  return PahnavarFileStorage.saveToDownloadsAsync(sourceUri, fileName, mimeType, folderName);
};
