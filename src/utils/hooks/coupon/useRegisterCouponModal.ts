import { create } from "zustand";

interface CouponRegisterModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isRegister: boolean;
}

const useCouponRegisterModal = create<CouponRegisterModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  isRegister: false,
}));

export default useCouponRegisterModal;
