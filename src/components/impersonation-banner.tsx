"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MdManageAccounts, MdLogout } from "react-icons/md";

export default function ImpersonationBanner() {
  const router = useRouter();
  const [storeName, setStoreName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = localStorage.getItem("impersonating");
    if (flag === "true") {
      setStoreName(localStorage.getItem("impersonatedStoreName") ?? "Loja");
    }
  }, []);

  if (!storeName) return null;

  const handleReturn = async () => {
    setLoading(true);
    try {
      const masterToken = localStorage.getItem("masterToken");
      const masterUser = localStorage.getItem("masterUser");

      localStorage.removeItem("impersonating");
      localStorage.removeItem("impersonatedStoreName");
      localStorage.removeItem("masterToken");
      localStorage.removeItem("masterUser");

      setStoreName(null);

      await signIn("credentials", {
        redirect: false,
        impersonateToken: masterToken,
        impersonateUser: masterUser,
      });

      router.push("/superadmin");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-blue-600 px-4 py-2.5 flex items-center justify-between gap-4 z-40">
      <div className="flex items-center gap-2 text-white min-w-0">
        <MdManageAccounts size={18} className="flex-shrink-0" />
        <p className="text-sm font-semibold truncate">
          Gerindo como: <span className="font-bold">{storeName}</span>
        </p>
      </div>
      <button
        onClick={handleReturn}
        disabled={loading}
        className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-white border border-white/40 rounded-lg px-3 py-1.5 hover:bg-white/20 transition-colors disabled:opacity-50"
      >
        <MdLogout size={14} />
        {loading ? "Voltando..." : "Voltar ao Painel Master"}
      </button>
    </div>
  );
}
