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

  const POSTUSERCATEGORY = async (
    data: Category,
    session: string | any
  ): Promise<Category | undefined> => {
    const response = await fetchWrapper<Category>(`userCategory`, {
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
    session: string | any,
    userId: string | undefined
  ): Promise<Category[] | undefined> => {
    const response = await fetchWrapper<Category[]>(
      `userCategory/user/${userId}`,
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

  const COUNTCATEGORIES = async (
    user_id: string | undefined,
    session: string | any
  ): Promise<number | undefined> => {
    const response = await fetchWrapper<number>(
      `userCategory/count/${user_id}`,
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
  };

  return {
    POST,
    POSTUSERCATEGORY,
    GETALL,
    GETBYID,
    COUNTCATEGORIES,
    PUT,
    DELETE,
  };
};
