import { create } from "zustand";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
}

const useOrderDetailsModal = create<OrderDetailsModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
}));

export default useOrderDetailsModal;
