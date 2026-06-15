"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";
import { useSession } from "next-auth/react";
import { MdDelete } from "react-icons/md";
import { useAttributeService } from "@/services/attribute.service";
import useAttributeDeleteModal from "@/utils/hooks/attribute/useDeleteAttributeModal";
import useAttributeRegisterModal from "@/utils/hooks/attribute/useRegisterAttributeModal";
import useAttributeUpdateModal from "@/utils/hooks/attribute/useUpdateAttributeModal";
import { Button } from "../ui/button";
import Loader from "../loader";
import toast from "react-hot-toast";

interface AttributeDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const AttributeDelete = ({ isOpen, onClose }: AttributeDeleteProps) => {
  const { data: session } = useSession();
  const attributeService = useAttributeService();
  const attributeDelete = useAttributeDeleteModal();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await attributeService.DELETE(attributeDelete.itemId, session?.user.accessToken);
      useAttributeDeleteModal.setState({ isDelete: true });
      toast.success("Atributo excluído com sucesso");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir atributo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    useAttributeRegisterModal.setState({ isRegister: false });
    useAttributeUpdateModal.setState({ isUpdate: false });
    useAttributeDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <h1 className="text-primary-blue font-bold text-xl">Excluir atributo</h1>
      }
      body={
        <div className="flex flex-col justify-center items-center">
          <MdDelete size={100} color="red" />
          <div className="my-4 text-lg text-center">
            <p>Deseja mesmo excluir esse atributo?</p>
            <p className="text-sm text-muted-foreground mt-1">Essa ação não pode ser desfeita.</p>
          </div>
          <div className="flex flex-row items-center my-6 gap-3">
            <Button
              size={"lg"}
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 w-full"
            >
              {loading ? <Loader /> : "Excluir"}
            </Button>
            <Button
              onClick={() => attributeDelete.onClose()}
              size={"lg"}
              variant={"outline"}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      }
    />
  );
};

export default AttributeDelete;
