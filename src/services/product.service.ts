import { fetchWrapper } from "../utils/functions/fetch";
import { Product } from "@/models/product";

export const useProductService = () => {
  const POST = async (
    data: Product,
    session: string | any
  ): Promise<Product | undefined> => {
    const response: any = await fetchWrapper<Product>(`product`, {
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

  const GETBYID = async (
    id: string | undefined,
    session: string | any
  ): Promise<Product | undefined> => {
    const response = await fetchWrapper<Product>(`product/${id}`, {
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

  const GETBYUSERID = async (
    user_id: string | undefined,
    session: string | any
  ): Promise<Product[] | undefined> => {
    const response = await fetchWrapper<Product[]>(`product/user/${user_id}`, {
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

  const COUNTPRODUCTS = async (
    user_id: string | undefined,
    session: string | any
  ): Promise<number | undefined> => {
    const response = await fetchWrapper<number>(`product/count/${user_id}`, {
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
    data: Product,
    session: string | any
  ): Promise<Product | undefined> => {
    const response = await fetchWrapper<Product>(`product`, {
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
    await fetchWrapper<Product[]>(`product/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
    });
  };

  return {
    GETBYUSERID,
    GETBYID,
    COUNTPRODUCTS,
    POST,
    PUT,
    DELETE,
  };
};
