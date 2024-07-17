"use client";

import React, { useEffect, useRef, useState } from "react";
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

import { useRouter } from "next/navigation";
import Loader from "../loader";
import { useSizeService } from "@/services/size.service";
import useSizeRegisterModal from "@/utils/hooks/size/useRegisterSizeModal";
import useSizeUpdateModal from "@/utils/hooks/size/useUpdateSizeModal";
import useSizeDeleteModal from "@/utils/hooks/size/useDeleteSizeModal";
import { useCouponService } from "@/services/coupon.service";
import useCouponRegisterModal from "@/utils/hooks/coupon/useRegisterCouponModal";
import useCouponUpdateModal from "@/utils/hooks/coupon/useUpdateCouponModal";
import useCouponDeleteModal from "@/utils/hooks/coupon/useDeleteCouponModal";
import { Checkbox } from "../ui/checkbox";

interface CouponRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  code: z.string().min(1, "Código do cupom é obrigatório"),
  discount: z.string().min(1, "Desconto do cupom é obrigatório"),
  stock: z.string().min(1, "Estoque do cupom é obrigatório"),
  active: z.boolean(),
  expires_at: z.string().min(1, "Data de expiração é obrigatória"),
});

const CouponRegister = ({ isOpen, onClose }: CouponRegisterProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const couponService = useCouponService()
  const couponRegisterModal = useCouponRegisterModal()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      discount: "",
      stock: "",
      active: false,
      expires_at: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);

    await couponService
      .POST(
        {
          ...data,
          discount: Number(data.discount),
          user_id: session?.user?.user?.id,
          stock: Number(data.stock),
        },
        session?.user?.accessToken
      )
      .then((res) => {
        useCouponRegisterModal.setState({ isRegister: true });
        toast.success(`Cupom ${data.code} criado com sucesso`);
        setLoading(false);
        couponRegisterModal.onClose();
        router.refresh();
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.message);
      });
  };

  const { setValue, watch } = form;

  type FormSchemaType = z.infer<typeof formSchema>;

  type FormField = keyof FormSchemaType;

  const setCustomValue = (id: FormField, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const resetForm = () => {
    form.reset();
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    useCouponRegisterModal.setState({ isRegister: false });
    useCouponUpdateModal.setState({ isUpdate: false });
    useCouponDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">
            Cadastro de Cupom
          </h1>
        </>
      }
      body={
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
              <div>
                <h1 className="my-4 font-semibold text-green-primary">
                  Informações do cupom
                </h1>
                <div className="flex flex-row mb-5">
                  <div className="w-full lg:mr-5">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Código do cupom
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Insira o código do cupom"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="expires_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Data de expiração
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              placeholder="Insira a data de expiração"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex flex-row mb-5">
                  <div className="w-full lg:mr-5">
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Valor do desconto (%)
                          </FormLabel>
                          <FormControl>
                            <InputCurrency
                            isPercentage
                              placeholder="Insira o desconto do cupom"
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Estoque
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Insira o estoque do cupom"
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
                <div>
                  <FormLabel>Status</FormLabel>
                  <div>
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col">
                            <FormControl>
                              <div className="flex flex-row mt-5 items-center">
                                <Checkbox
                                  color="blue"
                                  className="w-5 h-5"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <div className="ml-2">Cupom ativo</div>
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <Button
                  size="lg"
                  className={`w-full ${loading && "cursor-not-allowed"}`}
                  type="submit"
                >
                  {loading ? <Loader /> : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      }
    />
  );
};

export default CouponRegister;
