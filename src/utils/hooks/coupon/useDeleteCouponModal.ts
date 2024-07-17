import { create } from "zustand";

interface CouponDeleteModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isDelete: boolean;
}

const useCouponDeleteModal = create<CouponDeleteModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isDelete: false,
}));

export default useCouponDeleteModal;
