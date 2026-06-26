import { create } from "zustand";

interface DeliveryTypesModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useDeliveryTypesModal = create<DeliveryTypesModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useDeliveryTypesModal;
