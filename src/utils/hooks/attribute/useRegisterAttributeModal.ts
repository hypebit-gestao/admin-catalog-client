import { create } from "zustand";

interface AttributeRegisterModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isRegister: boolean;
}

const useAttributeRegisterModal = create<AttributeRegisterModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  isRegister: false,
}));

export default useAttributeRegisterModal;
