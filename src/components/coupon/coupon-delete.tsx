"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";
import { useSession } from "next-auth/react";
import { MdDelete } from "react-icons/md";
import { useCouponService } from "@/services/coupon.service";
import useCouponDeleteModal from "@/utils/hooks/coupon/useDeleteCouponModal";
import useCouponRegisterModal from "@/utils/hooks/coupon/useRegisterCouponModal";
import useCouponUpdateModal from "@/utils/hooks/coupon/useUpdateCouponModal";
import { Button } from "../ui/button";
import Loader from "../loader";
import toast from "react-hot-toast";

interface CouponDeleteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CouponDelete = ({ isOpen, onClose }: CouponDeleteProps) => {
  const { data: session } = useSession();
  const couponService = useCouponService();
  const couponDelete = useCouponDeleteModal();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await couponService.DELETE(couponDelete.itemId, session?.user.accessToken);
      useCouponDeleteModal.setState({ isDelete: true });
      toast.success("Cupom excluído com sucesso");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir cupom");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    useCouponRegisterModal.setState({ isRegister: false });
    useCouponUpdateModal.setState({ isUpdate: false });
    useCouponDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <h1 className="text-primary-blue font-bold text-xl">Excluir cupom</h1>
      }
      body={
        <div className="flex flex-col justify-center items-center">
          <MdDelete size={100} color="red" />
          <div className="my-4 text-lg text-center">
            <p>Deseja mesmo excluir esse cupom?</p>
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
              onClick={() => couponDelete.onClose()}
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

export default CouponDelete;
