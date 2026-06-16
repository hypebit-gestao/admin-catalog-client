import { create } from "zustand";

interface InstallmentsModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useInstallmentsModal = create<InstallmentsModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useInstallmentsModal;
