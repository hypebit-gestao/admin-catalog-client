import { fetchWrapper } from "../utils/functions/fetch";

export interface VolumePrice {
  id?: string;
  product_id: string;
  min_quantity: number;
  unit_price: number;
}

export const useProductVolumePriceService = () => {
  const POST = async (data: VolumePrice, session: string): Promise<VolumePrice> => {
    const response: any = await fetchWrapper<VolumePrice>("product-volume-price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
      body: JSON.stringify(data),
    });
    if (response?.error) throw new Error(response.message);
    return response;
  };

  const GETBYPRODUCTID = async (productId: string, session: string): Promise<VolumePrice[]> => {
    const response = await fetchWrapper<VolumePrice[]>(
      `product-volume-price/product/${productId}`,
      {
        method: "GET",
        headers: { Authorization: `${session}` },
      }
    );
    return response ?? [];
  };

  const DELETE = async (id: string, session: string): Promise<void> => {
    await fetchWrapper<void>(`product-volume-price/${id}`, {
      method: "DELETE",
      headers: { Authorization: `${session}` },
    });
  };

  return { POST, GETBYPRODUCTID, DELETE };
};
