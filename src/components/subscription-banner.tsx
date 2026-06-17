"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useAsaasService } from "@/services/asaas.service";
import { MdWarning, MdOpenInNew } from "react-icons/md";
import toast from "react-hot-toast";

const WARN_STATUSES = ["INACTIVE", "OVERDUE", "EXPIRED"];

const MESSAGES: Record<string, string> = {
  INACTIVE: "Sua assinatura está inativa. Regularize para manter o acesso à sua loja.",
  OVERDUE: "Seu pagamento está em atraso. Pague agora para evitar a suspensão da conta.",
  EXPIRED: "Sua assinatura expirou. Renove para continuar usando o Catálogo Place.",
};

export default function SubscriptionBanner() {
  const { data: session, status } = useSession();
  const asaasService = useAsaasService();
  const [warnStatus, setWarnStatus] = useState<string | null>(null);
  const [loadingRenewal, setLoadingRenewal] = useState(false);

  useEffect(() => {
    const userId = session?.user?.user?.id;
    const token = session?.user?.accessToken;
    if (!userId || !token || status !== "authenticated") return;

    asaasService
      .getUserSubscription(userId, token)
      .then((sub) => {
        if (sub?.status && WARN_STATUSES.includes(sub.status)) {
          setWarnStatus(sub.status);
        }
      })
      .catch(() => null);
  }, [session?.user?.user?.id, session?.user?.accessToken, status]);

  const handleRenewal = async () => {
    const email = session?.user?.user?.email;
    if (!email) return;
    setLoadingRenewal(true);
    try {
      const result = await asaasService.getRenewalUrl(email);
      if (result?.invoiceUrl) {
        window.open(result.invoiceUrl, "_blank");
      }
    } catch {
      toast.error("Não foi possível obter o link de pagamento.");
    } finally {
      setLoadingRenewal(false);
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
        onClick={handleRenewal}
        disabled={loadingRenewal}
        className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 hover:text-amber-900 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors disabled:opacity-50"
      >
        {loadingRenewal ? "Aguarde..." : "Regularizar"}
        <MdOpenInNew size={14} />
      </button>
    </div>
  );
}
