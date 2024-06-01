import { create } from "zustand";

interface SizeRegisterModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isRegister: boolean;
}

const useSizeRegisterModal = create<SizeRegisterModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  isRegister: false,
}));

export default useSizeRegisterModal;
