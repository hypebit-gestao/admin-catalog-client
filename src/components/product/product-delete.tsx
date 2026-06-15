"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";
import { useSession } from "next-auth/react";
import { MdDelete } from "react-icons/md";
import { useProductService } from "@/services/product.service";
import useProductDeleteModal from "@/utils/hooks/product/useDeleteProductModal";
import { Button } from "../ui/button";
import Loader from "../loader";
import toast from "react-hot-toast";

interface ProductDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductDelete = ({ isOpen, onClose }: ProductDeleteProps) => {
  const { data: session } = useSession();
  const productService = useProductService();
  const productDelete = useProductDeleteModal();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await productService.DELETE(productDelete.itemId, session?.user.accessToken);
      useProductDeleteModal.setState({ isDelete: true });
      toast.success("Produto excluído com sucesso");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir produto");
    } finally {
      setLoading(false);
    }
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
          <div className="my-4 text-lg text-center">
            <p>Deseja mesmo excluir esse produto?</p>
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
              onClick={() => productDelete.onClose()}
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

export default ProductDelete;
