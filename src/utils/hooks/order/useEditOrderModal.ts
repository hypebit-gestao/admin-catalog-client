import { create } from "zustand";

interface OrderEditModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isUpdate: boolean;
}

const useEditOrderModal = create<OrderEditModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isUpdate: false,
}));

export default useEditOrderModal;
