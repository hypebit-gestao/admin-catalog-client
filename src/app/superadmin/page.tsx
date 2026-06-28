"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ContentMain from "@/components/content-main";
import { useUserService } from "@/services/user.service";
import { useOrderService } from "@/services/order.service";
import { useProductService } from "@/services/product.service";
import { User } from "@/models/user";
import { OrderDashboardResponse } from "@/models/order-analytics";
import { Order } from "@/models/order";
import { Product } from "@/models/product";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  MdSearch,
  MdCheckCircle,
  MdCancel,
  MdOpenInNew,
  MdRefresh,
  MdShoppingBag,
  MdPerson,
  MdAttachMoney,
  MdInventory2,
  MdArrowBack,
  MdTrendingUp,
  MdPauseCircle,
  MdPlayCircle,
  MdManageAccounts,
  MdHistory,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import { useAsaasService } from "@/services/asaas.service";
import { useAuthService } from "@/services/auth.service";
import { useAuditLogService } from "@/services/audit-log.service";
import { AuditLog } from "@/models/audit-log";
import { signIn } from "next-auth/react";

const PLAN_LABELS: Record<string, string> = {
  prod_PYYUnM67J8LUuW: "Standard",
  prod_PfggkIQc7LEiu5: "Standard Promo",
  prod_Pnx2K50XSrwCDy: "Professional",
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-red-100 text-red-700 border-red-200",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDENT: "Pendente",
  SENT: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDENT: "text-amber-600 bg-amber-50",
  SENT: "text-blue-600 bg-blue-50",
  DELIVERED: "text-emerald-600 bg-emerald-50",
  CANCELLED: "text-red-600 bg-red-50",
};

const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// ─── Audit helpers ─────────────────────────────────────────────────────────────

