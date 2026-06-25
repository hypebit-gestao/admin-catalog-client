"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Order as OrderModel } from "@/models/order";
import ContentMain from "@/components/content-main";
import { useOrderService } from "@/services/order.service";
import { useProductService } from "@/services/product.service";
import Loader from "@/components/loader";
import {
  MdAttachMoney,
  MdShoppingCart,
  MdCheckCircle,
  MdLocalShipping,
  MdCancel,
  MdDownload,
  MdTrendingUp,
  MdPeople,
  MdEmojiEvents,
} from "react-icons/md";
import { cn } from "@/lib/utils";
import {
  OrderStatusSummary,
  MonthlyRevenueTrend,
} from "@/models/order-analytics";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import * as XLSX from "xlsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_INFO: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string; hex: string }
> = {
  PENDENT: {
    label: "Pendentes",
    icon: MdShoppingCart,
    color: "text-amber-600",
    bg: "bg-amber-50",
    hex: "#d97706",
  },
  SENT: {
    label: "Enviados",
    icon: MdLocalShipping,
    color: "text-blue-600",
    bg: "bg-blue-50",
    hex: "#2563eb",
  },
  DELIVERED: {
    label: "Entregues",
    icon: MdCheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    hex: "#059669",
  },
  CANCELLED: {
    label: "Cancelados",
    icon: MdCancel,
    color: "text-red-600",
    bg: "bg-red-50",
    hex: "#dc2626",
  },
};

const PRESETS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "1 ano", days: 365 },
  { label: "Tudo", days: 0 },
];

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toISODate = (d: Date) => d.toISOString().split("T")[0];

const subtractDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const formatMonthLabel = (yyyymm: string) => {
  const [year, month] = yyyymm.split("-");
  return `${MONTH_LABELS[month] ?? month}/${year.slice(2)}`;
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// ─── Custom tooltip for AreaChart ─────────────────────────────────────────────

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{formatMonthLabel(label)}</p>
      <p className="text-emerald-600">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
      <p className="text-gray-500">{payload[1]?.value ?? 0} pedidos</p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const Analytics = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState(30);

  // KPIs
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [deliveredRevenue, setDeliveredRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);

  // Charts data
  const [statusStats, setStatusStats] = useState<
    Array<OrderStatusSummary & { label: string; icon: React.ElementType; color: string; bg: string; hex: string }>
  >([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueTrend[]>([]);

  // Raw orders for rep analysis
  const [allOrders, setAllOrders] = useState<OrderModel[]>([]);

  // Product data
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState(0);
  const [productsWithoutCategory, setProductsWithoutCategory] = useState(0);
  const [productsByCategory, setProductsByCategory] = useState<{ name: string; count: number }[]>([]);

  const orderService = useOrderService();
  const productService = useProductService();

  const loadData = useCallback(async (presetDays: number) => {
    if (!session?.user?.accessToken || !session?.user?.user?.id) return;
    setLoading(true);
    try {
      const userId = session.user.user.id;
      const token = session.user.accessToken;

      const startDate = presetDays > 0 ? toISODate(subtractDays(presetDays)) : undefined;
      const endDate = toISODate(new Date());

      const [orderAnalytics, productAnalytics, byCategoryData, rawOrders] = await Promise.all([
        orderService.GETANALYTICS(token, userId, startDate, endDate).catch(() => null),
        productService.GETANALYTICS(userId, token).catch(() => null),
        productService.GETBYCATEGORY(userId, token).catch(() => null),
        orderService.GETALL(token, userId).catch(() => [] as OrderModel[]),
      ]);

      // Filter raw orders by period for rep analysis
      const cutoff = presetDays > 0 ? subtractDays(presetDays) : null;
      const filteredOrders = (rawOrders ?? []).filter((o) => {
        if (!cutoff || !o.created_at) return true;
        return new Date(o.created_at) >= cutoff;
      });
      setAllOrders(filteredOrders);

      if (orderAnalytics) {
        setTotalRevenue(orderAnalytics.totalRevenue ?? 0);
        setDeliveredRevenue(orderAnalytics.deliveredRevenue ?? 0);
        setTotalOrders(orderAnalytics.totalOrders ?? 0);
        setAvgOrderValue(orderAnalytics.averageTicket ?? 0);
        setMonthlyRevenue(orderAnalytics.monthlyRevenue ?? []);

        const summary = orderAnalytics.statusSummary ?? [];
        const stats = ["PENDENT", "SENT", "DELIVERED", "CANCELLED"].map((status) => {
          const item = summary.find((s) => s.status === status);
          return {
            ...STATUS_INFO[status],
            status,
            count: item?.count ?? 0,
            revenue: item?.revenue ?? 0,
          };
        });
        setStatusStats(stats);
      } else {
        const ordersData = await orderService.GETALL(token, userId).catch(() => []);
        const orders = ordersData ?? [];
        const rev = orders.reduce((acc, o) => acc + (o.total || 0), 0);
        const delRev = orders
          .filter((o) => o.status === "DELIVERED")
          .reduce((acc, o) => acc + (o.total || 0), 0);
        setTotalRevenue(rev);
        setDeliveredRevenue(delRev);
        setTotalOrders(orders.length);
        setAvgOrderValue(orders.length > 0 ? rev / orders.length : 0);
        setMonthlyRevenue([]);

        const stats = ["PENDENT", "SENT", "DELIVERED", "CANCELLED"].map((status) => {
          const filtered = orders.filter((o) => o.status === status);
          return {
            ...STATUS_INFO[status],
            status,
            count: filtered.length,
            revenue: filtered.reduce((acc, o) => acc + (o.total || 0), 0),
          };
        });
        setStatusStats(stats);
      }

      if (productAnalytics) {
        setTotalProducts(productAnalytics.totalProducts ?? 0);
        setActiveProducts(productAnalytics.activeProducts ?? 0);
        setFeaturedProducts(productAnalytics.featuredProducts ?? 0);
        setProductsWithoutCategory(productAnalytics.productsWithoutCategory ?? 0);
      }

      if (byCategoryData?.categories) {
        setProductsByCategory(
          byCategoryData.categories.map((c) => ({ name: c.categoryName, count: c.count }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.accessToken, session?.user?.user?.id]);

  useEffect(() => {
    loadData(activePreset);
  }, [activePreset, loadData]);

  // ─── Export XLSX ────────────────────────────────────────────────────────────

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: KPIs
    const kpiData = [
      ["Métrica", "Valor"],
      ["Faturamento Total", totalRevenue],
      ["Faturado (Entregues)", deliveredRevenue],
      ["Total de Pedidos", totalOrders],
      ["Ticket Médio", avgOrderValue],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiData), "KPIs");

    // Sheet 2: Status dos pedidos
    const statusData = [
      ["Status", "Qtd. Pedidos", "Receita (R$)"],
      ...statusStats.map((s) => [s.label, s.count, s.revenue]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statusData), "Status");

    // Sheet 3: Receita mensal
    if (monthlyRevenue.length > 0) {
      const monthData = [
        ["Mês", "Receita (R$)", "Pedidos"],
        ...monthlyRevenue.map((m) => [formatMonthLabel(m.month), m.revenue, m.orders]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthData), "Tendências");
    }

    // Sheet 4: Produtos por categoria
    if (productsByCategory.length > 0) {
      const catData = [
        ["Categoria", "Qtd. Produtos"],
        ...productsByCategory.map((c) => [c.name, c.count]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(catData), "Categorias");
    }

    // Sheet 5: Representantes
    if (repStats.length > 0) {
      const repData = [
        ["Representante", "Pedidos", "Total (R$)", "Ticket Médio (R$)", "Entregues"],
        ...repStats.map((r) => [r.name, r.orders, r.total, r.avgTicket, r.delivered]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(repData), "Representantes");
    }

    // Sheet 6: Top clientes
    if (topCustomers.length > 0) {
      const custData = [
        ["Cliente", "Pedidos", "Total (R$)"],
        ...topCustomers.map((c) => [c.name, c.orders, c.total]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(custData), "Top Clientes");
    }

    const period = activePreset > 0 ? `_ultimos_${activePreset}d` : "_total";
    XLSX.writeFile(wb, `relatorio_catalogoplace${period}.xlsx`);
  };

  // ─── Funil de vendas ────────────────────────────────────────────────────────

  const funnelSteps = [
    { label: "Pedidos criados", count: totalOrders, color: "bg-blue-500" },
    {
      label: "Enviados",
      count: statusStats.find((s) => s.status === "SENT")?.count ?? 0,
      color: "bg-indigo-500",
    },
    {
      label: "Entregues",
      count: statusStats.find((s) => s.status === "DELIVERED")?.count ?? 0,
      color: "bg-emerald-500",
    },
  ];

  const pieData = statusStats
    .filter((s) => s.count > 0)
    .map((s) => ({ name: s.label, value: s.count, fill: s.hex }));

  // Rep stats derived from raw orders
  const repStats = useMemo(() => {
    const map = new Map<string, { orders: number; total: number; delivered: number }>();
    for (const o of allOrders) {
      const key = o.seller_code || "(direto)";
      const prev = map.get(key) ?? { orders: 0, total: 0, delivered: 0 };
      map.set(key, {
        orders: prev.orders + 1,
        total: prev.total + Number(o.total ?? 0),
        delivered: prev.delivered + (o.status === "DELIVERED" ? 1 : 0),
      });
    }
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d, avgTicket: d.total / d.orders }))
      .sort((a, b) => b.total - a.total);
  }, [allOrders]);

  const repChartData = repStats
    .filter((r) => r.name !== "(direto)")
    .slice(0, 10)
    .map((r) => ({ name: r.name, total: r.total, pedidos: r.orders }));

  // Top customers
  const topCustomers = useMemo(() => {
    const map = new Map<string, { orders: number; total: number }>();
    for (const o of allOrders) {
      const key = o.customer_name || "—";
      const prev = map.get(key) ?? { orders: 0, total: 0 };
      map.set(key, { orders: prev.orders + 1, total: prev.total + Number(o.total ?? 0) });
    }
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [allOrders]);

  return (
    <ContentMain
      title="Análise de Vendas"
      subtitle="Métricas, tendências e desempenho dos pedidos"
    >
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Period presets */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => setActivePreset(p.days)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                activePreset === p.days
                  ? "bg-white text-green-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-green-primary text-white hover:bg-green-secondary transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <MdDownload size={18} />
          Exportar XLSX
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader color="text-green-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Faturamento Total",
                value: formatCurrency(totalRevenue),
                icon: MdAttachMoney,
                bg: "bg-emerald-50",
                color: "text-emerald-600",
              },
              {
                label: "Faturado (Entregues)",
                value: formatCurrency(deliveredRevenue),
                icon: MdCheckCircle,
                bg: "bg-green-50",
                color: "text-green-primary",
              },
              {
                label: "Total de Pedidos",
                value: String(totalOrders),
                icon: MdShoppingCart,
                bg: "bg-blue-50",
                color: "text-blue-600",
              },
              {
                label: "Ticket Médio",
                value: formatCurrency(avgOrderValue),
                icon: MdTrendingUp,
                bg: "bg-teal-50",
                color: "text-teal-600",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2.5 rounded-lg", kpi.bg, kpi.color)}>
                    <kpi.icon size={22} />
                  </div>
                  <span className="text-sm text-muted-foreground">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Trend chart + Pie chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly revenue trend */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Tendência de Receita (últimos 6 meses)
              </h3>
              {monthlyRevenue.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  Dados insuficientes para exibir o gráfico
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2c6e49" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2c6e49" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonthLabel}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                      }
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<RevenueTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2c6e49"
                      strokeWidth={2.5}
                      fill="url(#colorRevenue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#60a5fa"
                      strokeWidth={1.5}
                      fill="transparent"
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart - status */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Distribuição por Status
              </h3>
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  Nenhum pedido no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span style={{ fontSize: 12, color: "#374151" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Status cards + Funil */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status breakdown */}
            <div className="lg:col-span-2">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Pedidos por Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {statusStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                        <stat.icon size={20} />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatCurrency(stat.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Funil de vendas */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Funil de Vendas
              </h3>
              <div className="space-y-3">
                {funnelSteps.map((step, i) => {
                  const pct =
                    funnelSteps[0].count > 0
                      ? Math.round((step.count / funnelSteps[0].count) * 100)
                      : 0;
                  return (
                    <div key={step.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{step.label}</span>
                        <span className="font-semibold text-gray-800">
                          {step.count}
                          {i > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({pct}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", step.color)}
                          style={{ width: `${pct || (i === 0 ? 100 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {totalOrders > 0 && funnelSteps[2].count > 0 && (
                  <p className="text-xs text-emerald-600 font-medium pt-2 border-t border-gray-100">
                    Taxa de conversão:{" "}
                    {Math.round((funnelSteps[2].count / totalOrders) * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Representantes Comerciais */}
          {repStats.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MdPeople className="text-green-primary" size={20} />
                Representantes Comerciais
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart por rep */}
                {repChartData.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Faturamento por Representante</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={repChartData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                        <XAxis
                          type="number"
                          tickFormatter={(v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={90}
                          tick={{ fontSize: 11, fill: "#374151" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(v: any) => [formatCurrency(v), "Total"]} />
                        <Bar dataKey="total" fill="#2c6e49" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Ranking detalhado */}
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700">Ranking de Representantes</h4>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-400 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5 text-left">#</th>
                        <th className="px-4 py-2.5 text-left">Representante</th>
                        <th className="px-4 py-2.5 text-right">Pedidos</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                        <th className="px-4 py-2.5 text-right">Ticket médio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repStats.map((rep, i) => (
                        <tr key={rep.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                          <td className="px-4 py-2.5">
                            {i === 0 && rep.name !== "(direto)" ? (
                              <MdEmojiEvents className="text-amber-400" size={16} />
                            ) : (
                              <span className="text-xs text-gray-400">{rep.name !== "(direto)" ? i + 1 : "—"}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-gray-800">
                            {rep.name === "(direto)" ? <span className="text-gray-400 italic text-xs">{rep.name}</span> : rep.name}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{rep.orders}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatCurrency(rep.total)}</td>
                          <td className="px-4 py-2.5 text-right text-gray-500">{formatCurrency(rep.avgTicket)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Top clientes */}
          {topCustomers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <MdEmojiEvents className="text-amber-400" size={18} />
                <h3 className="text-sm font-semibold text-gray-700">Top 5 Clientes (por valor)</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {topCustomers.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs text-gray-400 font-semibold text-center">{i + 1}</span>
                      <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-500">{c.orders} pedido{c.orders !== 1 ? "s" : ""}</span>
                      <span className="font-semibold text-gray-900 w-28 text-right">{formatCurrency(c.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produtos por categoria (bar chart) + Resumo do catálogo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            {productsByCategory.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Produtos por Categoria
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={productsByCategory}
                    margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [value, "Produtos"]}
                    />
                    <Bar dataKey="count" fill="#2c6e49" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Resumo catálogo */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Resumo do Catálogo
              </h3>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { label: "Total de Produtos", value: totalProducts, color: "text-green-primary" },
                  { label: "Produtos Ativos", value: activeProducts, color: "text-emerald-600" },
                  { label: "Em Destaque", value: featuredProducts, color: "text-amber-600" },
                  {
                    label: "Sem Categoria",
                    value: productsWithoutCategory,
                    color: productsWithoutCategory > 0 ? "text-red-600" : "text-gray-400",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className={cn("text-2xl font-bold mt-1", item.color)}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentMain>
  );
};

export default Analytics;
