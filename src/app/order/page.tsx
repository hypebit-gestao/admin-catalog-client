"use client";

import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ContentMain from "@/components/content-main";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-quartz.css";
import { AG_GRID_LOCALE_PT_BR } from "@/utils/locales/ag-grid";
import { RowNode } from "ag-grid-community";
import Loader from "@/components/loader";

import { MdDelete, MdEdit, MdRequestPage, MdPeople, MdContentCopy, MdCheck, MdLink } from "react-icons/md";
import { useOrderService } from "@/services/order.service";
import { Order as OrderModel } from "@/models/order";
import OrderEdit from "@/components/order/order-edit";
import useEditOrderModal from "@/utils/hooks/order/useEditOrderModal";
import OrderDelete from "@/components/order/order-delete";
import useOrderDeleteModal from "@/utils/hooks/order/useDeleteOrderModal";
import ExportToExcel from "@/utils/tools/excelExport";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDENT:   { label: "Pendente",  classes: "bg-amber-100 text-amber-800 border border-amber-200" },
  SENT:      { label: "Enviado",   classes: "bg-blue-100 text-blue-800 border border-blue-200" },
  DELIVERED: { label: "Entregue", classes: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
  CANCELLED: { label: "Cancelado", classes: "bg-red-100 text-red-800 border border-red-200" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

const STATUS_FILTERS: { key: StatusKey | "ALL"; label: string }[] = [
  { key: "ALL",       label: "Todos" },
  { key: "PENDENT",   label: "Pendente" },
  { key: "SENT",      label: "Enviado" },
  { key: "DELIVERED", label: "Entregue" },
  { key: "CANCELLED", label: "Cancelado" },
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatterStatus = (status: string) =>
  STATUS_CONFIG[status as StatusKey]?.label ?? "Pendente";

const Order = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [allOrders, setAllOrders] = useState<OrderModel[]>([]);
  const [activeFilter, setActiveFilter] = useState<StatusKey | "ALL">("ALL");
  const [activeTab, setActiveTab] = useState<"orders" | "reps">("orders");
  const [newRepName, setNewRepName] = useState("");
  const [copiedRep, setCopiedRep] = useState<string | null>(null);

  const personLink = session?.user?.user?.person_link ?? "";
  const CATALOG_BASE = "https://www.catalogoplace.com.br";

  const buildRepLink = (name: string) =>
    `${CATALOG_BASE}/${personLink}?rep=${encodeURIComponent(name.trim())}`;

  const copyLink = (name: string) => {
    navigator.clipboard.writeText(buildRepLink(name));
    setCopiedRep(name);
    setTimeout(() => setCopiedRep(null), 2000);
  };
  const gridRef = useRef<AgGridReact>(null);

  const orderService = useOrderService();
  const orderEditModal = useEditOrderModal();
  const orderDeleteModal = useOrderDeleteModal();

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    const getOrders = async () => {
      try {
        const fetched = await orderService.GETALL(
          session.user.accessToken,
          session.user?.user?.id
        );
        setAllOrders((fetched as OrderModel[]) ?? []);
      } finally {
        setLoading(false);
      }
    };
    getOrders();
  }, [
    session?.user?.accessToken,
    orderEditModal.isUpdate,
    orderDeleteModal.isDelete,
  ]);

  const rowData = useMemo(
    () =>
      activeFilter === "ALL"
        ? allOrders
        : allOrders.filter((o) => o.status === activeFilter),
    [allOrders, activeFilter]
  );

  const statusCounts = useMemo(
    () =>
      allOrders.reduce(
        (acc, o) => {
          const s = (o.status as StatusKey) || "PENDENT";
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        },
        {} as Record<StatusKey, number>
      ),
    [allOrders]
  );

  const handleDelete = useCallback((id: string | undefined) => {
    useOrderDeleteModal.setState({ itemId: id });
    orderDeleteModal.onOpen();
  }, [orderDeleteModal]);

  const handleEdit = useCallback((id: string | undefined) => {
    orderEditModal.onOpen();
    useEditOrderModal.setState({ itemId: id });
  }, [orderEditModal]);

  const ActionsRenderer = useCallback((props: any) => (
    <div className="flex flex-row justify-center items-center h-full gap-2">
      <button
        className="text-blue-500 hover:text-blue-600 transition-colors"
        onClick={() => handleEdit(props.data.id)}
        title="Editar pedido"
      >
        <MdEdit size={26} />
      </button>
      <button
        className="text-red-500 hover:text-red-600 transition-colors"
        onClick={() => handleDelete(props.data.id)}
        title="Excluir pedido"
      >
        <MdDelete size={26} />
      </button>
    </div>
  ), [handleEdit, handleDelete]);

  const StatusRenderer = useCallback((props: any) => {
    const cfg = STATUS_CONFIG[props.value as StatusKey];
    if (!cfg) return <span>{props.value}</span>;
    return (
      <div className="flex items-center h-full">
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", cfg.classes)}>
          {cfg.label}
        </span>
      </div>
    );
  }, []);

  const getRowStyle = (params: { node: RowNode }) => {
    if (params.node?.rowIndex !== null && params.node?.rowIndex !== undefined) {
      return params.node.rowIndex % 2 === 0
        ? { background: "#F8FAFC", color: "#000000" }
        : { background: "#FFFFFF", color: "#000000" };
    }
    return {};
  };

  const colDefs = useMemo(() => [
    {
      field: "customer_name",
      flex: 2,
      headerName: "Cliente",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "total",
      flex: 1,
      headerName: "Total",
      valueFormatter: (params: any) =>
        params.value != null ? currencyFormatter.format(params.value) : "—",
    },
    {
      field: "status",
      flex: 1,
      headerName: "Status",
      cellRenderer: StatusRenderer,
    },
    {
      field: "seller_code",
      flex: 1,
      headerName: "Representante",
      valueFormatter: (params: any) => params.value || "—",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "observation",
      flex: 2,
      headerName: "Observação",
      valueFormatter: (params: any) => params.value || "—",
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: ActionsRenderer,
    },
  ], [ActionsRenderer, StatusRenderer]);

  // Métricas por representante
  const repStats = useMemo(() => {
    const map = new Map<string, { orders: number; total: number }>();
    for (const o of allOrders) {
      const key = o.seller_code || "(direto)";
      const prev = map.get(key) ?? { orders: 0, total: 0 };
      map.set(key, { orders: prev.orders + 1, total: prev.total + Number(o.total ?? 0) });
    }
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [allOrders]);

  return (
    <>
      <OrderEdit isOpen={orderEditModal.isOpen} onClose={orderEditModal.onClose} />
      <OrderDelete isOpen={orderDeleteModal.isOpen} onClose={orderDeleteModal.onClose} />

      <ContentMain title="Pedidos" subtitle="Gerencie e acompanhe todos os pedidos da sua loja">
        {/* Abas */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "orders"
                ? "border-green-primary text-green-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            Pedidos
          </button>
          <button
            onClick={() => setActiveTab("reps")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === "reps"
                ? "border-green-primary text-green-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            <MdPeople size={16} />
            Representantes
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader color="text-green-primary" />
          </div>
        ) : activeTab === "reps" ? (
          <div className="space-y-6">

            {/* Gerador de link */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                <MdLink size={16} className="text-green-primary" />
                Gerar link de representante
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Compartilhe o link com o representante. Ao abrir o catálogo, todos os pedidos ficam vinculados a ele.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do representante (ex: João Silva)"
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newRepName.trim() && copyLink(newRepName)}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-primary transition-colors"
                />
                <button
                  disabled={!newRepName.trim()}
                  onClick={() => copyLink(newRepName)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-primary text-white text-sm font-medium rounded-lg hover:bg-green-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {copiedRep === newRepName ? <MdCheck size={16} /> : <MdContentCopy size={16} />}
                  {copiedRep === newRepName ? "Copiado!" : "Copiar link"}
                </button>
              </div>
              {newRepName.trim() && (
                <p className="mt-2 text-xs text-gray-400 font-mono truncate">
                  {buildRepLink(newRepName)}
                </p>
              )}
            </div>

            {/* Métricas */}
            {repStats.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">Nenhum pedido vinculado a representantes ainda.</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">Representante</th>
                      <th className="px-4 py-3 text-right">Pedidos</th>
                      <th className="px-4 py-3 text-right">Total vendido</th>
                      <th className="px-4 py-3 text-right">Ticket médio</th>
                      <th className="px-4 py-3 text-right">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repStats.map((rep, i) => (
                      <tr key={rep.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {rep.name === "(direto)" ? (
                            <span className="text-gray-400 italic">{rep.name}</span>
                          ) : rep.name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">{rep.orders}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {currencyFormatter.format(rep.total)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {currencyFormatter.format(rep.total / rep.orders)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {rep.name !== "(direto)" && (
                            <button
                              onClick={() => copyLink(rep.name)}
                              title="Copiar link do representante"
                              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-green-primary transition-colors"
                            >
                              {copiedRep === rep.name ? <MdCheck size={14} className="text-green-primary" /> : <MdContentCopy size={14} />}
                              {copiedRep === rep.name ? "Copiado" : "Copiar"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick filter buttons */}
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => {
                const count = f.key === "ALL" ? allOrders.length : (statusCounts[f.key as StatusKey] ?? 0);
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border",
                      activeFilter === f.key
                        ? "bg-green-primary text-white border-green-primary shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-green-primary/40 hover:text-green-primary"
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center",
                        activeFilter === f.key
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            {rowData.length === 0 && !loading ? (
              <div className="bg-white rounded-xl border border-gray-200/80 py-16 flex flex-col items-center text-center shadow-sm">
                <MdRequestPage size={48} className="text-gray-200 mb-3" />
                <p className="font-medium text-gray-500">
                  {activeFilter === "ALL" ? "Nenhum pedido ainda" : `Nenhum pedido com status "${formatterStatus(activeFilter)}"`}
                </p>
                {activeFilter !== "ALL" && (
                  <button
                    onClick={() => setActiveFilter("ALL")}
                    className="mt-3 text-sm text-green-primary hover:underline"
                  >
                    Ver todos os pedidos
                  </button>
                )}
              </div>
            ) : (
              <div className="ag-theme-quartz rounded-xl overflow-hidden border border-gray-200/80 shadow-sm">
                <AgGridReact
                  ref={gridRef}
                  rowData={rowData}
                  columnDefs={colDefs as any}
                  getRowStyle={getRowStyle as any}
                  domLayout="autoHeight"
                  pagination={true}
                  paginationPageSizeSelector={[10, 20, 50]}
                  paginationPageSize={10}
                  localeText={AG_GRID_LOCALE_PT_BR}
                  rowHeight={52}
                />
              </div>
            )}

            <ExportToExcel
              currencyColumns={[4]}
              fileName="Pedidos"
              className="bg-green-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-primary/90 transition-colors"
              label
              excelData={rowData.map((item: OrderModel) => ({
                "Nome do cliente": item.customer_name,
                "Representante": item.seller_code || "—",
                "Status do pedido": formatterStatus(item.status),
                Observação: item.observation,
                "Total do pedido": item.total,
              }))}
            />
          </div>
        )}
      </ContentMain>
    </>
  );
};

export default Order;
