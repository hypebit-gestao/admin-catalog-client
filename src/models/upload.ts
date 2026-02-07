export interface Upload {
  file: File | Blob | string;
  folderName: string;
}

export interface ReturnUpload {
  imageUrl: string;
  message: string;
}

export type MultipleReturnUpload = ReturnUpload[];
