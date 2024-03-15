import { create } from "zustand";

interface ShippingRegisterModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isRegister: boolean;
}

const useShippingRegisterModal = create<ShippingRegisterModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  isRegister: false,
}));

export default useShippingRegisterModal;
