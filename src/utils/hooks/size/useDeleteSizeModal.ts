import { create } from "zustand";

interface SizeDeleteModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isDelete: boolean;
}

const useSizeDeleteModal = create<SizeDeleteModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isDelete: false,
}));

export default useSizeDeleteModal;
