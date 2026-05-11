"use client";

import React, { useEffect } from "react";
import Modal from "../modal";
import { useSession } from "next-auth/react";
import { MdDelete } from "react-icons/md";
import { useProductService } from "@/services/product.service";
import useProductDeleteModal from "@/utils/hooks/product/useDeleteProductModal";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

interface ProductDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductDelete = ({ isOpen, onClose }: ProductDeleteProps) => {
  const { data: session } = useSession();
  const productService = useProductService();
  const productDelete = useProductDeleteModal();

  const handleDelete = () => {
    productService.DELETE(productDelete.itemId, session?.user.accessToken);
    onClose();
    toast.success("Produto excluído com sucesso");
  };

  useEffect(() => {
    useProductDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <h1 className="text-primary-blue font-bold text-xl">Excluir produto</h1>
      }
      body={
        <div className="flex flex-col justify-center items-center">
          <MdDelete size={100} color="red" />
          <div className="my-4 text-lg">
            <p>Deseja mesmo excluir esse produto?</p>
          </div>
          <div className="flex flex-row items-center my-6">
            <Button
              size={"lg"}
              onClick={() => {
                handleDelete();
                useProductDeleteModal.setState({ isDelete: true });
              }}
              className="bg-red-600 hover:bg-red-700 mr-5 w-full"
            >
              Excluir
            </Button>
            <Button
              onClick={() => productDelete.onClose()}
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

export default ProductDelete;
