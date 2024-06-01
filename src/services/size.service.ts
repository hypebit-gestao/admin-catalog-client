import { NextResponse } from "next/server";
import { fetchWrapper } from "../utils/functions/fetch";
import { Size } from "@/models/size";

export const useSizeService = () => {
  const POST = async (
    data: Size,
    session: string | any
  ): Promise<Size | undefined> => {
    const response: any = await fetchWrapper<Size>(`size`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
      body: JSON.stringify(data),
    });
    if (response.error) {
      throw new Error(response.message);
    }
    return response;
  };

  const GETALL = async (session: string | any): Promise<Size[] | undefined> => {
    const response: any = await fetchWrapper<Size[]>(`size`, {
      method: "GET",
      headers: {
        Authorization: `${session}`,
      },
    });

    if (response.error) {
      throw new Error(response.message);
    }
    return response;
  };

  const GETBYID = async (
    session: string | any,
    id: string
  ): Promise<Size | undefined> => {
    const response = await fetchWrapper<Size>(`size/${id}`, {
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
    data: Size,
    session: string | any
  ): Promise<Size | undefined> => {
    const response = await fetchWrapper<Size>(`size`, {
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

  const DELETE = async (
    id: string,
    session: string | any
  ): Promise<Size | undefined> => {
    const response = await fetchWrapper<Size>(`size/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `${session}`,
      },
    });

    if (!response) {
      console.error("Sem resposta do servidor");
    }

    return response;
  };

  return {
    POST,
    GETALL,
    GETBYID,
    PUT,
    DELETE,
  };
};
