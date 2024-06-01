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
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";

import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";
import Loader from "../loader";
import { useSizeService } from "@/services/size.service";
import useSizeRegisterModal from "@/utils/hooks/size/useRegisterSizeModal";
import useSizeUpdateModal from "@/utils/hooks/size/useUpdateSizeModal";
import useSizeDeleteModal from "@/utils/hooks/size/useDeleteSizeModal";

interface SizeRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  size: z.string().min(1, "Tamanho é obrigatório"),
});

const SizeRegister = ({ isOpen, onClose }: SizeRegisterProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const sizeService = useSizeService();
  const sizeRegisterModal = useSizeRegisterModal();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      size: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);

    await sizeService
      .POST(
        {
          size: data.size,
          user_id: session?.user?.user?.id,
        },
        session?.user?.accessToken
      )
      .then((res) => {
        useSizeRegisterModal.setState({ isRegister: true });
        toast.success(`Tamanho ${data.size} criado com sucesso`);
        setLoading(false);
        sizeRegisterModal.onClose();
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
    useSizeRegisterModal.setState({ isRegister: false });
    useSizeUpdateModal.setState({ isUpdate: false });
    useSizeDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">
            Cadastro de Tamanho
          </h1>
        </>
      }
      body={
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
              <div>
                <h1 className="my-4 font-semibold text-green-primary">
                  Informações da categoria
                </h1>
                <div className="flex flex-row mb-5">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Tamanho
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Insira o nome do tamanho"
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

export default SizeRegister;
