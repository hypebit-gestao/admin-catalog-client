import { create } from "zustand";

interface OrderDestinationModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useOrderDestinationModal = create<OrderDestinationModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useOrderDestinationModal;
