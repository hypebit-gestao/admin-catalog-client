"use client";

import React, { useEffect, useState } from "react";
import Modal from "./modal";
import { useSession } from "next-auth/react";
import { useUserService } from "@/services/user.service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Loader from "./loader";
import toast from "react-hot-toast";

interface InstallmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallmentsModal = ({ isOpen, onClose }: InstallmentsModalProps) => {
  const { data: session } = useSession();
  const userService = useUserService();
  const [loading, setLoading] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [maxInstallments, setMaxInstallments] = useState("1");
  const [withInterest, setWithInterest] = useState(false);
  const [interestValue, setInterestValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      const user = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user?.accessToken
      );
      if (user) {
        setEnabled(user.installments_enabled ?? false);
        setMaxInstallments(String(user.max_installments ?? 1));
        setWithInterest(user.installment_with_interest ?? false);
        setInterestValue(String(user.installment_interest_value ?? ""));
      }
    };
    fetchUser();
  }, [isOpen]);

  const onSubmit = async () => {
    const max = Number(maxInstallments);
    if (enabled && (isNaN(max) || max < 2 || max > 36)) {
      toast.error("Máximo de parcelas deve ser entre 2 e 36.");
      return;
    }
    if (enabled && withInterest) {
      const iv = Number(interestValue);
      if (isNaN(iv) || iv <= 0 || iv > 100) {
        toast.error("Taxa de juros deve ser entre 0.01% e 100%.");
        return;
      }
    }
    setLoading(true);
    try {
      await userService.PUT(
        {
          id: session?.user?.user?.id,
          installments_enabled: enabled,
          max_installments: enabled ? max : 1,
          installment_with_interest: enabled ? withInterest : false,
          installment_interest_value: enabled && withInterest ? Number(interestValue) : null,
        },
        session?.user?.accessToken
      );
      toast.success("Configurações de parcelamento salvas!");
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
        <h1 className="text-[#2c6e49] font-bold text-xl">Parcelamento</h1>
      }
      body={
        <div className="w-full py-2 space-y-5">
          <p className="text-sm text-muted-foreground">
            Configure as opções de parcelamento que serão exibidas para os clientes no carrinho e nas páginas de produto.
          </p>

          {/* Toggle habilitar */}
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
              enabled ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                enabled ? "border-green-600 bg-green-600" : "border-gray-300"
              }`}
            >
              {enabled && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">Parcelamento habilitado</p>
              <p className="text-xs text-gray-500 mt-0.5">Exibe opções de parcelas no cartão de crédito</p>
            </div>
          </button>

          {enabled && (
            <div className="space-y-4 pl-1">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Máximo de parcelas
                </label>
                <Input
                  type="number"
                  min={2}
                  max={36}
                  value={maxInstallments}
                  onChange={(e) => setMaxInstallments(e.target.value)}
                  className="h-11 rounded-xl max-w-[160px]"
                  placeholder="Ex.: 12"
                />
                <p className="text-xs text-muted-foreground mt-1">Entre 2 e 36 parcelas</p>
              </div>

              {/* Juros */}
              <button
                type="button"
                onClick={() => setWithInterest((v) => !v)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors w-full ${
                  withInterest ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    withInterest ? "border-amber-500 bg-amber-500" : "border-gray-300"
                  }`}
                >
                  {withInterest && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">Parcelamento com juros</p>
                  <p className="text-xs text-gray-500 mt-0.5">Quando desmarcado, parcelas são sem juros</p>
                </div>
              </button>

              {withInterest && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Taxa de juros mensal (%)
                  </label>
                  <Input
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.01}
                    value={interestValue}
                    onChange={(e) => setInterestValue(e.target.value)}
                    className="h-11 rounded-xl max-w-[200px]"
                    placeholder="Ex.: 2.5"
                  />
                </div>
              )}
            </div>
          )}

          <div className="pt-3">
            <Button size="lg" className="w-full" onClick={onSubmit} disabled={loading}>
              {loading ? <Loader /> : "Salvar"}
            </Button>
          </div>
        </div>
      }
    />
  );
};

export default InstallmentsModal;
