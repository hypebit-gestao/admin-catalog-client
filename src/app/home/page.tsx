"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useState } from "react";
import ContentMain from "@/components/content-main";
import { useCategoryService } from "@/services/category.service";
import { useProductService } from "@/services/product.service";
import { useOrderService } from "@/services/order.service";
import Loader from "@/components/loader";
import { useRouter } from "next/navigation";
import {
  MdOutlineProductionQuantityLimits,
  MdCategory,
  MdRequestPage,
  MdAttachMoney,
  MdTrendingUp,
  MdWarning,
  MdChevronRight,
} from "react-icons/md";
import { HiArrowRight } from "react-icons/hi";
import { FaCircleCheck } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RecentOrderItem } from "@/models/order-analytics";
import { Order } from "@/models/order";

type Period = "today" | "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  year: "Este ano",
  all: "Todos",
};

function filterByPeriod(orders: Order[], period: Period): Order[] {
  if (period === "all") return orders;
  const now = new Date();
  const start = new Date();
  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return orders.filter((o) => o.created_at && new Date(o.created_at) >= start);
}

const STATUS_LABELS: Record<string, string> = {
  PENDENT: "Pendente",
  SENT: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDENT: "bg-amber-500",
  SENT: "bg-blue-500",
  DELIVERED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
};

