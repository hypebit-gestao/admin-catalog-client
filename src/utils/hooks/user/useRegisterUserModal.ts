import { create } from "zustand";

interface UserRegisterModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  isRegister: boolean;
}

const useUserRegisterModal = create<UserRegisterModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  isRegister: false,
}));

export default useUserRegisterModal;
