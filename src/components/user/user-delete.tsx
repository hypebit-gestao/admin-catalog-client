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

interface UserDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserDelete = ({ isOpen, onClose }: UserDeleteProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const categoryService = useCategoryService();
  const userService = useUserService();
  const categoryDelete = useCategoryDeleteModal();
  const userDelete = useUserDeleteModal();
  const [user, setUser] = useState<User>();

  const handleDelete = () => {
    userService.DELETE(userDelete.itemId, session?.user.accessToken);

    onClose();
    toast.success("Usuário excluído com sucesso");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-primary-blue font-bold text-xl">
            Excluir usuário
          </h1>
        </>
      }
      body={
        <>
          <div className="flex flex-col justify-center items-center">
            <MdDelete size={100} color="red" />
            <div className="my-4 text-lg">
              <p>Deseja mesmo excluir esse usuário?</p>
            </div>
            <div className="flex flex-row items-center my-6">
              <Button
                size={"lg"}
                onClick={() => {
                  handleDelete();
                  useUserDeleteModal.setState({ isDelete: true });
                }}
                className="bg-red-600 hover:bg-red-700 mr-5 w-full"
              >
                Excluir
              </Button>
              <Button
                onClick={() => userDelete.onClose()}
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

export default UserDelete;
