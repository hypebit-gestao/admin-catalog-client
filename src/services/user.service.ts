import { fetchWrapper } from "../utils/functions/fetch";
import {
  User,
  UserPersonalizationColorPut,
  UserShippingPut,
} from "../models/user";

export const useUserService = () => {
  const POST = async (
    data: User,
    session: string | any
  ): Promise<User | undefined> => {
    const response = await fetchWrapper<User>(`user`, {
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
    id: string | undefined,
    session: string | any
  ): Promise<User | undefined> => {
    const response = await fetchWrapper<User>(`user/${id}`, {
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
    data: User | UserShippingPut | UserPersonalizationColorPut,
    session: string | any
  ): Promise<
    User | UserShippingPut | UserPersonalizationColorPut | undefined
  > => {
    const response = await fetchWrapper<
      User | UserShippingPut | UserPersonalizationColorPut
    >(`user`, {
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
