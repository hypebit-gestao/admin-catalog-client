import { create } from "zustand";

interface RenewalSubscriptionModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useRenewalSubscriptionModal = create<RenewalSubscriptionModalProps>(
  (set) => ({
    isOpen: false,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  })
);

export default useRenewalSubscriptionModal;
