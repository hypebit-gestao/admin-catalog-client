import { create } from "zustand";

interface UserDeleteModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  itemId: string;
  isDelete: boolean;
}

const useUserDeleteModal = create<UserDeleteModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  itemId: "",
  isDelete: false,
}));

export default useUserDeleteModal;
