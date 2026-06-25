"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, InputCurrency } from "@/components/ui/input";
import { Button } from "../ui/button";

import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import { useCategoryService } from "@/services/category.service";

import { useRouter } from "next/navigation";
import { Textarea } from "../ui/textarea";
import useCategoryUpdateModal from "@/utils/hooks/category/useUpdateCategoryModal";
import { Category } from "@/models/category";
import Loader from "../loader";
import { useOrderService } from "@/services/order.service";
import { Order } from "@/models/order";
import useEditOrderModal from "@/utils/hooks/order/useEditOrderModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface CategoryUpdateProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  observation: z.string(),
  status: z.string(),
  total: z.string(),
});

const OrderEdit = ({ isOpen, onClose }: CategoryUpdateProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const categoryService = useCategoryService();
  const orderService = useOrderService();
  const orderEditModal = useEditOrderModal();
  const [category, setCategory] = useState<Category>();
  const [order, setOrder] = useState<Order>();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const { setValue } = form;

  type FormSchemaType = z.infer<typeof formSchema>;

  type FormField = keyof FormSchemaType;

  const setCustomValue = (id: FormField, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {
    setLoading(true);
    const getOrder = async () => {
      try {
        const fetchedOrder = await orderService.GETBYID(
          orderEditModal.itemId,
          session?.user.accessToken
        );
        if (fetchedOrder) {
          setOrder(fetchedOrder);
          setCustomValue("observation", fetchedOrder.observation);
          setCustomValue("status", fetchedOrder.status);
          setCustomValue("total", fetchedOrder.total);
        }
      } catch {
        // erro já tratado pelo interceptor da API
      } finally {
        setLoading(false);
      }
    };

    getOrder();
  }, [session?.user.accessToken, orderEditModal.itemId]);

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    try {
      await orderService.PUT(
        {
          ...data,
          id: order?.id,
          total: Number(data.total),
        },
        session?.user.accessToken
      );

      useEditOrderModal.setState({ isUpdate: true });
      toast.success(`Pedido atualizado com sucesso`);
      orderEditModal.onClose();
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    useEditOrderModal.setState({ isUpdate: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-primary-blue font-bold text-xl">Editar Pedido</h1>
        </>
      }
      body={
        <>
          {loading ? (
            <Loader color="text-green-primary" />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onUpdate)} className=" w-full">
                <div>
                  <h1 className="my-4 font-semibold text-green-primary">
                    Informações do pedido
                  </h1>
                  <div className="w-full mb-5">
                    <FormField
                      control={form.control}
                      name="observation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Observação
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observação do pedido"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex flex-row mb-5">
                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={order?.status}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[300]">
                                <SelectItem value="PENDENT">Novo pedido</SelectItem>
                                <SelectItem value="NEGOTIATING">Em negociação</SelectItem>
                                <SelectItem value="PAID">Pago</SelectItem>
                                <SelectItem value="SENT">Enviado</SelectItem>
                                <SelectItem value="DELIVERED">Entregue</SelectItem>
                                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex flex-row">
                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="total"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Total
                            </FormLabel>
                            <FormControl>
                              <InputCurrency
                                placeholder="0,00"
                                type="number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-12">
                  <Button size="lg" className="w-full" type="submit">
                    Atualizar
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </>
      }
    />
  );
};

export default OrderEdit;
