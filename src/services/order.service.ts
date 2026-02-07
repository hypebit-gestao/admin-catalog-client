import { fetchWrapper } from "../utils/functions/fetch";
import { User } from "../models/user";
import { Order } from "@/models/order";
import {
  OrderAnalyticsResponse,
  OrderDashboardResponse,
} from "@/models/order-analytics";

export const useOrderService = () => {
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

  const GETALL = async (
    session: string | any,
    userId: string | undefined
  ): Promise<Order[] | undefined> => {
    const response = await fetchWrapper<Order[]>(`order/user/${userId}`, {
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
  ): Promise<Order | undefined> => {
    const response = await fetchWrapper<Order>(`order/${id}`, {
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
    data: Order,
    session: string | any
  ): Promise<Order | undefined> => {
    const response = await fetchWrapper<Order>(`order`, {
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
    await fetchWrapper<Order[]>(`order/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
    });
  };

  const GETANALYTICS = async (
    session: string | any,
    userId: string | undefined
  ): Promise<OrderAnalyticsResponse | undefined> => {
    const response = await fetchWrapper<OrderAnalyticsResponse>(
      `order/analytics/${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `${session}`,
        },
      }
    );
    return response;
  };

  const GETDASHBOARD = async (
    session: string | any,
    userId: string | undefined
  ): Promise<OrderDashboardResponse | undefined> => {
    const response = await fetchWrapper<OrderDashboardResponse>(
      `order/dashboard/${userId}`,
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
    GETALL,
    GETBYID,
    GETANALYTICS,
    GETDASHBOARD,
    POST,
    PUT,
    DELETE,
  };
};
