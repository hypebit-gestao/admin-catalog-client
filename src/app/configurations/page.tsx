"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import ContentMain from "@/components/content-main";
import useShippingRegisterModal from "@/utils/hooks/shipping/useRegisterShippingModal";
import ShippingRegister from "@/components/shipping/shipping-register";
import usePersonalizationStoreModal from "@/utils/hooks/pesonalization-store/usePersonalizationStoreModal";
import PersonalizationStore from "@/components/personalization_store/personalization-store";
import useGoogleAnalyticsModal from "@/utils/hooks/analytics/useGoogleAnalyticsModal";
import GoogleAnalyticsModal from "@/components/google-analytics/google-analytics-modal";
import { MdLocalShipping, MdPalette, MdChevronRight, MdAnalytics, MdQrCode2, MdCreditCard, MdOpenInNew } from "react-icons/md";
import useQRCodeModal from "@/utils/hooks/qrcode/useQRCodeModal";
import QRCodeModal from "@/components/qrcode/qrcode-modal";
import { cn } from "@/lib/utils";
import { useStripeService, SubscriptionInfo } from "@/services/stripe.service";
import toast from "react-hot-toast";

const configCards = [
  {
    id: "shipping",
    title: "Entrega",
    description: "Configure o tipo de frete, valores de entrega e taxas de envio para sua loja.",
    icon: MdLocalShipping,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    borderHover: "hover:border-blue-200",
  },
  {
    id: "personalization",
    title: "Personalização da Loja",
    description: "Defina a cor tema, descontos por forma de pagamento (PIX, crédito, débito) e outras preferências visuais.",
    icon: MdPalette,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    borderHover: "hover:border-purple-200",
  },
  {
    id: "analytics",
    title: "Google Analytics",
    description: "Conecte o Google Analytics à sua loja para acompanhar visitantes, conversões e comportamento dos clientes.",
    icon: MdAnalytics,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    borderHover: "hover:border-orange-200",
  },
  {
    id: "qrcode",
    title: "QR Code da Loja",
    description: "Gere um QR Code personalizado com as cores e logo da sua loja para compartilhar ou imprimir.",
    icon: MdQrCode2,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    borderHover: "hover:border-green-200",
  },
];

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  canceled: "Cancelada",
  past_due: "Em atraso",
  unpaid: "Não paga",
  trialing: "Em teste",
  incomplete: "Incompleta",
  incomplete_expired: "Expirada",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-amber-100 text-amber-700",
  canceled: "bg-red-100 text-red-700",
  unpaid: "bg-red-100 text-red-700",
  incomplete: "bg-gray-100 text-gray-700",
  incomplete_expired: "bg-gray-100 text-gray-700",
};

const Configurations = () => {
  const { data: session } = useSession();
  const shippingModal = useShippingRegisterModal();
  const personalizationStoreModal = usePersonalizationStoreModal();
  const gaModal = useGoogleAnalyticsModal();
  const qrCodeModal = useQRCodeModal();
  const stripeService = useStripeService();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    const userId = session?.user?.user?.id;
    const token = session?.user?.accessToken;
    if (!userId || !token) return;

    stripeService.getSubscription(userId, token).then(setSubscription).catch(() => null);
  }, [session?.user?.user?.id, session?.user?.accessToken]);

  const handleCardClick = (id: string) => {
    if (id === "shipping") shippingModal.onOpen();
    if (id === "personalization") personalizationStoreModal.onOpen();
    if (id === "analytics") gaModal.onOpen();
    if (id === "qrcode") qrCodeModal.onOpen();
  };

  const handleManageSubscription = async () => {
    const payerId = session?.user?.user?.payer_id;
    const token = session?.user?.accessToken;
    if (!payerId || !token) {
      toast.error("Assinatura não encontrada para esta conta.");
      return;
    }
    setLoadingPortal(true);
    try {
      const { url } = await stripeService.createBillingPortalSession(
        payerId,
        window.location.href,
        token,
      );
      window.location.href = url;
    } catch {
      toast.error("Não foi possível acessar o portal de assinatura.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString("pt-BR")
    : null;

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
      <GoogleAnalyticsModal
        isOpen={gaModal.isOpen}
        onClose={gaModal.onClose}
      />
      <QRCodeModal
        isOpen={qrCodeModal.isOpen}
        onClose={qrCodeModal.onClose}
      />
      <ContentMain
        title="Configurações da Loja"
        subtitle="Gerencie as preferências e personalizações da sua loja"
      >
        {/* Subscription card */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg flex-shrink-0 bg-indigo-50 text-indigo-600">
              <MdCreditCard size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-base">Assinatura</h3>
                {subscription?.status && (
                  <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", STATUS_COLORS[subscription.status] ?? "bg-gray-100 text-gray-700")}>
                    {STATUS_LABELS[subscription.status] ?? subscription.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {renewalDate
                  ? `Próxima renovação em ${renewalDate}`
                  : "Gerencie seu plano, faturas e dados de pagamento."}
              </p>
              <button
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
              >
                {loadingPortal ? "Aguarde..." : "Gerenciar assinatura"}
                <MdOpenInNew size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Config cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
          {configCards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={cn(
                "group text-left bg-white rounded-xl border border-gray-200/80 p-6",
                "shadow-sm hover:shadow-md transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-green-primary/20",
                card.borderHover
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-lg flex-shrink-0", card.iconBg, card.iconColor)}>
                  <card.icon size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-base">
                      {card.title}
                    </h3>
                    <MdChevronRight
                      size={20}
                      className="text-gray-400 group-hover:text-green-primary transition-colors flex-shrink-0"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ContentMain>
    </>
  );
};

export default Configurations;
