import { create } from "zustand";

interface WhatsAppFloatModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useWhatsAppFloatModal = create<WhatsAppFloatModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useWhatsAppFloatModal;
