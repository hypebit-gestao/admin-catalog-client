"use client";

import React, { useEffect, useState } from "react";
import Modal from "./modal";
import { useSession } from "next-auth/react";
import { useUserService } from "@/services/user.service";
import { Button } from "./ui/button";
import Loader from "./loader";
import toast from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
import { MdEmail, MdDevices } from "react-icons/md";

interface OrderDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OPTIONS = [
  {
    value: "WHATSAPP",
    label: "WhatsApp",
    description: "O cliente (ou vendedor) clica em um link e abre o WhatsApp da loja com o pedido preenchido.",
    icon: FaWhatsapp,
    iconColor: "text-[#25D366]",
    iconBg: "bg-[#25D366]/10",
  },
  {
    value: "EMAIL",
    label: "E-mail da loja",
    description: "O pedido é enviado diretamente para o e-mail cadastrado na sua conta. Ideal para distribuidoras e equipes de vendas.",
    icon: MdEmail,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    value: "BOTH",
    label: "WhatsApp + E-mail",
    description: "O pedido é enviado por e-mail para a loja e também abre o WhatsApp. Notificação dupla.",
    icon: MdDevices,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
  },
];

const OrderDestinationModal = ({ isOpen, onClose }: OrderDestinationModalProps) => {
  const { data: session } = useSession();
  const userService = useUserService();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("WHATSAPP");

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      const user = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user?.accessToken
      );
      setSelected(user?.order_destination ?? "WHATSAPP");
    };
    fetchUser();
  }, [isOpen]);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await userService.PUT(
        { id: session?.user?.user?.id, order_destination: selected } as any,
        session?.user?.accessToken
      );
      toast.success("Destino dos pedidos atualizado!");
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
          Destino dos Pedidos
        </h1>
      }
      body={
        <div className="w-full py-2">
          <p className="text-sm text-muted-foreground mb-5">
            Escolha para onde os pedidos feitos no seu catálogo serão enviados.
          </p>

          <div className="space-y-3">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const checked = selected === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelected(opt.value)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                    checked
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${opt.iconBg} flex-shrink-0 mt-0.5`}>
                    <Icon size={20} className={opt.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{opt.label}</span>
                      {checked && (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      checked ? "border-green-600 bg-green-600" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selected === "EMAIL" && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>E-mail do destinatário:</strong> {session?.user?.user?.email ?? "—"}
                <br />
                Os pedidos serão enviados para este e-mail automaticamente.
              </p>
            </div>
          )}

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

export default OrderDestinationModal;
