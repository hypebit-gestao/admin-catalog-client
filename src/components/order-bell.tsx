"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MdShoppingBag, MdDoneAll } from "react-icons/md";
import { fetchWrapper } from "@/utils/functions/fetch";
import { Order } from "@/models/order";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "order_last_seen";
const POLL_MS = 30_000;
const MAX_SHOWN = 10;

const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_BADGE: Record<string, string> = {
  PENDENT:     "bg-amber-100 text-amber-800",
  NEGOTIATING: "bg-orange-100 text-orange-800",
  PAID:        "bg-blue-100 text-blue-800",
  SENT:        "bg-indigo-100 text-indigo-800",
  DELIVERED:   "bg-emerald-100 text-emerald-800",
  CANCELLED:   "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  PENDENT:     "Novo pedido",
  NEGOTIATING: "Em negociação",
  PAID:        "Pago",
  SENT:        "Enviado",
  DELIVERED:   "Entregue",
  CANCELLED:   "Cancelado",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function getLastSeen(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

function setLastSeen(iso: string) {
  localStorage.setItem(STORAGE_KEY, iso);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  token: string;
  userId: string;
}

const OrderBell = ({ token, userId }: Props) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await fetchWrapper<Order[]>(`order/user/${userId}`, {
        method: "GET",
        headers: { Authorization: token },
      });
      if (!data) return;
      const sorted = [...data].sort((a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      ).slice(0, MAX_SHOWN);
      setOrders(sorted);

      const lastSeen = getLastSeen();
      if (!lastSeen) {
        if (sorted.length > 0 && sorted[0].created_at) {
          setLastSeen(sorted[0].created_at);
        }
        setUnread(0);
      } else {
        const newPendent = sorted.filter(
          (o) => o.created_at && new Date(o.created_at) > new Date(lastSeen) && o.status === "PENDENT"
        ).length;
        setUnread(newPendent);
      }
    } catch {}
  }, [token, userId]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, POLL_MS);
    return () => clearInterval(id);
  }, [fetchOrders]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && orders.length > 0 && orders[0].created_at) {
      setLastSeen(orders[0].created_at);
      setUnread(0);
    }
  };

  const markAllRead = () => {
    if (orders.length > 0 && orders[0].created_at) {
      setLastSeen(orders[0].created_at);
      setUnread(0);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Pedidos"
      >
        <MdShoppingBag size={22} className={unread > 0 ? "text-white" : "text-white/80"} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none shadow">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-semibold text-gray-800">Pedidos recentes</span>
            {unread > 0 ? (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
              >
                <MdDoneAll size={14} />
                Marcar lidos
              </button>
            ) : (
              <span className="text-xs text-gray-400">Tudo visto</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <MdShoppingBag size={32} className="mb-2 text-gray-200" />
                <p className="text-sm">Nenhum pedido ainda</p>
                <p className="text-xs mt-1 text-gray-300">Compartilhe o link da sua loja!</p>
              </div>
            ) : (
              orders.map((order, i) => (
                <div
                  key={order.id ?? i}
                  className={`px-4 py-3 flex items-start gap-3 ${
                    i < unread ? "bg-amber-50/50" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.customer_name ?? "Cliente"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900">{formatter.format(order.total)}</p>
                    {order.created_at && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(order.created_at)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
            <button
              onClick={() => { setOpen(false); router.push("/order"); }}
              className="w-full text-center text-xs text-green-700 hover:text-green-800 font-medium"
            >
              Ver todos os pedidos →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderBell;
