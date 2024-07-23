import { create } from "zustand";

interface AttributeDeleteModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isDelete: boolean;
}

const useAttributeDeleteModal = create<AttributeDeleteModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isDelete: false,
}));

export default useAttributeDeleteModal;
