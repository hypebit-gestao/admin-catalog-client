"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";

import { useSession } from "next-auth/react";

import { useOrderService } from "../../services/order.service";

import { useRouter } from "next/navigation";
import { MdDelete } from "react-icons/md";
import { Order } from "../../models/order";
import useOrderDeleteModal from "../../utils/hooks/order/useDeleteOrderModal";

import { Button } from "../ui/button";
import toast from "react-hot-toast";

interface OrderDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderDelete = ({ isOpen, onClose }: OrderDeleteProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const orderService = useOrderService();
  const orderDelete = useOrderDeleteModal();

  const handleDelete = () => {
    orderService.DELETE(orderDelete.itemId, session?.user?.accessToken);
    onClose();
    toast.success("Pedido excluído com sucesso");
  };

  useEffect(() => {
    useOrderDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-primary-blue font-bold text-xl">
            Excluir pedido
          </h1>
        </>
      }
      body={
        <>
          <div className="flex flex-col justify-center items-center">
            <MdDelete size={100} color="red" />
            <div className="my-4 text-lg">
              <p>Deseja mesmo excluir esse pedido?</p>
            </div>
            <div className="flex flex-row items-center my-6">
              <Button
                size={"lg"}
                onClick={() => {
                  useOrderDeleteModal.setState({ isDelete: true });
                  handleDelete();
                }}
                className="bg-red-600 hover:bg-red-700 mr-5 w-full"
              >
                Excluir
              </Button>
              <Button
                onClick={() => orderDelete.onClose()}
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

export default OrderDelete;