const Home = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [countProducts, setCountProducts] = useState(0);
  const [countCategories, setCountCategories] = useState(0);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<Period>("all");
  const [productsByCategory, setProductsByCategory] = useState<
    Record<string, number>
  >({});
  const [productsWithoutCategory, setProductsWithoutCategory] = useState(0);

  const categoryService = useCategoryService();
  const productService = useProductService();
  const orderService = useOrderService();

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.accessToken || !session?.user?.user?.id) return;

      setLoading(true);
      try {
        const userId = session.user.user.id;
        const token = session.user.accessToken;

        const [
          productsCount,
          categoriesCount,
          categoriesData,
          ordersData,
          productByCategoryData,
        ] = await Promise.all([
          productService.COUNTPRODUCTS(userId, token),
          categoryService.COUNTCATEGORIES(token).catch(() => null),
          categoryService.GETALL(token).catch(() => []),
          orderService.GETALL(token, userId).catch(() => []),
          productService.GETBYCATEGORY(userId, token).catch(() => null),
        ]);

        setCountProducts(productsCount ?? 0);
        setCountCategories(categoriesCount ?? categoriesData?.length ?? 0);
        setAllOrders(ordersData ?? []);

        if (productByCategoryData?.categories) {
          const byCat: Record<string, number> = {};
          let withoutCat = 0;
          productByCategoryData.categories.forEach((c) => {
            byCat[c.categoryName] = c.count;
            if (c.categoryName === "Sem categoria") withoutCat = c.count;
          });
          setProductsByCategory(byCat);
          setProductsWithoutCategory(withoutCat);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session?.user?.accessToken, session?.user?.user?.id]);

  const filteredOrders = useMemo(() => filterByPeriod(allOrders, period), [allOrders, period]);

  const totalRevenue = useMemo(
    () => filteredOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0),
    [filteredOrders]
  );
  const countOrders = filteredOrders.length;
  const statusCounts = useMemo(
    () =>
      filteredOrders.reduce((acc, o) => {
        const s = o.status || "PENDENT";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    [filteredOrders]
  );
  const pendingOrders = (statusCounts.PENDENT ?? 0) + (statusCounts.SENT ?? 0);
  const recentOrders = filteredOrders.slice(0, 5) as RecentOrderItem[];

  const totalForStatus = Object.values(statusCounts).reduce(
    (a, b) => a + b,
    0
  );

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const statsCards = [
    {
      title: "Produtos",
      count: countProducts,
      icon: MdOutlineProductionQuantityLimits,
      href: "/product",
      color: "from-emerald-600 to-green-700",
      bgLight: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Categorias",
      count: countCategories,
      icon: MdCategory,
      href: "/category",
      color: "from-teal-600 to-cyan-700",
      bgLight: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      title: "Pedidos",
      count: countOrders,
      icon: MdRequestPage,
      href: "/order",
      color: "from-green-primary to-green-secondary",
      bgLight: "bg-green-50",
      iconColor: "text-green-primary",
    },
  ];

  const storeUser = session?.user?.user;
  const shippingConfigured = !!storeUser?.shipping_type;
  const storePersonalized = !!(storeUser?.image_url || storeUser?.background_color || storeUser?.theme);

  const onboardingSteps = [
    {
      label: "Crie sua primeira categoria",
      done: countCategories > 0,
      href: "/category",
      action: "Criar categoria",
    },
    {
      label: "Adicione seu primeiro produto",
      done: countProducts > 0,
      href: "/product/new",
      action: "Adicionar produto",
    },
    {
      label: "Configure o frete",
      done: shippingConfigured,
      href: "/configurations",
      action: "Configurar",
    },
    {
      label: "Personalize sua loja",
      done: storePersonalized,
      href: "/configurations",
      action: "Personalizar",
    },
  ];

  const onboardingComplete =
    countCategories > 0 && countProducts > 0 && shippingConfigured && storePersonalized;

  return (
    <ContentMain
      title="Dashboard"
      subtitle="Visão geral do seu catálogo e pedidos"
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader color="text-green-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Onboarding checklist — exibe apenas quando loja está vazia */}
          {!onboardingComplete && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-primary/20 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Primeiros passos</h2>
                <p className="text-sm text-gray-500 mt-0.5">Complete as etapas abaixo para deixar sua loja pronta.</p>
              </div>
              <div className="space-y-3">
                {onboardingSteps.map((step, i) => (
                  <div key={i} className={cn("flex items-center gap-3 bg-white rounded-lg px-4 py-3 border", step.done ? "border-emerald-200" : "border-gray-200")}>
                    <FaCircleCheck size={18} className={step.done ? "text-emerald-500 flex-shrink-0" : "text-gray-300 flex-shrink-0"} />
                    <span className={cn("flex-1 text-sm font-medium", step.done ? "text-gray-400 line-through" : "text-gray-700")}>
                      {step.label}
                    </span>
                    {!step.done && (
                      <button
                        onClick={() => router.push(step.href)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-green-primary hover:text-green-secondary transition-colors flex-shrink-0"
                      >
                        {step.action}
                        <MdChevronRight size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {statsCards.map((card) => (
              <button
                key={card.href}
                onClick={() => router.push(card.href)}
                className={cn(
                  "group relative overflow-hidden rounded-xl p-6 text-left",
                  "bg-white border border-gray-200/80",
                  "shadow-sm hover:shadow-lg hover:shadow-green-primary/5",
                  "transition-all duration-300 hover:-translate-y-0.5",
                  "focus:outline-none focus:ring-2 focus:ring-green-primary/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "inline-flex p-3 rounded-lg mb-4",
                        card.bgLight,
                        card.iconColor
                      )}
                    >
                      <card.icon size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {card.title}
                    </h3>
                    <p className="text-2xl font-bold text-green-primary">
                      {card.count}
                    </p>
                  </div>
                  <div className="flex items-center text-green-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Acessar
                    <HiArrowRight className="ml-1" size={18} />
                  </div>
                </div>
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity",
                    card.color
                  )}
                />
              </button>
            ))}
          </div>

          {/* Period filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 font-medium mr-1">Período:</span>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border transition-colors",
                  period === p
                    ? "bg-green-primary text-white border-green-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-primary/40"
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Revenue + Order status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faturamento */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <MdAttachMoney size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Faturamento Total
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Soma de todos os pedidos
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-primary">
                {formatter.format(totalRevenue)}
              </p>
              {pendingOrders > 0 && (
                <p className="mt-2 text-sm text-amber-600">
                  {pendingOrders} pedido(s) pendente(s) de processamento
                </p>
              )}
            </div>

            {/* Status dos pedidos */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <MdTrendingUp size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Status dos Pedidos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Distribuição por status
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const pct =
                    totalForStatus > 0 ? (count / totalForStatus) * 100 : 0;
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {STATUS_LABELS[status] || status}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            STATUS_COLORS[status] || "bg-gray-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {totalForStatus === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum pedido registrado
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Últimos pedidos + Produtos por categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimos pedidos */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">
                  Últimos Pedidos
                </h3>
                <button
                  onClick={() => router.push("/order")}
                  className="text-sm text-green-primary hover:text-green-secondary font-medium"
                >
                  Ver todos
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum pedido
                  </div>
                ) : (
                  recentOrders.map((order, idx) => (
                    <button
                      key={order.id || `order-${idx}`}
                      onClick={() => router.push("/order")}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {order.customer_name || "Cliente"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatter.format(order.total || 0)}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs",
                          order.status === "DELIVERED" &&
                            "bg-emerald-100 text-emerald-800",
                          order.status === "PENDENT" &&
                            "bg-amber-100 text-amber-800",
                          order.status === "SENT" &&
                            "bg-blue-100 text-blue-800",
                          order.status === "CANCELLED" &&
                            "bg-red-100 text-red-800"
                        )}
                      >
                        {STATUS_LABELS[order.status || "PENDENT"] ||
                          order.status}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Produtos por categoria */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">
                  Produtos por Categoria
                </h3>
                <button
                  onClick={() => router.push("/product")}
                  className="text-sm text-green-primary hover:text-green-secondary font-medium"
                >
                  Ver todos
                </button>
              </div>
              <div className="p-4 space-y-4">
                {Object.entries(productsByCategory).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-gray-700">{cat}</span>
                    <span className="font-semibold text-green-primary">
                      {count}
                    </span>
                  </div>
                ))}
                {Object.keys(productsByCategory).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum produto cadastrado
                  </p>
                )}
                {productsWithoutCategory > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-amber-700">
                    <MdWarning size={18} />
                    <span className="text-sm font-medium">
                      {productsWithoutCategory} produto(s) sem categoria
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentMain>
  );
};

export default Home;
