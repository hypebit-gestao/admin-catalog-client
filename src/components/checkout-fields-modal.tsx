"use client";

import React, { useEffect, useState } from "react";
import Modal from "./modal";
import { useSession } from "next-auth/react";
import { useUserService } from "@/services/user.service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Loader from "./loader";
import toast from "react-hot-toast";
import { MdAdd, MdDelete, MdDragIndicator } from "react-icons/md";

interface CheckoutField {
  id: string;
  label: string;
  required: boolean;
  type: "text" | "number";
}

interface CheckoutFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutFieldsModal = ({ isOpen, onClose }: CheckoutFieldsModalProps) => {
  const { data: session } = useSession();
  const userService = useUserService();
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<CheckoutField[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUser = async () => {
      const user = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user?.accessToken
      );
      setFields((user?.checkout_fields as CheckoutField[]) ?? []);
    };
    fetchUser();
  }, [isOpen]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", required: false, type: "text" },
    ]);
  };

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateField = (id: string, patch: Partial<CheckoutField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  };

  const onSubmit = async () => {
    const invalid = fields.some((f) => !f.label.trim());
    if (invalid) {
      toast.error("Preencha o nome de todos os campos.");
      return;
    }
    setLoading(true);
    try {
      await userService.PUT(
        { id: session?.user?.user?.id, checkout_fields: fields } as any,
        session?.user?.accessToken
      );
      toast.success("Campos personalizados salvos!");
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
          Campos Personalizados no Checkout
        </h1>
      }
      body={
        <div className="w-full py-2">
          <p className="text-sm text-muted-foreground mb-5">
            Adicione campos extras que o cliente deve preencher ao finalizar o pedido, como CNPJ, Razão Social, Inscrição Estadual, etc.
          </p>

          <div className="space-y-3">
            {fields.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-xl">
                Nenhum campo adicionado ainda.
              </p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50"
              >
                <MdDragIndicator size={20} className="text-gray-400 mt-2.5 shrink-0" />

                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Nome do campo (ex.: CNPJ, Razão Social)"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="h-10 rounded-lg"
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(field.id, { type: e.target.value as "text" | "number" })
                        }
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="text">Texto</option>
                        <option value="number">Número</option>
                      </select>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(field.id, { required: e.target.checked })
                        }
                        className="w-4 h-4 accent-green-600 rounded"
                      />
                      Obrigatório
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="mt-2 p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors shrink-0"
                  aria-label="Remover campo"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addField}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
          >
            <MdAdd size={18} />
            Adicionar campo
          </button>

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

export default CheckoutFieldsModal;
