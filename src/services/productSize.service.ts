import { NextResponse } from "next/server";
import { fetchWrapper } from "../utils/functions/fetch";
import { ProductSize } from "@/models/size";

export const useProductSizeService = () => {
  const POST = async (
    data: ProductSize,
    session: string | any
  ): Promise<ProductSize | undefined> => {
    const response: any = await fetchWrapper<ProductSize>(`productSize`, {
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

  const GETALL = async (
    session: string | any
  ): Promise<ProductSize[] | undefined> => {
    const response: any = await fetchWrapper<ProductSize[]>(`productSize`, {
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
  ): Promise<ProductSize | undefined> => {
    const response = await fetchWrapper<ProductSize>(`productSize/${id}`, {
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
    data: ProductSize,
    session: string | any
  ): Promise<ProductSize | undefined> => {
    const response = await fetchWrapper<ProductSize>(`productSize`, {
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
  ): Promise<ProductSize | undefined> => {
    const response = await fetchWrapper<ProductSize>(`productSize/${id}`, {
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
