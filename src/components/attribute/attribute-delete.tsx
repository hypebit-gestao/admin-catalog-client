"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";

import { useSession } from "next-auth/react";

import { MdDelete } from "react-icons/md";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import useSizeDeleteModal from "@/utils/hooks/size/useDeleteSizeModal";
import { useSizeService } from "@/services/size.service";
import { Size } from "@/models/size";
import { useAttributeService } from "@/services/attribute.service";
import useAttributeDeleteModal from "@/utils/hooks/attribute/useDeleteAttributeModal";
import useAttributeRegisterModal from "@/utils/hooks/attribute/useRegisterAttributeModal";
import useAttributeUpdateModal from "@/utils/hooks/attribute/useUpdateAttributeModal";

interface AttributeDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const AttributeDelete = ({ isOpen, onClose }: AttributeDeleteProps) => {
  const { data: session } = useSession();
  const attributeService = useAttributeService()
  const sizeService = useSizeService();
  const attributeDelete = useAttributeDeleteModal();
  const sizeDelete = useSizeDeleteModal();
  const [size, setSize] = useState<Size>();

  const handleDelete = () => {
    attributeService.DELETE(attributeDelete.itemId, session?.user.accessToken).then((res: any) => {
      toast.success("Atributo excluído com sucesso");
      useAttributeDeleteModal.setState({ isDelete: true });
       onClose();
    }).catch((err) => {
       onClose();
      toast.error(err?.message);
    })

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
        <>
          <h1 className="text-primary-blue font-bold text-xl">
            Excluir atributo
          </h1>
        </>
      }
      body={
        <>
          <div className="flex flex-col justify-center items-center">
            <MdDelete size={100} color="red" />
            <div className="my-4 text-lg">
              <p>Deseja mesmo excluir esse atributo?</p>
            </div>
            <div className="flex flex-row items-center my-6">
              <Button
                size={"lg"}
                onClick={() => {
                  handleDelete();
                }}
                className="bg-red-600 hover:bg-red-700 mr-5 w-full"
              >
                Excluir
              </Button>
              <Button
                onClick={() => attributeDelete.onClose()}
                size={"lg"}
                variant={"outline"}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </>
      }
    />
  );
};

export default AttributeDelete;
