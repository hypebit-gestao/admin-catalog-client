import { fetchWrapper } from "../utils/functions/fetch";

export interface SubscriptionInfo {
  status: string;
  planId: string;
  currentPeriodEnd: number;
  subscriptionId: string;
}

export interface InvoiceInfo {
  id: string;
  date: number;
  amount: number;
  status: string;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

export const useStripeService = () => {
  const createBillingPortalSession = async (
    customerId: string,
    returnUrl: string,
    session: string | any
  ): Promise<{ url: string }> => {
    return fetchWrapper<{ url: string }>("stripe/billing-portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
      body: JSON.stringify({ customerId, returnUrl }),
    });
  };

  const createCheckoutSession = async (
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    customerEmail: string | undefined,
    session: string | any
  ): Promise<{ url: string }> => {
    return fetchWrapper<{ url: string }>("stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${session}`,
      },
      body: JSON.stringify({ priceId, successUrl, cancelUrl, customerEmail }),
    });
  };

  const getSubscription = async (
    userId: string,
    session: string | any
  ): Promise<SubscriptionInfo | null> => {
    return fetchWrapper<SubscriptionInfo | null>(`stripe/subscription/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `${session}`,
      },
    });
  };

  const getInvoices = async (
    userId: string,
    session: string | any,
  ): Promise<InvoiceInfo[]> => {
    return fetchWrapper<InvoiceInfo[]>(`stripe/invoices/${userId}`, {
      method: 'GET',
      headers: { Authorization: `${session}` },
    });
  };

  return {
    createBillingPortalSession,
    createCheckoutSession,
    getSubscription,
    getInvoices,
  };
};
