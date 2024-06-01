import { create } from "zustand";

interface SizeUpdateModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isUpdate: boolean;
}

const useSizeUpdateModal = create<SizeUpdateModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isUpdate: false,
}));

export default useSizeUpdateModal;
