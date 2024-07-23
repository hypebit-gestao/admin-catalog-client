import { NextResponse } from "next/server";
import { fetchWrapper } from "../utils/functions/fetch";
import { Attribute } from "@/models/attribute";

export const useAttributeService = () => {
  const POST = async (
    data: Attribute,
    session: string | any
  ): Promise<Attribute | undefined> => {
    const response: any = await fetchWrapper<Attribute>(`attribute`, {
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

  const GETALL = async (session: string | any): Promise<Attribute[] | undefined> => {
    const response: any = await fetchWrapper<Attribute[]>(`attribute`, {
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
  ): Promise<Attribute | undefined> => {
    const response = await fetchWrapper<Attribute>(`attribute/${id}`, {
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
    data: Attribute,
    session: string | any
  ): Promise<Attribute | undefined> => {
    const response = await fetchWrapper<Attribute>(`attribute`, {
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
  ): Promise<Attribute | undefined> => {
    const response = await fetchWrapper<Attribute>(`attribute/${id}`, {
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
