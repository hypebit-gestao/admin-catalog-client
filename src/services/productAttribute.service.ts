import { NextResponse } from "next/server";
import { fetchWrapper } from "../utils/functions/fetch";
import { Attribute, AttributeOption, AttributeProduct } from "@/models/attribute";
import { ProductAttribute } from "@/models/productAttribute";

export const useProductAttributeService = () => {


  const GETALL = async (
    session: string | any,
    id: string | undefined
  ): Promise<ProductAttribute | undefined> => {
    const response = await fetchWrapper<ProductAttribute>(`productAttribute/user/${id}`, {
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

  
  return {
    GETALL,
  };
};
