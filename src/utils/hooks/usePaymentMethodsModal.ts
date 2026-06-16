import { create } from "zustand";

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const usePaymentMethodsModal = create<PaymentMethodsModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default usePaymentMethodsModal;
