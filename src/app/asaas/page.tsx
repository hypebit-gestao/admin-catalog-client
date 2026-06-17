"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ContentMain from "@/components/content-main";
import {
  useAsaasService,
  AsaasDashboard,
  AsaasSubscription,
  AsaasPayment,
  AsaasCustomer,
} from "@/services/asaas.service";
import {
  MdAttachMoney,
  MdPending,
  MdWarning,
  MdPeople,
  MdRefresh,
  MdOpenInNew,
} from "react-icons/md";
import { FaRegCheckCircle } from "react-icons/fa";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("pt-BR") : "—";

const BILLING_TYPE: Record<string, string> = {
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão",
  PIX: "Pix",
  UNDEFINED: "—",
};

const CYCLE: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUALLY: "Semestral",
  YEARLY: "Anual",
};

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE:   { label: "Ativa",     cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  INACTIVE: { label: "Inativa",   cls: "bg-gray-100 text-gray-600 border-gray-200" },
  EXPIRED:  { label: "Expirada",  cls: "bg-red-100 text-red-700 border-red-200" },
};

const PAY_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:              { label: "Pendente",    cls: "bg-amber-100 text-amber-700 border-amber-200" },
  RECEIVED:             { label: "Recebido",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  CONFIRMED:            { label: "Confirmado",  cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  OVERDUE:              { label: "Vencido",     cls: "bg-red-100 text-red-700 border-red-200" },
  REFUNDED:             { label: "Estornado",   cls: "bg-purple-100 text-purple-700 border-purple-200" },
  RECEIVED_IN_CASH:     { label: "Recebido",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  AWAITING_RISK_ANALYSIS:{ label: "Em análise", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

type TabKey = "subscriptions" | "payments" | "customers";

function StatusBadge({ map, value }: { map: Record<string, { label: string; cls: string }>; value: string }) {
  const cfg = map[value] ?? { label: value, cls: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function AsaasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const asaasService = useAsaasService();

  const [dashboard, setDashboard] = useState<AsaasDashboard | null>(null);
  const [subscriptions, setSubscriptions] = useState<AsaasSubscription[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [payments, setPayments] = useState<AsaasPayment[]>([]);
  const [payTotal, setPayTotal] = useState(0);
  const [customers, setCustomers] = useState<AsaasCustomer[]>([]);
  const [custTotal, setCustTotal] = useState(0);

  const [activeTab, setActiveTab] = useState<TabKey>("subscriptions");
  const [payStatusFilter, setPayStatusFilter] = useState<string>("");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("ACTIVE");

  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [offset, setOffset] = useState(0);

  const LIMIT = 20;
  const token = session?.user?.accessToken ?? "";

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && session?.user?.user?.user_type !== 2) {
      router.push("/home");
    }
  }, [status, session]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoadingDash(true);
    const d = await asaasService.getDashboard(token, true);
    if (d) setDashboard(d);
    setLoadingDash(false);
  }, [token]);

  const loadTab = useCallback(
    async (tab: TabKey, off = 0) => {
      if (!token) return;
      setLoadingTab(true);
      if (tab === "subscriptions") {
        const r = await asaasService.getSubscriptions(token, subStatusFilter || undefined, off, LIMIT, true);
        if (r) { setSubscriptions(r.data); setSubTotal(r.totalCount); }
      } else if (tab === "payments") {
        const r = await asaasService.getPayments(token, payStatusFilter || undefined, off, LIMIT, true);
        if (r) { setPayments(r.data); setPayTotal(r.totalCount); }
      } else {
        const r = await asaasService.getCustomers(token, off, LIMIT, true);
        if (r) { setCustomers(r.data); setCustTotal(r.totalCount); }
      }
      setLoadingTab(false);
    },
    [token, subStatusFilter, payStatusFilter],
  );

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { setOffset(0); loadTab(activeTab, 0); }, [activeTab, subStatusFilter, payStatusFilter]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setOffset(0);
  };

  const handlePage = (dir: 1 | -1) => {
    const next = offset + dir * LIMIT;
    setOffset(next);
    loadTab(activeTab, next);
  };

  const currentTotal = activeTab === "subscriptions" ? subTotal : activeTab === "payments" ? payTotal : custTotal;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "subscriptions", label: "Assinaturas" },
    { key: "payments",      label: "Cobranças" },
    { key: "customers",     label: "Clientes" },
  ];

  if (status === "loading") return null;

  return (
    <ContentMain title="Asaas — Financeiro" subtitle="Acompanhe cobranças, assinaturas e clientes do Catálogo Place">

      {/* ── Dashboard cards ─────────────────────────────────────────────────── */}
      {loadingDash ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            icon={<FaRegCheckCircle size={20} />}
            label="Recebido este mês"
            value={fmt.format(dashboard.receivedThisMonth)}
            sub={`${dashboard.receivedCount} cobranças`}
            color="emerald"
          />
          <SummaryCard
            icon={<MdPending size={22} />}
            label="Aguardando"
            value={fmt.format(dashboard.pendingValue)}
            sub={`${dashboard.pendingCount} cobranças`}
            color="amber"
          />
          <SummaryCard
            icon={<MdWarning size={22} />}
            label="Inadimplentes"
            value={fmt.format(dashboard.overdueValue)}
            sub={`${dashboard.overdueCount} cobranças`}
            color="red"
          />
          <SummaryCard
            icon={<MdPeople size={22} />}
            label="Assinaturas ativas"
            value={String(dashboard.activeSubscriptions)}
            sub="assinantes"
            color="blue"
          />
        </div>
      ) : (
        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
          Não foi possível carregar o dashboard. Verifique se a variável <code>ASAAS_API_KEY</code> está configurada no backend.
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "text-green-700 border-b-2 border-green-600 bg-green-50/40"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 bg-gray-50/50">
          {activeTab === "subscriptions" && (
            <FilterBar
              value={subStatusFilter}
              onChange={setSubStatusFilter}
              options={[
                { value: "",         label: "Todos os status" },
                { value: "ACTIVE",   label: "Ativas" },
                { value: "INACTIVE", label: "Inativas" },
                { value: "EXPIRED",  label: "Expiradas" },
              ]}
            />
          )}
          {activeTab === "payments" && (
            <FilterBar
              value={payStatusFilter}
              onChange={setPayStatusFilter}
              options={[
                { value: "",         label: "Todos os status" },
                { value: "PENDING",  label: "Pendentes" },
                { value: "RECEIVED", label: "Recebidas" },
                { value: "OVERDUE",  label: "Vencidas" },
              ]}
            />
          )}
          <button
            onClick={() => loadTab(activeTab, offset)}
            className="ml-auto p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            title="Recarregar"
          >
            <MdRefresh size={16} className="text-gray-500" />
          </button>
          <span className="text-xs text-gray-400">{currentTotal} registros</span>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          {loadingTab ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : activeTab === "subscriptions" ? (
            <SubscriptionsTable rows={subscriptions} />
          ) : activeTab === "payments" ? (
            <PaymentsTable rows={payments} />
          ) : (
            <CustomersTable rows={customers} />
          )}
        </div>

        {/* Pagination */}
        {currentTotal > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>
              {offset + 1}–{Math.min(offset + LIMIT, currentTotal)} de {currentTotal}
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => handlePage(-1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={offset + LIMIT >= currentTotal}
                onClick={() => handlePage(1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </ContentMain>
  );
}

// ─── Summary card ──────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  amber:   "bg-amber-50 text-amber-600",
  red:     "bg-red-50 text-red-600",
  blue:    "bg-blue-50 text-blue-600",
};

function SummaryCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const cls = COLOR_MAP[color] ?? "bg-gray-50 text-gray-600";
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${cls}`}>{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

// ─── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            value === o.value
              ? "bg-green-600 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Subscriptions table ───────────────────────────────────────────────────────

function SubscriptionsTable({ rows }: { rows: AsaasSubscription[] }) {
  if (!rows.length) return <EmptyState />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-4 py-3 text-left font-medium">Cliente</th>
          <th className="px-4 py-3 text-left font-medium">Ciclo</th>
          <th className="px-4 py-3 text-left font-medium">Pagamento</th>
          <th className="px-4 py-3 text-right font-medium">Valor</th>
          <th className="px-4 py-3 text-left font-medium">Próx. venc.</th>
          <th className="px-4 py-3 text-left font-medium">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((s) => (
          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-4 py-3 text-gray-800 font-medium">{s.customerName || s.customer}</td>
            <td className="px-4 py-3 text-gray-600">{CYCLE[s.cycle] ?? s.cycle}</td>
            <td className="px-4 py-3 text-gray-600">{BILLING_TYPE[s.billingType] ?? s.billingType}</td>
            <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt.format(s.value)}</td>
            <td className="px-4 py-3 text-gray-600">{fmtDate(s.nextPaymentDueDate ?? s.nextDueDate)}</td>
            <td className="px-4 py-3">
              <StatusBadge map={SUB_STATUS} value={s.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Payments table ────────────────────────────────────────────────────────────

function PaymentsTable({ rows }: { rows: AsaasPayment[] }) {
  if (!rows.length) return <EmptyState />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-4 py-3 text-left font-medium">Cliente</th>
          <th className="px-4 py-3 text-left font-medium">Descrição</th>
          <th className="px-4 py-3 text-left font-medium">Pagamento</th>
          <th className="px-4 py-3 text-right font-medium">Valor</th>
          <th className="px-4 py-3 text-left font-medium">Vencimento</th>
          <th className="px-4 py-3 text-left font-medium">Status</th>
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-4 py-3 text-gray-800 font-medium">{p.customerName || p.customer}</td>
            <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{p.description || "—"}</td>
            <td className="px-4 py-3 text-gray-600">{BILLING_TYPE[p.billingType] ?? p.billingType}</td>
            <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt.format(p.value)}</td>
            <td className="px-4 py-3 text-gray-600">{fmtDate(p.dueDate)}</td>
            <td className="px-4 py-3">
              <StatusBadge map={PAY_STATUS} value={p.status} />
            </td>
            <td className="px-4 py-3">
              {p.invoiceUrl && (
                <a
                  href={p.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                  title="Ver fatura"
                >
                  <MdOpenInNew size={16} />
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Customers table ───────────────────────────────────────────────────────────

function CustomersTable({ rows }: { rows: AsaasCustomer[] }) {
  if (!rows.length) return <EmptyState />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-4 py-3 text-left font-medium">Nome</th>
          <th className="px-4 py-3 text-left font-medium">E-mail</th>
          <th className="px-4 py-3 text-left font-medium">CPF/CNPJ</th>
          <th className="px-4 py-3 text-left font-medium">Telefone</th>
          <th className="px-4 py-3 text-left font-medium">Cadastro</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((c) => (
          <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
            <td className="px-4 py-3 text-gray-800 font-medium">{c.name}</td>
            <td className="px-4 py-3 text-gray-600">{c.email || "—"}</td>
            <td className="px-4 py-3 text-gray-600">{c.cpfCnpj || "—"}</td>
            <td className="px-4 py-3 text-gray-600">{c.mobilePhone || c.phone || "—"}</td>
            <td className="px-4 py-3 text-gray-600">{fmtDate(c.dateCreated)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center text-gray-400 text-sm">
      Nenhum registro encontrado.
    </div>
  );
}
