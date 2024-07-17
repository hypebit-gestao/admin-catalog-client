import { NextResponse } from "next/server";
import { fetchWrapper } from "../utils/functions/fetch";
import { Coupon } from "@/models/coupon";

export const useCouponService = () => {
  const POST = async (
    data: Coupon,
    session: string | any
  ): Promise<Coupon | undefined> => {
    const response: any = await fetchWrapper<Coupon>(`coupon`, {
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

  const GETALL = async (session: string | any): Promise<Coupon[] | undefined> => {
    const response: any = await fetchWrapper<Coupon[]>(`coupon`, {
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
  ): Promise<Coupon | undefined> => {
    const response = await fetchWrapper<Coupon>(`coupon/${id}`, {
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
    data: Coupon,
    session: string | any
  ): Promise<Coupon | undefined> => {
    const response = await fetchWrapper<Coupon>(`coupon`, {
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
  ): Promise<Coupon | undefined> => {
    const response = await fetchWrapper<Coupon>(`coupon/${id}`, {
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
