"use client";

import { useSession } from "next-auth/react";
import React from "react";
import ContentMain from "@/components/content-main";
import useShippingRegisterModal from "@/utils/hooks/shipping/useRegisterShippingModal";
import ShippingRegister from "@/components/shipping/shipping-register";
import usePersonalizationStoreModal from "@/utils/hooks/pesonalization-store/usePersonalizationStoreModal";
import PersonalizationStore from "@/components/personalization_store/personalization-store";
import useGoogleAnalyticsModal from "@/utils/hooks/analytics/useGoogleAnalyticsModal";
import GoogleAnalyticsModal from "@/components/google-analytics/google-analytics-modal";
import { MdLocalShipping, MdPalette, MdChevronRight, MdAnalytics, MdQrCode2, MdPayment, MdCreditScore, MdSend } from "react-icons/md";
import { FaInstagram } from "react-icons/fa";
import useQRCodeModal from "@/utils/hooks/qrcode/useQRCodeModal";
import QRCodeModal from "@/components/qrcode/qrcode-modal";
import usePaymentMethodsModal from "@/utils/hooks/usePaymentMethodsModal";
import PaymentMethodsModal from "@/components/payment-methods-modal";
import useInstallmentsModal from "@/utils/hooks/useInstallmentsModal";
import InstallmentsModal from "@/components/installments-modal";
import useSocialModal from "@/utils/hooks/useSocialModal";
import SocialModal from "@/components/social/social-modal";
import useOrderDestinationModal from "@/utils/hooks/useOrderDestinationModal";
import OrderDestinationModal from "@/components/order-destination-modal";
import { cn } from "@/lib/utils";

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
  {
    id: "payment-methods",
    title: "Métodos de Pagamento",
    description: "Escolha quais formas de pagamento (Dinheiro, Pix, Crédito, Débito) aparecem para seus clientes no carrinho.",
    icon: MdPayment,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    borderHover: "hover:border-teal-200",
  },
  {
    id: "installments",
    title: "Parcelamento",
    description: "Configure o máximo de parcelas, se há juros e a taxa de juros para pagamentos no cartão de crédito.",
    icon: MdCreditScore,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    borderHover: "hover:border-sky-200",
  },
  {
    id: "social",
    title: "Redes Sociais",
    description: "Adicione o link do seu Instagram para exibir no rodapé da sua loja e facilitar o contato.",
    icon: FaInstagram,
    iconBg: "bg-pink-50",
    iconColor: "text-pink-600",
    borderHover: "hover:border-pink-200",
  },
  {
    id: "order-destination",
    title: "Destino dos Pedidos",
    description: "Escolha se os pedidos chegam pelo WhatsApp, por e-mail ou pelos dois canais. Ideal para distribuidoras e equipes de vendas.",
    icon: MdSend,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderHover: "hover:border-indigo-200",
  },
];

const Configurations = () => {
  const { data: session } = useSession();
  const shippingModal = useShippingRegisterModal();
  const personalizationStoreModal = usePersonalizationStoreModal();
  const gaModal = useGoogleAnalyticsModal();
  const qrCodeModal = useQRCodeModal();
  const paymentMethodsModal = usePaymentMethodsModal();
  const installmentsModal = useInstallmentsModal();
  const socialModal = useSocialModal();
  const orderDestinationModal = useOrderDestinationModal();

  const handleCardClick = (id: string) => {
    if (id === "shipping") shippingModal.onOpen();
    if (id === "personalization") personalizationStoreModal.onOpen();
    if (id === "analytics") gaModal.onOpen();
    if (id === "qrcode") qrCodeModal.onOpen();
    if (id === "payment-methods") paymentMethodsModal.onOpen();
    if (id === "installments") installmentsModal.onOpen();
    if (id === "social") socialModal.onOpen();
    if (id === "order-destination") orderDestinationModal.onOpen();
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
      <GoogleAnalyticsModal
        isOpen={gaModal.isOpen}
        onClose={gaModal.onClose}
      />
      <QRCodeModal
        isOpen={qrCodeModal.isOpen}
        onClose={qrCodeModal.onClose}
      />
      <PaymentMethodsModal
        isOpen={paymentMethodsModal.isOpen}
        onClose={paymentMethodsModal.onClose}
      />
      <InstallmentsModal
        isOpen={installmentsModal.isOpen}
        onClose={installmentsModal.onClose}
      />
      <SocialModal
        isOpen={socialModal.isOpen}
        onClose={socialModal.onClose}
      />
      <OrderDestinationModal
        isOpen={orderDestinationModal.isOpen}
        onClose={orderDestinationModal.onClose}
      />
      <ContentMain
        title="Configurações da Loja"
        subtitle="Gerencie as preferências e personalizações da sua loja"
      >
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
