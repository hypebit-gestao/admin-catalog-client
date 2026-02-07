import { fetchWrapper } from "../utils/functions/fetch";
import { Product } from "@/models/product";
import {
  ProductAnalyticsResponse,
  ProductByCategoryResponse,
} from "@/models/product-analytics";

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
    category: string | null,
    session: string | any
  ): Promise<Product[] | undefined> => {
    const response = await fetchWrapper<Product[]>(
      `product/user/${user_id}?category=${category}`,
      {
        method: "GET",
        headers: {
          Authorization: `${session}`,
        },
      }
    );

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
    data: Product | any,
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

  const GETANALYTICS = async (
    user_id: string | undefined,
    session: string | any
  ): Promise<ProductAnalyticsResponse | undefined> => {
    const response = await fetchWrapper<ProductAnalyticsResponse>(
      `product/analytics/${user_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `${session}`,
        },
      }
    );
    return response;
  };

  const GETBYCATEGORY = async (
    user_id: string | undefined,
    session: string | any
  ): Promise<ProductByCategoryResponse | undefined> => {
    const response = await fetchWrapper<ProductByCategoryResponse>(
      `product/by-category/${user_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `${session}`,
        },
      }
    );
    return response;
  };

  return {
    GETBYUSERID,
    GETBYID,
    COUNTPRODUCTS,
    GETANALYTICS,
    GETBYCATEGORY,
    POST,
    PUT,
    DELETE,
  };
};
