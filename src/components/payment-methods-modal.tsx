"use client";

import React, { useEffect, useState } from "react";
import Modal from "./modal";
import { useSession } from "next-auth/react";
import { useUserService } from "@/services/user.service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Loader from "./loader";
import toast from "react-hot-toast";

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "Pix" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "BOLETO", label: "Boleto" },
];

const PaymentMethodsModal = ({ isOpen, onClose }: PaymentMethodsModalProps) => {
  const { data: session } = useSession();
  const userService = useUserService();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>(ALL_METHODS.map((m) => m.value));
  const [pixKey, setPixKey] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      const user = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user?.accessToken
      );
      if (user?.payment_methods && user.payment_methods.length > 0) {
        setSelected(user.payment_methods);
      } else {
        setSelected(ALL_METHODS.map((m) => m.value));
      }
      setPixKey(user?.pix_key ?? "");
    };
    fetchUser();
  }, [isOpen]);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const pixEnabled = selected.includes("PIX");

  const onSubmit = async () => {
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um método de pagamento.");
      return;
    }
    setLoading(true);
    try {
      await userService.PUT(
        {
          id: session?.user?.user?.id,
          payment_methods: selected,
          pix_key: pixEnabled ? pixKey.trim() : null,
        },
        session?.user?.accessToken
      );
      toast.success("Métodos de pagamento atualizados!");
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
          Métodos de Pagamento
        </h1>
      }
      body={
        <div className="w-full py-2">
          <p className="text-sm text-muted-foreground mb-5">
            Selecione quais formas de pagamento serão exibidas para os clientes no carrinho.
          </p>
          <div className="space-y-3">
            {ALL_METHODS.map((method) => {
              const checked = selected.includes(method.value);
              return (
                <div key={method.value}>
                  <button
                    type="button"
                    onClick={() => toggle(method.value)}
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
                    <span className="font-medium text-gray-800">{method.label}</span>
                  </button>

                  {method.value === "PIX" && checked && (
                    <div className="mt-2 mb-1 px-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Chave Pix
                      </label>
                      <Input
                        placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Opcional. Será exibida ao cliente quando ele selecionar Pix.
                      </p>
                    </div>
                  )}
                </div>
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

export default PaymentMethodsModal;
