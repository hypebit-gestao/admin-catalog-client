import { create } from "zustand";

interface CheckoutFieldsModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useCheckoutFieldsModal = create<CheckoutFieldsModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useCheckoutFieldsModal;
