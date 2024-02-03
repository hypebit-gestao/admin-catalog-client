export interface Upload {
  file: string;
  folderName: string;
}

export interface ReturnUpload {
  imageUrl: string;
  message: string;
}

export type MultipleReturnUpload = ReturnUpload[];
