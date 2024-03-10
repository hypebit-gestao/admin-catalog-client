"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";

import { useSession } from "next-auth/react";

import { useCategoryService } from "@/services/category.service";

import { useRouter } from "next/navigation";
import { MdDelete } from "react-icons/md";
import { Category } from "@/models/category";
import useCategoryDeleteModal from "@/utils/hooks/category/useDeleteCategoryModal";
import { Button } from "../ui/button";
import toast from "react-hot-toast";
import useUserDeleteModal from "@/utils/hooks/user/useDeleteUserModal";
import { User } from "@/models/user";
import { useUserService } from "@/services/user.service";
import { useProductService } from "@/services/product.service";
import useProductDeleteModal from "@/utils/hooks/product/useDeleteProductModal";
import useEditProductModal from "@/utils/hooks/product/useEditProductModal";
import useProductRegisterModal from "@/utils/hooks/product/useRegisterProductModal";

interface ProductDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductDelete = ({ isOpen, onClose }: ProductDeleteProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const categoryService = useCategoryService();
  const userService = useUserService();
  const productService = useProductService();
  const categoryDelete = useCategoryDeleteModal();
  const productDelete = useProductDeleteModal();
  const [user, setUser] = useState<User>();

  const handleDelete = () => {
    productService.DELETE(productDelete.itemId, session?.user.accessToken);
    onClose();
    toast.success("Produto excluído com sucesso");
  };

  useEffect(() => {
    useProductRegisterModal.setState({ isRegister: false });
    useEditProductModal.setState({ isUpdate: false });
    useProductDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-primary-blue font-bold text-xl">
            Excluir produto
          </h1>
        </>
      }
      body={
        <>
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
        </>
      }
    />
  );
};

export default ProductDelete;
