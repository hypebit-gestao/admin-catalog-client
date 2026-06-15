"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";
import { useSession } from "next-auth/react";
import { MdDelete } from "react-icons/md";
import { useCategoryService } from "@/services/category.service";
import useCategoryDeleteModal from "@/utils/hooks/category/useDeleteCategoryModal";
import { Button } from "../ui/button";
import Loader from "../loader";
import toast from "react-hot-toast";

interface CategoryDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryDelete = ({ isOpen, onClose }: CategoryDeleteProps) => {
  const { data: session } = useSession();
  const categoryService = useCategoryService();
  const categoryDelete = useCategoryDeleteModal();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await categoryService.DELETE(categoryDelete.itemId, session?.user.accessToken);
      useCategoryDeleteModal.setState({ isDelete: true });
      toast.success("Categoria excluída com sucesso");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir categoria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    useCategoryDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <h1 className="text-primary-blue font-bold text-xl">Excluir categoria</h1>
      }
      body={
        <div className="flex flex-col justify-center items-center">
          <MdDelete size={100} color="red" />
          <div className="my-4 text-lg text-center">
            <p>Deseja mesmo excluir essa categoria?</p>
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
              onClick={() => categoryDelete.onClose()}
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

export default CategoryDelete;
