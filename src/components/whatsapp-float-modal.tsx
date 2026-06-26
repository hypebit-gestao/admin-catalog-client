"use client";

import React, { useEffect, useState } from "react";
import Modal from "./modal";
import { useSession } from "next-auth/react";
import { useUserService } from "@/services/user.service";
import { Button } from "./ui/button";
import Loader from "./loader";
import toast from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";

interface WhatsAppFloatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsAppFloatModal = ({ isOpen, onClose }: WhatsAppFloatModalProps) => {
  const { data: session } = useSession();
  const userService = useUserService();
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      const user = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user?.accessToken
      );
      setHidden(user?.hide_whatsapp_float ?? false);
    };
    fetchUser();
  }, [isOpen]);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await userService.PUT(
        { id: session?.user?.user?.id, hide_whatsapp_float: hidden } as any,
        session?.user?.accessToken
      );
      toast.success("Configuração salva!");
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
          Botão Flutuante do WhatsApp
        </h1>
      }
      body={
        <div className="w-full py-2">
          <p className="text-sm text-muted-foreground mb-6">
            O botão flutuante aparece no canto da loja e permite que clientes iniciem uma conversa rapidamente. Você pode ocultá-lo se preferir que o contato aconteça apenas pelo carrinho.
          </p>

          <button
            type="button"
            onClick={() => setHidden((prev) => !prev)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
              !hidden
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
              <FaWhatsapp size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Botão flutuante</p>
              <p className="text-sm text-gray-500">
                {hidden ? "Oculto — clientes não verão o botão" : "Visível — aparece no site"}
              </p>
            </div>
            <div
              className={`w-12 h-6 rounded-full transition-colors shrink-0 ${
                hidden ? "bg-gray-300" : "bg-green-500"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${
                  hidden ? "translate-x-0.5" : "translate-x-6"
                }`}
              />
            </div>
          </button>

          <div className="mt-8">
            <Button size="lg" className="w-full" onClick={onSubmit} disabled={loading}>
              {loading ? <Loader /> : "Salvar"}
            </Button>
          </div>
        </div>
      }
    />
  );
};

export default WhatsAppFloatModal;
