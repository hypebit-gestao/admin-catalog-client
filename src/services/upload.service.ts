import { fetchWrapper } from "../utils/functions/fetch";
import { User } from "../models/user";
import { ReturnUpload, Upload } from "@/models/upload";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/tiff"];
const MAX_DIMENSION = 1200;
const WEBP_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  if (!IMAGE_TYPES.includes(file.type)) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        // já é pequena o suficiente, só converte para webp
      }
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.webp`, { type: "image/webp" }));
        },
        "image/webp",
        WEBP_QUALITY,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export const useUploadService = () => {
  const POST = async (data: Upload): Promise<ReturnUpload | undefined> => {
    const compressed = await compressImage(data.file as File);
    const formData = new FormData();
    formData.append("files", compressed);
    formData.append("folderName", data.folderName);

    const response = await fetchWrapper<ReturnUpload>("upload", {
      method: "POST",

      body: formData,
    });

    if (!response) {
      console.error("Sem resposta do servidor");
    }

    return response;
  };

  const GETALL = async (session: string | any): Promise<User[] | undefined> => {
    const response = await fetchWrapper<User[]>("user", {
      method: "GET",
      headers: {
        Authorization: `${session}`,
      },
    });

    if (!response) {
      console.error("Sem resposta do servidor");
    }

    return response;
  };

  const GETBYID = async (
    session: string | any,
    id: string
  ): Promise<User | undefined> => {
    const response = await fetchWrapper<User>(`user/relation/${id}`, {
      method: "GET",
      headers: {
        Authorization: `${session}`,
      },
    });

    if (!response) {
      console.error("Sem resposta do servidor");
    }

    return response;
  };

  const PUT = async (
    data: User,
    session: string | any
  ): Promise<User | undefined> => {
    const response = await fetchWrapper<User>(`user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
      body: JSON.stringify(data),
    });

    if (!response) {
      console.error("Sem resposta do servidor");
    }

    return response;
  };

  const DELETE = async (id: string, session: string | any): Promise<void> => {
    await fetchWrapper<User[]>(`user/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
    });
  };

  return {
    GETALL,
    GETBYID,
    POST,
    PUT,
    DELETE,
  };
};
