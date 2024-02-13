import { create } from "zustand";

interface ProfileModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useProfileModal = create<ProfileModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useProfileModal;
