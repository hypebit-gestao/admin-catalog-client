import { create } from "zustand";

interface SocialModalState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useSocialModal = create<SocialModalState>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useSocialModal;
