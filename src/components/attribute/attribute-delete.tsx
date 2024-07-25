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
import useSizeRegisterModal from "@/utils/hooks/size/useRegisterSizeModal";
import useSizeUpdateModal from "@/utils/hooks/size/useUpdateSizeModal";

interface SizeDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const AttributeDelete = ({ isOpen, onClose }: SizeDeleteProps) => {
  const { data: session } = useSession();
  const sizeService = useSizeService();
  const sizeDelete = useSizeDeleteModal();
  const [size, setSize] = useState<Size>();

  const handleDelete = () => {
    sizeService.DELETE(sizeDelete.itemId, session?.user.accessToken);
    onClose();
    toast.success("Tamanho excluído com sucesso");
  };

  useEffect(() => {
    useSizeRegisterModal.setState({ isRegister: false });
    useSizeUpdateModal.setState({ isUpdate: false });
    useSizeDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-primary-blue font-bold text-xl">
            Excluir tamanho
          </h1>
        </>
      }
      body={
        <>
          <div className="flex flex-col justify-center items-center">
            <MdDelete size={100} color="red" />
            <div className="my-4 text-lg">
              <p>Deseja mesmo excluir esse tamanho?</p>
            </div>
            <div className="flex flex-row items-center my-6">
              <Button
                size={"lg"}
                onClick={() => {
                  handleDelete();
                  useSizeDeleteModal.setState({ isDelete: true });
                }}
                className="bg-red-600 hover:bg-red-700 mr-5 w-full"
              >
                Excluir
              </Button>
              <Button
                onClick={() => sizeDelete.onClose()}
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
