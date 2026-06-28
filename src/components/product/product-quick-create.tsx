"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Loader from "@/components/loader";
import { useProductService } from "@/services/product.service";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const schema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    category_id: z.string().optional(),
    type: z.enum(["product", "service"]),
    price: z.string(),
    price_on_request: z.boolean(),
    active: z.boolean(),
  })
  .refine((d) => d.price_on_request || d.price.length > 0, {
    message: "Informe o preço ou marque 'Preço a consultar'",
    path: ["price"],
  });

const ProductQuickCreate = ({ isOpen, onClose, onCreated }: Props) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const productService = useProductService();
  const categoryService = useCategoryService();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category_id: "",
      type: "product",
      price: "",
      price_on_request: false,
      active: true,
    },
  });

  const priceOnRequest = form.watch("price_on_request");

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    categoryService.GETALL(session.user.accessToken).then((res) => {
      if (res) setCategories(res);
    });
  }, [session?.user?.accessToken]);

  useEffect(() => {
    if (isOpen) form.reset();
  }, [isOpen]);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (loading) return;
    setLoading(true);
    try {
      await productService.POST(
        {
          name: data.name,
          category_id: data.category_id || null,
          images: null,
          currency: "brl",
          price: data.price_on_request ? 0 : Number(data.price),
          promotion_price: 0,
          user_id: session?.user?.user?.id,
          featured: false,
          active: data.active,
          description: "",
          archived: false,
          installment_available: false,
          installment_with_interest: false,
          installment_interest_value: null,
          max_installments: 1,
          unit: null,
          variation_label: null,
          type: data.type,
          price_on_request: data.price_on_request,
          videos: null,
          discount_enabled: false,
          max_discount_type: "percentage",
          max_discount_value: null,
          stock_enabled: false,
          stock_quantity: null,
          out_of_stock_behavior: "show_unavailable",
        },
        session?.user?.accessToken
      );
      toast.success("Produto criado! Edite para adicionar fotos e variações.");
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <div>
          <h1 className="text-green-primary font-bold text-xl">Cadastro Rápido</h1>
          <p className="text-xs text-gray-400 mt-0.5">Campos essenciais. Complete as fotos e variações depois.</p>
        </div>
      }
      body={
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4 mt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do produto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bolo de Cenoura 500g" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[300]">
                        <SelectItem value="product">Produto</SelectItem>
                        <SelectItem value="service">Serviço</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue="">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sem categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[300]">
                        <SelectItem value="">Sem categoria</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id as string}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="price_on_request"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        className="w-4 h-4"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm">Preço a consultar</span>
                    </label>
                  </FormControl>
                </FormItem>
              )}
            />

            {!priceOnRequest && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        className="w-4 h-4"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm">Produto ativo (visível no catálogo)</span>
                    </label>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-primary hover:bg-green-primary/90"
              >
                {loading ? <Loader /> : "Criar produto"}
              </Button>
            </div>
          </form>
        </Form>
      }
    />
  );
};

export default ProductQuickCreate;
