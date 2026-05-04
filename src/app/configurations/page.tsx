"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import ContentMain from "@/components/content-main";
import { Button } from "@/components/ui/button";
import useShippingRegisterModal from "@/utils/hooks/shipping/useRegisterShippingModal";
import ShippingRegister from "@/components/shipping/shipping-register";
import usePersonalizationStoreModal from "@/utils/hooks/pesonalization-store/usePersonalizationStoreModal";
import PersonalizationStore from "@/components/personalization_store/personalization-store";
import { useStripeService, SubscriptionInfo } from "@/services/stripe.service";
import toast from "react-hot-toast";
import Loader from "@/components/loader";

const PLAN_NAMES: Record<string, string> = {
  prod_PYYUnM67J8LUuW: "Standard",
  prod_PfggkIQc7LEiu5: "Standard Promo",
  prod_Pnx2K50XSrwCDy: "Professional",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  canceled: "Cancelada",
  incomplete: "Incompleta",
  incomplete_expired: "Expirada",
  past_due: "Pagamento em Atraso",
  trialing: "Período de Teste",
  unpaid: "Não Pago",
  paused: "Pausada",
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-green-600",
  trialing: "text-blue-600",
  canceled: "text-red-500",
  past_due: "text-yellow-600",
  unpaid: "text-red-500",
  incomplete: "text-gray-500",
  incomplete_expired: "text-gray-500",
  paused: "text-gray-500",
};

const Configurations = () => {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const { data: session } = useSession();
  const shippingModal = useShippingRegisterModal();
  const personalizationStoreModal = usePersonalizationStoreModal();
  const stripeService = useStripeService();

  const user = session?.user as any;

  useEffect(() => {
    if (!user?.id || !user?.accessToken) return;

    stripeService
      .getSubscription(user.id, user.accessToken)
      .then((sub) => setSubscription(sub))
      .catch(() => setSubscription(null))
      .finally(() => setLoadingSubscription(false));
  }, [user?.id]);

  const handleManageSubscription = async () => {
    if (!user?.payer_id) {
      toast.error("Nenhum cliente Stripe associado a esta conta.");
      return;
    }

    setLoadingPortal(true);
    try {
      const returnUrl = window.location.href;
      const { url } = await stripeService.createBillingPortalSession(
        user.payer_id,
        returnUrl,
        user.accessToken
      );
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao abrir portal de assinatura.");
      setLoadingPortal(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("pt-BR");
  };

  return (
    <>
      <ShippingRegister
        isOpen={shippingModal.isOpen}
        onClose={shippingModal.onClose}
      />
      <PersonalizationStore
        isOpen={personalizationStoreModal.isOpen}
        onClose={personalizationStoreModal.onClose}
      />
      <ContentMain title="Configurações da Loja">
        <div className="h-[96%] flex items-center justify-center">
          <div className="flex flex-col w-full items-center gap-6">

            {/* Assinatura */}
            <div className="w-1/2 border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Sua Assinatura
              </h2>

              {loadingSubscription ? (
                <div className="flex justify-center py-4">
                  <Loader color="text-green-primary" />
                </div>
              ) : subscription ? (
                <div className="mb-4 space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Plano:</span>{" "}
                    {PLAN_NAMES[subscription.planId] ?? subscription.planId}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    <span className={STATUS_COLORS[subscription.status] ?? ""}>
                      {STATUS_LABELS[subscription.status] ?? subscription.status}
                    </span>
                  </p>
                  {subscription.currentPeriodEnd && (
                    <p>
                      <span className="font-medium">Próxima renovação:</span>{" "}
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  Nenhuma assinatura encontrada.
                </p>
              )}

              <Button
                onClick={handleManageSubscription}
                size="lg"
                className="w-full"
                disabled={loadingPortal || !user?.payer_id}
              >
                {loadingPortal ? (
                  <Loader color="#fff" />
                ) : (
                  "Gerenciar Assinatura"
                )}
              </Button>
            </div>

            {/* Entrega */}
            <div className="w-1/2">
              <Button
                onClick={() => shippingModal.onOpen()}
                size="xl"
                className="w-full"
                type="button"
              >
                <h1 className="text-xl">Entrega</h1>
              </Button>
            </div>

            {/* Personalização */}
            <div className="w-1/2">
              <Button
                onClick={() => personalizationStoreModal.onOpen()}
                size="xl"
                className="w-full"
                type="button"
              >
                <h1 className="text-xl">Personalização da loja</h1>
              </Button>
            </div>

          </div>
        </div>
      </ContentMain>
    </>
  );
};

export default Configurations;
