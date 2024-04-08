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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input, InputCurrency } from "@/components/ui/input";
import { Button } from "../ui/button";

import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import { useCategoryService } from "@/services/category.service";

import useCategoryRegisterModal from "@/utils/hooks/category/useRegisterCategoryModal";
import { useRouter } from "next/navigation";
import { TiDelete } from "react-icons/ti";
import Image from "next/image";
import { Textarea } from "../ui/textarea";
import { useUploadService } from "@/services/upload.service";
import { ReturnUpload } from "@/models/upload";
import Loader from "../loader";
import useCategoryUpdateModal from "@/utils/hooks/category/useUpdateCategoryModal";
import useCategoryDeleteModal from "@/utils/hooks/category/useDeleteCategoryModal";
import { useUserService } from "@/services/user.service";
import useShippingRegisterModal from "@/utils/hooks/shipping/useRegisterShippingModal";
import { User } from "@/models/user";

interface ShippingRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  shipping_type: z.string().min(1, "Tipo do frete é obrigatório"),
  shipping_taxes: z.string(),
});

const ShippingRegister = ({ isOpen, onClose }: ShippingRegisterProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const inputFileRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<any>(null);
  const [user, setUser] = useState<User>();
  const categoryService = useCategoryService();
  const userService = useUserService();
  const uploadService = useUploadService();
  const categoryRegisterModal = useCategoryRegisterModal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shipping_type: "",
      shipping_taxes: "",
    },
  });

  useEffect(() => {
    const getUser = async () => {
      const fetchedUser = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user.accessToken
      );
      if (fetchedUser) {
        setUser(fetchedUser);
      }
    };

    getUser();
  }, [isOpen]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);

    await userService
      .PUT(
        {
          id: session?.user?.user?.id,
          shipping_type: data.shipping_type,
          shipping_taxes: Number(data.shipping_taxes),
        },
        session?.user.accessToken
      )
      .then(() => {
        setLoading(false);
        onClose();
        toast.success("Frete cadastrado com sucesso");
      })
      .catch((err) => {
        setLoading(false);
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
    useShippingRegisterModal.setState({ isRegister: false });
    // useCategoryUpdateModal.setState({ isUpdate: false });
    // useCategoryDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  const shippingType = watch("shipping_type");

  useEffect(() => {
    if (user) {
      setCustomValue("shipping_type", String(user.shipping_type));
      setCustomValue("shipping_taxes", String(user.shipping_taxes));
    }
  }, [user, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">Entrega</h1>
        </>
      }
      body={
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
              <div>
                <h1 className="my-4 font-semibold text-green-primary">
                  Informações Básicas
                </h1>
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="shipping_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de frete</FormLabel>
                        <Select
                          defaultValue={String(shippingType)}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[300]">
                            <SelectItem value="1">Preço Fixo</SelectItem>
                            <SelectItem value="2">Preço a Combinar</SelectItem>
                          </SelectContent>
                        </Select>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {shippingType === "1" && (
                  <div className="w-full mt-5">
                    <FormField
                      control={form.control}
                      name="shipping_taxes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Taxa de Entrega
                          </FormLabel>
                          <FormControl>
                            <InputCurrency
                              placeholder="Valor da taxa"
                              type="number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="mt-12">
                <Button
                  size="lg"
                  className={`w-full ${loading && "cursor-not-allowed"}`}
                  type="submit"
                >
                  {loading ? <Loader /> : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      }
    />
  );
};

export default ShippingRegister;
