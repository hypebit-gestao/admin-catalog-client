import { create } from "zustand";

interface GoogleAnalyticsModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useGoogleAnalyticsModal = create<GoogleAnalyticsModalProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useGoogleAnalyticsModal;
