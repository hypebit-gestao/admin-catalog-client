import { fetchWrapper } from "../utils/functions/fetch";

export interface AsaasDashboard {
  receivedThisMonth: number;
  receivedCount: number;
  pendingValue: number;
  pendingCount: number;
  overdueValue: number;
  overdueCount: number;
  activeSubscriptions: number;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  customerName?: string;
  value: number;
  nextDueDate: string;
  status: string;
  billingType: string;
  cycle: string;
  description?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  customerName?: string;
  value: number;
  netValue?: number;
  dueDate: string;
  paymentDate?: string;
  status: string;
  billingType: string;
  description?: string;
  invoiceUrl?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  dateCreated: string;
}

export interface AsaasPageResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
}

export const useAsaasService = () => {
  const getDashboard = async (token: string): Promise<AsaasDashboard | undefined> => {
    return fetchWrapper<AsaasDashboard>("asaas/dashboard", {
      headers: { Authorization: token },
    });
  };

  const getSubscriptions = async (
    token: string,
    status?: string,
    offset = 0,
    limit = 20,
  ): Promise<AsaasPageResponse<AsaasSubscription> | undefined> => {
    const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    if (status) params.set("status", status);
    return fetchWrapper<AsaasPageResponse<AsaasSubscription>>(`asaas/subscriptions?${params}`, {
      headers: { Authorization: token },
    });
  };

  const getPayments = async (
    token: string,
    status?: string,
    offset = 0,
    limit = 20,
  ): Promise<AsaasPageResponse<AsaasPayment> | undefined> => {
    const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    if (status) params.set("status", status);
    return fetchWrapper<AsaasPageResponse<AsaasPayment>>(`asaas/payments?${params}`, {
      headers: { Authorization: token },
    });
  };

  const getCustomers = async (
    token: string,
    offset = 0,
    limit = 20,
  ): Promise<AsaasPageResponse<AsaasCustomer> | undefined> => {
    const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
    return fetchWrapper<AsaasPageResponse<AsaasCustomer>>(`asaas/customers?${params}`, {
      headers: { Authorization: token },
    });
  };

  return { getDashboard, getSubscriptions, getPayments, getCustomers };
};
