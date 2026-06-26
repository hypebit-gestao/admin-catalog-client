"use client";

import React, { useEffect, useState } from "react";
import Modal from "./modal";
import { useSession } from "next-auth/react";
import { useUserService } from "@/services/user.service";
import { Button } from "./ui/button";
import Loader from "./loader";
import toast from "react-hot-toast";

interface DeliveryTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_DELIVERY_TYPES = [
  { value: "PICKUP", label: "Retirada" },
  { value: "HOME_DELIVERY", label: "Entrega em domicílio" },
  { value: "CARRIER", label: "Entrega via Transportadora" },
];

const DeliveryTypesModal = ({ isOpen, onClose }: DeliveryTypesModalProps) => {
  const { data: session } = useSession();
  const userService = useUserService();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>(ALL_DELIVERY_TYPES.map((d) => d.value));

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      const user = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user?.accessToken
      );
      if (user?.delivery_types && user.delivery_types.length > 0) {
        setSelected(user.delivery_types);
      } else {
        setSelected(ALL_DELIVERY_TYPES.map((d) => d.value));
      }
    };
    fetchUser();
  }, [isOpen]);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const onSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um tipo de entrega.");
      return;
    }
    setLoading(true);
    try {
      await userService.PUT(
        { id: session?.user?.user?.id, delivery_types: selected } as any,
        session?.user?.accessToken
      );
      toast.success("Tipos de entrega atualizados!");
      onClose();
    } catch {
      toast.error("Não foi possível salvar as alterações.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <h1 className="text-[#2c6e49] font-bold text-xl">
          Tipos de Entrega
        </h1>
      }
      body={
        <div className="w-full py-2">
          <p className="text-sm text-muted-foreground mb-5">
            Selecione quais opções de entrega serão exibidas para os clientes no carrinho.
          </p>
          <div className="space-y-3">
            {ALL_DELIVERY_TYPES.map((type) => {
              const checked = selected.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggle(type.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                    checked
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "border-green-600 bg-green-600" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium text-gray-800">{type.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-8">
            <Button
              size="lg"
              className="w-full"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? <Loader /> : "Salvar"}
            </Button>
          </div>
        </div>
      }
    />
  );
};

export default DeliveryTypesModal;
