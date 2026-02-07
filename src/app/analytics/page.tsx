"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
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
} from "react-icons/md";
import { cn } from "@/lib/utils";
import { OrderStatusSummary } from "@/models/order-analytics";

const STATUS_INFO: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  PENDENT: {
    label: "Pendentes",
    icon: MdShoppingCart,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  SENT: {
    label: "Enviados",
    icon: MdLocalShipping,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  DELIVERED: {
    label: "Entregues",
    icon: MdCheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  CANCELLED: {
    label: "Cancelados",
    icon: MdCancel,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

const Analytics = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [deliveredRevenue, setDeliveredRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [statusStats, setStatusStats] = useState<
    Array<OrderStatusSummary & { label: string; icon: React.ElementType; color: string; bg: string }>
  >([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState(0);
  const [productsWithoutCategory, setProductsWithoutCategory] = useState(0);

  const orderService = useOrderService();
  const productService = useProductService();

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.accessToken || !session?.user?.user?.id) return;

      setLoading(true);
      try {
        const userId = session.user.user.id;
        const token = session.user.accessToken;

        const [orderAnalytics, productAnalytics] = await Promise.all([
          orderService.GETANALYTICS(token, userId).catch(() => null),
          productService.GETANALYTICS(userId, token).catch(() => null),
        ]);

        if (orderAnalytics) {
          setTotalRevenue(orderAnalytics.totalRevenue ?? 0);
          setDeliveredRevenue(orderAnalytics.deliveredRevenue ?? 0);
          setTotalOrders(orderAnalytics.totalOrders ?? 0);
          setAvgOrderValue(orderAnalytics.averageTicket ?? 0);

          const summary = orderAnalytics.statusSummary ?? [];
          const stats = ["PENDENT", "SENT", "DELIVERED", "CANCELLED"].map(
            (status) => {
              const item = summary.find((s) => s.status === status);
              return {
                ...STATUS_INFO[status],
                status,
                count: item?.count ?? 0,
                revenue: item?.revenue ?? 0,
              };
            }
          );
          setStatusStats(stats);
        } else {
          const ordersData = await orderService.GETALL(token, userId).catch(
            () => []
          );
          const orders = ordersData ?? [];
          const rev = orders.reduce((acc, o) => acc + (o.total || 0), 0);
          const delRev = orders
            .filter((o) => o.status === "DELIVERED")
            .reduce((acc, o) => acc + (o.total || 0), 0);
          setTotalRevenue(rev);
          setDeliveredRevenue(delRev);
          setTotalOrders(orders.length);
          setAvgOrderValue(orders.length > 0 ? rev / orders.length : 0);

          const stats = ["PENDENT", "SENT", "DELIVERED", "CANCELLED"].map(
            (status) => {
              const filtered = orders.filter((o) => o.status === status);
              return {
                ...STATUS_INFO[status],
                status,
                count: filtered.length,
                revenue: filtered.reduce(
                  (acc, o) => acc + (o.total || 0),
                  0
                ),
              };
            }
          );
          setStatusStats(stats);
        }

        if (productAnalytics) {
          setTotalProducts(productAnalytics.totalProducts ?? 0);
          setActiveProducts(productAnalytics.activeProducts ?? 0);
          setFeaturedProducts(productAnalytics.featuredProducts ?? 0);
          setProductsWithoutCategory(
            productAnalytics.productsWithoutCategory ?? 0
          );
        } else {
          const productsData = await productService
            .GETBYUSERID(userId, "", token)
            .catch(() => []);
          const products = productsData ?? [];
          setTotalProducts(products.length);
          setActiveProducts(
            products.filter((p) => p.active !== false).length
          );
          setFeaturedProducts(products.filter((p) => p.featured).length);
          setProductsWithoutCategory(
            products.filter((p) => !p.category_id).length
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session?.user?.accessToken, session?.user?.user?.id]);

  const formatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <ContentMain
      title="Análise de Vendas"
      subtitle="Métricas e desempenho dos pedidos"
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader color="text-green-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <MdAttachMoney size={22} />
                </div>
                <span className="text-sm text-muted-foreground">
                  Faturamento Total
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatter.format(totalRevenue)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-green-50 text-green-primary">
                  <MdCheckCircle size={22} />
                </div>
                <span className="text-sm text-muted-foreground">
                  Faturado (Entregues)
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatter.format(deliveredRevenue)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <MdShoppingCart size={22} />
                </div>
                <span className="text-sm text-muted-foreground">
                  Total de Pedidos
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {totalOrders}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-teal-50 text-teal-600">
                  <MdAttachMoney size={22} />
                </div>
                <span className="text-sm text-muted-foreground">
                  Ticket Médio
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatter.format(avgOrderValue)}
              </p>
            </div>
          </div>

          {/* Status cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pedidos por Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusStats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-xl border border-gray-200/80 p-6 shadow-sm",
                    "bg-white"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={cn("p-2.5 rounded-lg", stat.bg, stat.color)}
                    >
                      <stat.icon size={22} />
                    </div>
                    <span className="font-medium text-gray-900">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.count}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatter.format(stat.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo do catálogo */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumo do Catálogo
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total de Produtos
                </p>
                <p className="text-xl font-bold text-green-primary mt-1">
                  {totalProducts}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Produtos Ativos
                </p>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {activeProducts}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Produtos em Destaque
                </p>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {featuredProducts}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Sem Categoria
                </p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {productsWithoutCategory}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentMain>
  );
};

export default Analytics;
