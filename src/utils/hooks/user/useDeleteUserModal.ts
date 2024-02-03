import { create } from "zustand";

interface UserDeleteModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
}

const useUserDeleteModal = create<UserDeleteModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
}));

export default useUserDeleteModal;
