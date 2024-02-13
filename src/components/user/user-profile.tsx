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
import useEditUserModal from "@/utils/hooks/user/useEditUserModal";
import { FaEdit } from "react-icons/fa";

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile = ({ isOpen, onClose }: ProfileProps) => {
  const { data: session } = useSession();
  const userEditModal = useEditUserModal();
  const [copySuccess, setCopySuccess] = useState("");

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);

      toast.success("Link copiado com sucesso!");
    } catch (err) {
      setCopySuccess("Falha ao copiar!");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-primary-blue font-bold text-xl">
            Gerenciar Loja
          </h1>
        </>
      }
      body={
        <>
          <div>
            <div>
              <h1 className="font-bold text-center">URL da sua loja</h1>
              <p className="text-center">
                {`https://www.catalogoplace.com.br/${session?.user?.user?.person_link}`}
              </p>
              <div className="flex justify-center my-4">
                <Button
                  onClick={() =>
                    copyToClipboard(
                      `https://www.catalogoplace.com.br/${session?.user?.user?.person_link}`
                    )
                  }
                >
                  Copiar link
                </Button>
              </div>
            </div>
            <div>
              <h1 className="font-bold text-center">
                Gerenciamento da assinatura:
              </h1>
              <p className="text-center">
                {" "}
                https://billing.stripe.com/p/login/00gbL0cXYgxI0AU8ww
              </p>
              <div className="flex justify-center my-4">
                <Button
                  onClick={() =>
                    copyToClipboard(
                      `https://billing.stripe.com/p/login/00gbL0cXYgxI0AU8ww`
                    )
                  }
                >
                  Copiar link
                </Button>
              </div>
            </div>
            <div>
              <h1 className="font-bold text-center">Editar informações</h1>
              <div className="flex justify-center items-center mt-3">
                <span className="mr-3">Editar</span>
                <FaEdit
                  className="cursor-pointer"
                  onClick={() => {
                    useEditUserModal.setState({
                      itemId: session?.user?.user?.id,
                    });
                    userEditModal.onOpen();
                  }}
                  size={28}
                  color="black"
                />
              </div>
            </div>
          </div>
        </>
      }
    />
  );
};

export default UserProfile;
