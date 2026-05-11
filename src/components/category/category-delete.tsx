"use client";

import React, { useEffect } from "react";
import Modal from "../modal";
import { useSession } from "next-auth/react";
import { MdDelete } from "react-icons/md";
import { useCategoryService } from "@/services/category.service";
import useCategoryDeleteModal from "@/utils/hooks/category/useDeleteCategoryModal";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

interface CategoryDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryDelete = ({ isOpen, onClose }: CategoryDeleteProps) => {
  const { data: session } = useSession();
  const categoryService = useCategoryService();
  const categoryDelete = useCategoryDeleteModal();

  const handleDelete = () => {
    categoryService.DELETE(categoryDelete.itemId, session?.user.accessToken);
    onClose();
    toast.success("Categoria excluída com sucesso");
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
          <div className="my-4 text-lg">
            <p>Deseja mesmo excluir essa categoria?</p>
          </div>
          <div className="flex flex-row items-center my-6">
            <Button
              size={"lg"}
              onClick={() => {
                handleDelete();
                useCategoryDeleteModal.setState({ isDelete: true });
              }}
              className="bg-red-600 hover:bg-red-700 mr-5 w-full"
            >
              Excluir
            </Button>
            <Button
              onClick={() => categoryDelete.onClose()}
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

export default CategoryDelete;
