import { create } from "zustand";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useForgotPasswordModal = create<ForgotPasswordModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useForgotPasswordModal;
