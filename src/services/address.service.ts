import { fetchWrapper } from "../utils/functions/fetch";
import { Address } from "../models/address";

export const useAddressService = () => {
  const POST = async (
    data: Address,
    session: string | any
  ): Promise<Address | undefined> => {
    const response = await fetchWrapper<Address>(`address`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
      body: JSON.stringify(data),
    });

    return response;
  };

  const GETALL = async (
    session: string | any
  ): Promise<Address[] | undefined> => {
    const response = await fetchWrapper<Address[]>("address", {
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
    session: string | any,
  ): Promise<Address | undefined> => {
    const response = await fetchWrapper<Address>(`address/${id}`, {
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
    session: string | any,
    data: Address
  ): Promise<Address | undefined> => {
    const response = await fetchWrapper<Address>(`address`, {
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

  return {
    GETALL,
    GETBYID,
    POST,
    PUT,
  };
};
