import { create } from "zustand";

interface AttributeUpdateModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isUpdate: boolean;
}

const useAttributeUpdateModal = create<AttributeUpdateModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isUpdate: false,
}));

export default useAttributeUpdateModal;
