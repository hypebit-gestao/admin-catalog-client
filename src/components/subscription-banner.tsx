"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useStripeService } from "@/services/stripe.service";
import { MdWarning, MdOpenInNew } from "react-icons/md";
import toast from "react-hot-toast";

const WARN_STATUSES = ["past_due", "unpaid", "canceled", "incomplete_expired"];

const MESSAGES: Record<string, string> = {
  past_due: "Seu pagamento está em atraso. Atualize sua forma de pagamento para evitar a suspensão da conta.",
  unpaid: "Sua fatura está em aberto. Regularize para manter o acesso.",
  canceled: "Sua assinatura foi cancelada. Renove para continuar usando o Catálogo Place.",
  incomplete_expired: "Sua assinatura expirou. Renove para continuar usando o Catálogo Place.",
};

export default function SubscriptionBanner() {
  const { data: session, status } = useSession();
  const stripeService = useStripeService();
  const [warnStatus, setWarnStatus] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    const userId = session?.user?.user?.id;
    const token = session?.user?.accessToken;
    if (!userId || !token || status !== "authenticated") return;

    stripeService
      .getSubscription(userId, token)
      .then((sub) => {
        if (sub?.status && WARN_STATUSES.includes(sub.status)) {
          setWarnStatus(sub.status);
        }
      })
      .catch(() => null);
  }, [session?.user?.user?.id, session?.user?.accessToken, status]);

  const handlePortal = async () => {
    const payerId = session?.user?.user?.payer_id;
    const token = session?.user?.accessToken;
    if (!payerId || !token) return;
    setLoadingPortal(true);
    try {
      const { url } = await stripeService.createBillingPortalSession(
        payerId,
        window.location.href,
        token,
      );
      window.location.href = url;
    } catch {
      toast.error("Não foi possível acessar o portal de assinatura.");
    } finally {
      setLoadingPortal(false);
    }
  };

  if (!warnStatus) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-amber-800 min-w-0">
        <MdWarning size={18} className="flex-shrink-0" />
        <p className="text-sm font-medium truncate">
          {MESSAGES[warnStatus] ?? "Há um problema com sua assinatura."}
        </p>
      </div>
      <button
        onClick={handlePortal}
        disabled={loadingPortal}
        className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 hover:text-amber-900 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors disabled:opacity-50"
      >
        {loadingPortal ? "Aguarde..." : "Regularizar"}
        <MdOpenInNew size={14} />
      </button>
    </div>
  );
}
