import { create } from "zustand";

interface CategoryUpdateModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isUpdate: boolean;
}

const useCategoryUpdateModal = create<CategoryUpdateModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isUpdate: false,
}));

export default useCategoryUpdateModal;
