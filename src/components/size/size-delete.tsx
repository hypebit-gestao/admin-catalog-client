"use client";

import React, { useEffect } from "react";
import Modal from "../modal";
import { useSession } from "next-auth/react";
import { MdDelete } from "react-icons/md";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import useSizeDeleteModal from "@/utils/hooks/size/useDeleteSizeModal";
import { useSizeService } from "@/services/size.service";

interface SizeDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const SizeDelete = ({ isOpen, onClose }: SizeDeleteProps) => {
  const { data: session } = useSession();
  const sizeService = useSizeService();
  const sizeDelete = useSizeDeleteModal();

  const handleDelete = () => {
    sizeService.DELETE(sizeDelete.itemId, session?.user.accessToken);
    onClose();
    toast.success("Tamanho excluído com sucesso");
  };

  useEffect(() => {
    useSizeDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <h1 className="text-primary-blue font-bold text-xl">Excluir tamanho</h1>
      }
      body={
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
      }
    />
  );
};

export default SizeDelete;
