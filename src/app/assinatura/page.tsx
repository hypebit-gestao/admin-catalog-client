"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ContentMain from "@/components/content-main";
import { useAsaasService } from "@/services/asaas.service";
import toast from "react-hot-toast";
import {
  MdCreditCard,
  MdPix,
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdOpenInNew,
  MdCalendarToday,
  MdAccessTime,
} from "react-icons/md";
import { TbReceipt } from "react-icons/tb";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE: {
    label: "Ativa",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: <MdCheckCircle className="text-emerald-600" size={16} />,
  },
  OVERDUE: {
    label: "Em atraso",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    icon: <MdWarning className="text-amber-500" size={16} />,
  },
  INACTIVE: {
    label: "Inativa",
    color: "text-red-700 bg-red-50 border-red-200",
    icon: <MdCancel className="text-red-500" size={16} />,
  },
};

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  PIX: { label: "PIX", icon: <MdPix size={18} /> },
  CREDIT_CARD: { label: "Cartão de Crédito", icon: <MdCreditCard size={18} /> },
  DEBIT_CARD: { label: "Cartão de Débito", icon: <MdCreditCard size={18} /> },
  BOLETO: { label: "Boleto", icon: <TbReceipt size={18} /> },
};

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  RECEIVED: { label: "Pago", cls: "text-emerald-700 bg-emerald-50" },
  CONFIRMED: { label: "Confirmado", cls: "text-emerald-700 bg-emerald-50" },
  PENDING: { label: "Pendente", cls: "text-amber-700 bg-amber-50" },
  OVERDUE: { label: "Vencido", cls: "text-red-700 bg-red-50" },
  REFUNDED: { label: "Devolvido", cls: "text-gray-600 bg-gray-100" },
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86_400_000);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssinaturaPage() {
  const { data: session } = useSession();
  const asaasService = useAsaasService();

  const [sub, setSub] = useState<{
    status: string;
    nextDueDate: string | null;
    value: number;
    subscriptionId: string;
    billingType: string;
  } | null>(null);
  const [invoices, setInvoices] = useState<
    Array<{ id: string; value: number; status: string; dueDate: string; invoiceUrl: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const userId = session?.user?.user?.id;
  const token = session?.user?.accessToken;

  useEffect(() => {
    if (!userId || !token) return;
    setLoading(true);
    Promise.all([
      asaasService.getUserSubscription(userId, token),
      asaasService.getUserInvoices(userId, token),
    ])
      .then(([subData, invoiceData]) => {
        setSub(subData ?? null);
        setInvoices(invoiceData ?? []);
      })
      .finally(() => setLoading(false));
  }, [userId, token]);

  const handleCancel = async () => {
    if (!userId || !token) return;
    setCanceling(true);
    try {
      await asaasService.cancelSubscription(userId, token);
      toast.success("Assinatura cancelada. O acesso será encerrado em breve.");
      setSub((prev) => prev ? { ...prev, status: "INACTIVE" } : prev);
      setShowCancelConfirm(false);
    } catch {
      toast.error("Não foi possível cancelar. Tente novamente ou entre em contato.");
    } finally {
      setCanceling(false);
    }
  };

  const days = daysUntil(sub?.nextDueDate ?? null);
  const statusCfg = STATUS_CONFIG[sub?.status ?? ""] ?? STATUS_CONFIG["INACTIVE"];
  const paymentCfg = PAYMENT_LABELS[sub?.billingType ?? ""] ?? { label: sub?.billingType ?? "—", icon: <MdCreditCard size={18} /> };

  return (
    <ContentMain title="Minha Assinatura">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minha Assinatura</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie seu plano e acompanhe suas cobranças.</p>
        </div>

        {/* ── Status card ────────────────────────────────────────────── */}
        {loading ? (
          <div className="rounded-2xl border bg-white p-8 animate-pulse space-y-4">
            <div className="h-6 bg-gray-100 rounded w-32" />
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        ) : !sub ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-gray-400">
            <MdCreditCard size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhuma assinatura encontrada.</p>
            <p className="text-sm mt-1">Seu usuário ainda não está vinculado a uma assinatura no Asaas.</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Plano</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">Standard</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
                {statusCfg.icon}
                {statusCfg.label}
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x">
              {/* Valor */}
              <div className="px-6 py-5 text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Valor mensal</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(sub.value)}</p>
                <p className="text-xs text-gray-400 mt-0.5">por mês</p>
              </div>

              {/* Dias */}
              <div className="px-6 py-5 text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">
                  {(days ?? 0) < 0 ? "Venceu há" : "Renova em"}
                </p>
                {days !== null ? (
                  <>
                    <p className={`text-2xl font-bold ${days < 0 ? "text-red-600" : days <= 3 ? "text-amber-600" : "text-gray-900"}`}>
                      {Math.abs(days)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{Math.abs(days) === 1 ? "dia" : "dias"}</p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-gray-400">—</p>
                )}
              </div>

              {/* Próxima cobrança */}
              <div className="px-6 py-5 text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Próxima cobrança</p>
                <p className="text-lg font-bold text-gray-900">
                  {sub.nextDueDate ? formatDate(sub.nextDueDate) : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">vencimento</p>
              </div>
            </div>

            {/* Details row */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <span className="text-gray-400">{paymentCfg.icon}</span>
                <span>Pagamento via <strong>{paymentCfg.label}</strong></span>
              </div>

              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <MdCalendarToday size={16} className="text-gray-400" />
                <span>Ciclo <strong>mensal</strong></span>
              </div>

              {sub.status === "ACTIVE" && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="text-sm text-red-500 hover:text-red-700 font-medium underline underline-offset-2 transition-colors"
                >
                  Cancelar assinatura
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Invoice history ─────────────────────────────────────────── */}
        {!loading && invoices.length > 0 && (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-2">
              <TbReceipt size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-800">Histórico de cobranças</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b bg-gray-50">
                    <th className="px-6 py-3 font-semibold">Vencimento</th>
                    <th className="px-6 py-3 font-semibold">Valor</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Fatura</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => {
                    const st = INVOICE_STATUS[inv.status] ?? { label: inv.status, cls: "text-gray-600 bg-gray-100" };
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3.5 text-gray-700 flex items-center gap-1.5">
                          <MdAccessTime size={14} className="text-gray-300" />
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-gray-900">{formatCurrency(inv.value)}</td>
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          {inv.invoiceUrl ? (
                            <a
                              href={inv.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                              Ver <MdOpenInNew size={13} />
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Cancel confirmation dialog ──────────────────────────────── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <MdWarning size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Cancelar assinatura?</h3>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Ao cancelar, seu acesso ao <strong>Catálogo Place</strong> será encerrado ao fim do período atual.
              Para reativar, será necessário assinar novamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={canceling}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Manter assinatura
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {canceling ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ContentMain>
  );
}
