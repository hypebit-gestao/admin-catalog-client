import { fetchWrapper } from "../utils/functions/fetch";
import { User } from "../models/user";
import { ReturnUpload, Upload } from "@/models/upload";

export const useUploadService = () => {
  const POST = async (data: Upload): Promise<ReturnUpload | undefined> => {
    const formData = new FormData();
    formData.append("files", data.file);
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
