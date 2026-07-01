"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Modal from "../modal";
import { useSession } from "next-auth/react";
import { MdEdit, MdInventory2 } from "react-icons/md";
import { useOrderService } from "@/services/order.service";
import useOrderDetailsModal from "@/utils/hooks/order/useOrderDetailsModal";
import { Order } from "@/models/order";
import Loader from "../loader";
import { Button } from "../ui/button";
import { STATUS_CONFIG, StatusKey } from "@/utils/order-status";
import { cn } from "@/lib/utils";

interface OrderDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string | undefined) => void;
}

const FALLBACK_IMAGE =
  "https://www.pallenz.co.nz/assets/camaleon_cms/image-not-found-4a963b95bf081c3ea02923dceaeb3f8085e1a654fc54840aac61a57a60903fef.png";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const OrderDetails = ({ isOpen, onClose, onEdit }: OrderDetailsProps) => {
  const { data: session } = useSession();
  const orderService = useOrderService();
  const orderDetailsModal = useOrderDetailsModal();
  const [order, setOrder] = useState<Order>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderDetailsModal.itemId || !session?.user?.accessToken) return;
    setLoading(true);
    setOrder(undefined);
    const getOrder = async () => {
      try {
        const fetchedOrder = await orderService.GETBYID(
          orderDetailsModal.itemId,
          session?.user.accessToken
        );
        setOrder(fetchedOrder);
      } catch {
        // erro já tratado pelo interceptor da API
      } finally {
        setLoading(false);
      }
    };
    getOrder();
  }, [isOpen, orderDetailsModal.itemId, session?.user?.accessToken]);

  const cfg = order ? STATUS_CONFIG[order.status as StatusKey] : undefined;
  const orderRef = order?.id ? order.id.replace(/-/g, "").slice(0, 8).toUpperCase() : "";
  const itemsCount = order?.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      personWidth="lg:w-3/6 xl:w-[55%]"
      header={
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-primary-blue font-bold text-xl">Detalhes do pedido</h1>
          {orderRef && (
            <span className="text-xs text-gray-400 font-mono">#{orderRef}</span>
          )}
        </div>
      }
      body={
        <>
          {loading ? (
            <Loader color="text-green-primary" />
          ) : !order ? (
            <p className="text-center text-sm text-gray-400 py-10">
              Não foi possível carregar este pedido.
            </p>
          ) : (
            <div className="space-y-5">
              {/* Cliente + status */}
              <div className="flex flex-wrap items-start justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                  <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  {order.seller_code && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Representante: <span className="font-medium">{order.seller_code}</span>
                    </p>
                  )}
                  {order.created_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dateFormatter.format(new Date(order.created_at))}
                    </p>
                  )}
                </div>
                {cfg && (
                  <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap", cfg.classes)}>
                    {cfg.label}
                  </span>
                )}
              </div>

              {/* Campos personalizados */}
              {order.custom_fields && Object.keys(order.custom_fields).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Informações do cliente</p>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
                    {Object.entries(order.custom_fields).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-gray-400">{key}</p>
                        <p className="text-sm text-gray-800 font-medium break-words">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observação */}
              {order.observation && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Observação</p>
                  <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-4 whitespace-pre-wrap">
                    {order.observation}
                  </p>
                </div>
              )}

              {/* Itens do pedido */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Itens do pedido</p>
                  {itemsCount > 0 && (
                    <span className="text-xs text-gray-400">
                      {itemsCount} {itemsCount === 1 ? "item" : "itens"}
                    </span>
                  )}
                </div>

                {!order.items || order.items.length === 0 ? (
                  <div className="flex flex-col items-center text-center py-8 bg-gray-50 border border-gray-100 rounded-xl">
                    <MdInventory2 size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">
                      Nenhum item detalhado para este pedido.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-white">
                        <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                          <Image
                            src={item.product_image ?? FALLBACK_IMAGE}
                            alt={item.product_name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.size_name && <span>Tamanho: {item.size_name} · </span>}
                            {item.quantity}x {currencyFormatter.format(item.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 shrink-0">
                          {currencyFormatter.format(item.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700">Total do pedido</p>
                <p className="text-xl font-bold text-green-primary">
                  {currencyFormatter.format(order.total)}
                </p>
              </div>

              {onEdit && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    onClose();
                    onEdit(order.id);
                  }}
                >
                  <MdEdit size={18} className="mr-1.5" />
                  Editar pedido
                </Button>
              )}
            </div>
          )}
        </>
      }
    />
  );
};

export default OrderDetails;