function auditBadgeClass(action?: string): string {
  if (!action) return "bg-gray-100 text-gray-600";
  if (action.startsWith("FAILED")) return "bg-red-100 text-red-700";
  if (action.startsWith("CREATE")) return "bg-emerald-100 text-emerald-700";
  if (action.startsWith("DELETE")) return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const AuditTab = ({ logs }: { logs: AuditLog[] }) => {
  if (logs.length === 0)
    return <p className="text-center text-gray-400 py-12">Nenhum evento registrado</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">{logs.length} evento(s)</p>
      {logs.map((log) => (
        <div
          key={log.id}
          className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-start gap-3"
        >
          <span
            className={`shrink-0 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${auditBadgeClass(log.action)}`}
          >
            {log.action ?? log.method}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-gray-600 truncate">{log.route}</p>
            {log.entity_id && (
              <p className="text-[10px] text-gray-400 truncate">ID: {log.entity_id}</p>
            )}
          </div>
          <span className="shrink-0 text-[10px] text-gray-400 whitespace-nowrap">
            {relativeTime(log.created_at)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Store detail drawer ───────────────────────────────────────────────────────

interface StoreDetailProps {
  store: User;
  token: string;
  onClose: () => void;
  websiteBase: string;
  onImpersonate: (store: User) => void;
  impersonating: boolean;
}

type TabKey = "dashboard" | "products" | "orders" | "audit";

const StoreDetail = ({ store, token, onClose, websiteBase, onImpersonate, impersonating }: StoreDetailProps) => {
  const orderService = useOrderService();
  const productService = useProductService();
  const asaasService = useAsaasService();
  const auditLogService = useAuditLogService();

  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [dashboard, setDashboard] = useState<OrderDashboardResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [asaasId, setAsaasId] = useState(store.asaas_customer_id ?? "");
  const [savingAsaas, setSavingAsaas] = useState(false);
  const [searchingAsaas, setSearchingAsaas] = useState(false);

  const loadTab = useCallback(async (tab: TabKey) => {
    setLoadingTab(true);
    try {
      if (tab === "dashboard") {
        const d = await orderService.GETDASHBOARD(token, store.id);
        if (d) setDashboard(d);
      } else if (tab === "products") {
        const p = await productService.GETBYUSERID(store.id, "", token);
        if (p) setProducts(p);
      } else if (tab === "orders") {
        const o = await orderService.GETALL(token, store.id);
        if (o) setOrders(o);
      } else if (tab === "audit") {
        const a = await auditLogService.GETBYUSER(token, store.id, 100);
        if (a) setAuditLogs(a);
      }
    } catch {}
    setLoadingTab(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id, token]);

  useEffect(() => {
    loadTab("dashboard");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    loadTab(tab);
  };

  const handleSearchAsaas = async () => {
    if (!store.email) return;
    setSearchingAsaas(true);
    try {
      const result = await asaasService.findCustomerByEmail(token, store.email);
      if (result?.id) {
        setAsaasId(result.id);
        toast.success(`Cliente encontrado: ${result.name}`);
      } else {
        toast.error("Nenhum cliente encontrado com esse e-mail no Asaas");
      }
    } catch {
      toast.error("Erro ao buscar no Asaas");
    }
    setSearchingAsaas(false);
  };

  const handleSaveAsaasId = async () => {
    if (!store.id) return;
    setSavingAsaas(true);
    try {
      await asaasService.linkCustomer(token, store.id, asaasId || null);
      toast.success("ID Asaas salvo");
    } catch {
      toast.error("Erro ao salvar ID Asaas");
    }
    setSavingAsaas(false);
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Produtos" },
    { key: "orders", label: "Pedidos" },
    { key: "audit", label: "Auditoria" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <MdArrowBack size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {store.image_url && (
              <Image
                src={store.image_url}
                alt={store.name}
                width={36}
                height={36}
                className="rounded-full object-cover border border-gray-200"
              />
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 truncate">{store.name}</h2>
              <p className="text-xs text-gray-500 truncate">{store.email}</p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_BADGE[store.status] ?? "bg-gray-100 text-gray-600"}`}
          >
            {store.status === "ACTIVE" ? "Ativa" : "Inativa"}
          </span>
          <a
            href={`${websiteBase}/${store.person_link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0"
          >
            <MdOpenInNew size={14} />
            Abrir loja
          </a>
          <button
            onClick={() => onImpersonate(store)}
            disabled={impersonating}
            title="Entrar no painel como esta loja"
            className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60 shrink-0"
          >
            <MdManageAccounts size={14} />
            {impersonating ? "Entrando..." : "Gerenciar"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "text-green-700 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingTab ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : activeTab === "dashboard" ? (
            <DashboardTab
              dashboard={dashboard}
              store={store}
              asaasId={asaasId}
              savingAsaas={savingAsaas}
              searchingAsaas={searchingAsaas}
              onAsaasIdChange={setAsaasId}
              onSaveAsaasId={handleSaveAsaasId}
              onSearchAsaas={handleSearchAsaas}
            />
          ) : activeTab === "products" ? (
            <ProductsTab products={products} />
          ) : activeTab === "orders" ? (
            <OrdersTab orders={orders} />
          ) : (
            <AuditTab logs={auditLogs} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard tab ─────────────────────────────────────────────────────────────

const DashboardTab = ({
  dashboard, store, asaasId, savingAsaas, searchingAsaas, onAsaasIdChange, onSaveAsaasId, onSearchAsaas,
}: {
  dashboard: OrderDashboardResponse | null;
  store: User;
  asaasId: string;
  savingAsaas: boolean;
  searchingAsaas: boolean;
  onAsaasIdChange: (v: string) => void;
  onSaveAsaasId: () => void;
  onSearchAsaas: () => void;
}) => {
  if (!dashboard) return <p className="text-center text-gray-400 py-12">Sem dados</p>;

  const rawPhone = store.phone?.replace(/\D/g, "") ?? "";
  const waLink = rawPhone
    ? `https://wa.me/${rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`}`
    : null;

  const stats = [
    { label: "Receita Total", value: formatter.format(dashboard.totalRevenue), icon: MdAttachMoney, color: "text-emerald-600 bg-emerald-50" },
    { label: "Pedidos", value: String(dashboard.totalOrders), icon: MdShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "Pendentes", value: String(dashboard.ordersByStatus?.PENDENT ?? 0), icon: MdTrendingUp, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-3 ${s.color.split(" ")[1]}`}>
            <s.icon size={20} className={s.color.split(" ")[0]} />
            <p className={`text-lg font-bold mt-1 ${s.color.split(" ")[0]}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Store info */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Info da loja</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Link público</span>
          <a
            href={`${window?.location?.origin?.replace("3002", "3001")}/${store.person_link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium"
          >
            /{store.person_link}
          </a>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Plano</span>
          <span className="font-medium">{PLAN_LABELS[store.plan_id ?? ""] ?? store.plan_id ?? "—"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tipo de frete</span>
          <span className="font-medium">
            {store.shipping_type === "1" ? "Fixo" : store.shipping_type === "2" ? "Correios" : "A combinar"}
          </span>
        </div>
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#25D366] hover:underline mt-1"
          >
            <FaWhatsapp size={14} />
            {store.phone}
          </a>
        )}

        {/* Asaas linking */}
        <div className="pt-3 border-t border-gray-200 mt-2">
          <p className="text-xs font-semibold text-gray-500 mb-2">ID do Cliente Asaas</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={asaasId}
              onChange={(e) => onAsaasIdChange(e.target.value)}
              placeholder="cus_000000000000"
              className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
            <button
              onClick={onSearchAsaas}
              disabled={searchingAsaas}
              title={`Buscar pelo e-mail ${store.email}`}
              className="px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {searchingAsaas ? "Buscando…" : "Buscar"}
            </button>
            <button
              onClick={onSaveAsaasId}
              disabled={savingAsaas || !asaasId}
              className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {savingAsaas ? "Salvando…" : "Salvar"}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            &ldquo;Buscar&rdquo; pesquisa pelo e-mail <span className="font-medium">{store.email}</span> no Asaas e preenche o ID automaticamente.
          </p>
        </div>
      </div>

      {/* Recent orders */}
      {dashboard.recentOrders?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Pedidos recentes</h3>
          <div className="space-y-2">
            {dashboard.recentOrders.slice(0, 5).map((o, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{o.customer_name ?? "—"}</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${ORDER_STATUS_COLOR[o.status] ?? ""}`}>
                    {ORDER_STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
                <span className="font-bold text-gray-900 text-sm">{formatter.format(o.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Products tab ──────────────────────────────────────────────────────────────

const ProductsTab = ({ products }: { products: Product[] }) => {
  if (products.length === 0) return <p className="text-center text-gray-400 py-12">Nenhum produto</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">{products.length} produto(s)</p>
      {products.map((p, i) => (
        <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
          {p.images?.[0] && (
            <Image
              src={p.images[0]}
              alt={p.name}
              width={44}
              height={44}
              className="rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
            <p className="text-xs text-gray-500">{p.category?.name ?? "Sem categoria"}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-gray-900">{formatter.format(p.price)}</p>
            {!p.active && <span className="text-[10px] text-red-500 font-medium">Inativo</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Orders tab ────────────────────────────────────────────────────────────────

const OrdersTab = ({ orders }: { orders: Order[] }) => {
  if (orders.length === 0) return <p className="text-center text-gray-400 py-12">Nenhum pedido</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-3">{orders.length} pedido(s)</p>
      {orders.map((o, i) => (
        <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{o.customer_name ?? "—"}</p>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${ORDER_STATUS_COLOR[o.status] ?? ""}`}>
              {ORDER_STATUS_LABEL[o.status] ?? o.status}
            </span>
          </div>
          <span className="font-bold text-gray-900 text-sm">{formatter.format(o.total)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

const SuperAdminPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userService = useUserService();
  const authService = useAuthService();

  const auditLogService = useAuditLogService();

  const [stores, setStores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selectedStore, setSelectedStore] = useState<User | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [showGlobalFeed, setShowGlobalFeed] = useState(false);
  const [globalLogs, setGlobalLogs] = useState<AuditLog[]>([]);
  const [loadingGlobalFeed, setLoadingGlobalFeed] = useState(false);

  const websiteBase =
    typeof window !== "undefined"
      ? window.location.origin.replace(":3002", ":3001").replace("3002", "3001")
      : "";

  // Redirect non-admins
  useEffect(() => {
    if (status === "authenticated" && session?.user?.user?.user_type !== 2) {
      router.push("/home");
    }
  }, [status, session]);

  const fetchStores = useCallback(async () => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    const data = await userService.GETALL(session.user.accessToken);
    if (data) {
      // Only show regular user accounts (not admin accounts)
      setStores(data.filter((u: any) => u.user_type === 1));
    }
    setLoading(false);
  }, [session?.user?.accessToken]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleToggleGlobalFeed = async () => {
    const next = !showGlobalFeed;
    setShowGlobalFeed(next);
    if (next && globalLogs.length === 0 && session?.user?.accessToken) {
      setLoadingGlobalFeed(true);
      const logs = await auditLogService.GETALL(session.user.accessToken, undefined, 150);
      if (logs) setGlobalLogs(logs);
      setLoadingGlobalFeed(false);
    }
  };

  const refreshGlobalFeed = async () => {
    if (!session?.user?.accessToken) return;
    setLoadingGlobalFeed(true);
    const logs = await auditLogService.GETALL(session.user.accessToken, undefined, 150);
    if (logs) setGlobalLogs(logs);
    setLoadingGlobalFeed(false);
  };

  const handleToggleStatus = async (store: User) => {
    if (!session?.user?.accessToken) return;
    const newStatus = store.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingId(store.id ?? null);
    try {
      await userService.PUT(
        { id: store.id, status: newStatus } as any,
        session.user.accessToken
      );
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? { ...s, status: newStatus } : s))
      );
      if (selectedStore?.id === store.id) {
        setSelectedStore((s) => s ? { ...s, status: newStatus } : s);
      }
      toast.success(newStatus === "ACTIVE" ? "Loja ativada" : "Loja desativada");
    } catch {
      toast.error("Erro ao alterar status");
    }
    setTogglingId(null);
  };

  const handleImpersonate = async (store: User) => {
    if (!session?.user?.accessToken || !store.id) return;
    setImpersonatingId(store.id);
    try {
      const data = await authService.IMPERSONATE(session.user.accessToken, store.id);
      localStorage.setItem("impersonating", "true");
      localStorage.setItem("impersonatedStoreName", store.name ?? "Loja");
      localStorage.setItem("masterToken", session.user.accessToken);
      localStorage.setItem("masterUser", JSON.stringify(session.user.user));
      await signIn("credentials", {
        redirect: false,
        impersonateToken: data.accessToken,
        impersonateUser: JSON.stringify(data.user),
      });
      router.push("/home");
    } catch {
      toast.error("Erro ao entrar como loja");
    }
    setImpersonatingId(null);
  };

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const matchSearch =
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.person_link?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "ALL" || s.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [stores, search, filterStatus]);

  const activeCount = stores.filter((s) => s.status === "ACTIVE").length;
  const inactiveCount = stores.filter((s) => s.status === "INACTIVE").length;

  if (status === "loading" || (status === "authenticated" && session?.user?.user?.user_type !== 2)) {
    return null;
  }

  return (
    <>
      {/* Store detail drawer */}
      {selectedStore && session?.user?.accessToken && (
        <StoreDetail
          store={selectedStore}
          token={session.user.accessToken}
          onClose={() => setSelectedStore(null)}
          websiteBase={websiteBase}
          onImpersonate={handleImpersonate}
          impersonating={impersonatingId === selectedStore.id}
        />
      )}

      <ContentMain
        title="Painel Master"
        subtitle="Visão geral e controle de todas as lojas"
      >
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total de lojas", value: stores.length, color: "text-gray-900", bg: "bg-white" },
            { label: "Ativas", value: activeCount, color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Inativas", value: inactiveCount, color: "text-red-700", bg: "bg-red-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100 text-center`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou link..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-primary/30"
            />
          </div>
          <div className="flex gap-2">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === f
                    ? "bg-green-primary text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {f === "ALL" ? "Todas" : f === "ACTIVE" ? "Ativas" : "Inativas"}
              </button>
            ))}
          </div>
          <button
            onClick={fetchStores}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Recarregar lojas"
          >
            <MdRefresh size={18} className="text-gray-500" />
          </button>
          <button
            onClick={handleToggleGlobalFeed}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showGlobalFeed
                ? "bg-violet-600 text-white border-violet-600"
                : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
            }`}
            title="Feed global de auditoria"
          >
            <MdHistory size={16} />
            Auditoria
          </button>
        </div>

        {/* Global audit feed */}
        {showGlobalFeed && (
          <div className="mb-6 border border-violet-100 rounded-xl bg-violet-50/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-violet-800 flex items-center gap-2">
                <MdHistory size={16} />
                Feed Global de Auditoria
              </h3>
              <button
                onClick={refreshGlobalFeed}
                disabled={loadingGlobalFeed}
                className="p-1 rounded hover:bg-violet-100 transition-colors disabled:opacity-50"
              >
                <MdRefresh size={15} className="text-violet-600" />
              </button>
            </div>
            {loadingGlobalFeed ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              </div>
            ) : globalLogs.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">Nenhum evento registrado</p>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {globalLogs.map((log) => {
                  const storeName =
                    stores.find((s) => s.id === log.user_id)?.name ?? log.user_id?.slice(0, 8) ?? "—";
                  return (
                    <div
                      key={log.id}
                      className="bg-white border border-gray-100 rounded-lg px-3 py-2 flex items-center gap-3 text-xs"
                    >
                      <span className={`shrink-0 font-bold px-2 py-0.5 rounded-full text-[10px] ${auditBadgeClass(log.action)}`}>
                        {log.action ?? log.method}
                      </span>
                      <span className="font-medium text-gray-700 shrink-0">{storeName}</span>
                      <span className="font-mono text-gray-400 truncate flex-1">{log.route}</span>
                      <span className="shrink-0 text-gray-400 whitespace-nowrap">{relativeTime(log.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2 text-right">{globalLogs.length} eventos</p>
          </div>
        )}

        {/* Stores grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <MdPerson size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma loja encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((store) => (
              <div
                key={store.id}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all"
              >
                {/* Store header */}
                <div className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
                    {store.image_url ? (
                      <Image
                        src={store.image_url}
                        alt={store.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <MdPerson size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">{store.name}</h3>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_BADGE[store.status] ?? ""}`}
                      >
                        {store.status === "ACTIVE" ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{store.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/{store.person_link}</p>
                  </div>
                </div>

                {/* Meta row */}
                <div className="px-4 pb-3 flex items-center gap-3 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                    {PLAN_LABELS[store.plan_id ?? ""] ?? "Sem plano"}
                  </span>
                  {store.phone && (
                    <a
                      href={`https://wa.me/${store.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#25D366] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaWhatsapp size={12} />
                      {store.phone}
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-50 px-4 py-3 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStore(store)}
                    className="flex-1 py-1.5 rounded-lg bg-green-primary text-white text-xs font-semibold hover:bg-green-primary/90 transition-colors"
                  >
                    Ver detalhes
                  </button>
                  <button
                    onClick={() => handleImpersonate(store)}
                    disabled={impersonatingId === store.id}
                    title="Entrar no painel como esta loja"
                    className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-blue-600 disabled:opacity-50"
                  >
                    {impersonatingId === store.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MdManageAccounts size={16} />
                    )}
                  </button>
                  <a
                    href={`${websiteBase}/${store.person_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    title="Abrir catálogo"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MdOpenInNew size={16} className="text-gray-500" />
                  </a>
                  <button
                    onClick={() => handleToggleStatus(store)}
                    disabled={togglingId === store.id}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      store.status === "ACTIVE"
                        ? "border-red-100 hover:bg-red-50 text-red-500"
                        : "border-emerald-100 hover:bg-emerald-50 text-emerald-600"
                    }`}
                    title={store.status === "ACTIVE" ? "Desativar loja" : "Ativar loja"}
                  >
                    {togglingId === store.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : store.status === "ACTIVE" ? (
                      <MdPauseCircle size={16} />
                    ) : (
                      <MdPlayCircle size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400 text-right">
          {filtered.length} de {stores.length} lojas exibidas
        </p>
      </ContentMain>
    </>
  );
};

export default SuperAdminPage;
