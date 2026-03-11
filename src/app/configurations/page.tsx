"use client";

import { useSession } from "next-auth/react";
import React from "react";
import ContentMain from "@/components/content-main";
import { Button } from "@/components/ui/button";
import useShippingRegisterModal from "@/utils/hooks/shipping/useRegisterShippingModal";
import ShippingRegister from "@/components/shipping/shipping-register";
import usePersonalizationStoreModal from "@/utils/hooks/pesonalization-store/usePersonalizationStoreModal";
import PersonalizationStore from "@/components/personalization_store/personalization-store";
import { MdLocalShipping, MdPalette, MdChevronRight } from "react-icons/md";
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
];

const Configurations = () => {
  const { data: session } = useSession();
  const shippingModal = useShippingRegisterModal();
  const personalizationStoreModal = usePersonalizationStoreModal();

  const handleCardClick = (id: string) => {
    if (id === "shipping") shippingModal.onOpen();
    if (id === "personalization") personalizationStoreModal.onOpen();
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
      <ContentMain
        title="Configurações da Loja"
        subtitle="Gerencie as preferências e personalizações da sua loja"
      >
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
