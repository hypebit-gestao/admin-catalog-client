import { create } from "zustand";

interface OrderDeleteModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isDelete: boolean;
}

const useOrderDeleteModal = create<OrderDeleteModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isDelete: false,
}));

export default useOrderDeleteModal;
