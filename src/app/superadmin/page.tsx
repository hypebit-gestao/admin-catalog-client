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
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import { useAsaasService } from "@/services/asaas.service";

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

// ─── Store detail drawer ───────────────────────────────────────────────────────

interface StoreDetailProps {
  store: User;
  token: string;
  onClose: () => void;
  websiteBase: string;
}

type TabKey = "dashboard" | "products" | "orders";

const StoreDetail = ({ store, token, onClose, websiteBase }: StoreDetailProps) => {
  const orderService = useOrderService();
  const productService = useProductService();
  const asaasService = useAsaasService();

  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [dashboard, setDashboard] = useState<OrderDashboardResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
      }
    } catch {}
    setLoadingTab(false);
  }, [store.id, token]);

  useEffect(() => {
    loadTab("dashboard");
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
          ) : (
            <OrdersTab orders={orders} />
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
            "Buscar" pesquisa pelo e-mail <span className="font-medium">{store.email}</span> no Asaas e preenche o ID automaticamente.
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

  const [stores, setStores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selectedStore, setSelectedStore] = useState<User | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
            title="Recarregar"
          >
            <MdRefresh size={18} className="text-gray-500" />
          </button>
        </div>

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
