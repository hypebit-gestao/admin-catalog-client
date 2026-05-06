import { create } from "zustand";

interface QRCodeModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useQRCodeModal = create<QRCodeModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useQRCodeModal;
