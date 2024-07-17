import { create } from "zustand";

interface CouponUpdateModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isUpdate: boolean;
}

const useCouponUpdateModal = create<CouponUpdateModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isUpdate: false,
}));

export default useCouponUpdateModal;
