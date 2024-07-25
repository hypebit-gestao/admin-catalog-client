import { NextResponse } from "next/server";
import { fetchWrapper } from "../utils/functions/fetch";
import { Attribute, AttributeOption, AttributeProduct } from "@/models/attribute";

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

  const POSTOPTION = async (
    data: AttributeOption,
    session: string | any
  ): Promise<AttributeOption | undefined> => {
    const response: any = await fetchWrapper<AttributeOption>(`attributeOption`, {
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

  const POSTPRODUCTOPTION = async (
    data: AttributeProduct,
    session: string | any
  ): Promise<AttributeProduct | undefined> => {
    const response: any = await fetchWrapper<AttributeProduct>(`attributeProduct`, {
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

  
  const GETALLATTRIBUTEOPTION = async (session: string | any): Promise<AttributeOption[] | undefined> => {
    const response: any = await fetchWrapper<AttributeOption[]>(`attributeOption`, {
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
    POSTOPTION,
    POSTPRODUCTOPTION,
    GETALL,
    GETALLATTRIBUTEOPTION,
    GETBYID,
    PUT,
    DELETE,
  };
};
