import { create } from "zustand";

interface PersonalizationStoreModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const usePersonalizationStoreModal = create<PersonalizationStoreModalProps>(
  (set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  })
);

export default usePersonalizationStoreModal;
