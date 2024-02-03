import { fetchWrapper } from "../utils/functions/fetch";
import { Category } from "@/models/category";

export const useCategoryService = () => {
  const POST = async (
    data: Category,
    session: string | any
  ): Promise<Category | undefined> => {
    const response = await fetchWrapper<Category>(`category`, {
      method: "POST",
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

  const GETALL = async (
    session: string | any
  ): Promise<Category[] | undefined> => {
    const response = await fetchWrapper<Category[]>("category", {
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
  ): Promise<Category | undefined> => {
    const response = await fetchWrapper<Category>(`category/${id}`, {
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
    data: Category,
    session: string | any
  ): Promise<Category | undefined> => {
    const response = await fetchWrapper<Category>(`category`, {
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
  ): Promise<Category | undefined> => {
    const response = await fetchWrapper<Category>(`category/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `${session}`,
      },
    });

    if (!response) {
      console.error("Sem resposta do servidor");
    }

    return response;
  }
  

  return {
    POST,
    GETALL,
    GETBYID,
    PUT,
    DELETE,
  };
};
