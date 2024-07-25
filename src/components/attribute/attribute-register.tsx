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
import { useAttributeService } from "@/services/attribute.service";
import useAttributeRegisterModal from "@/utils/hooks/attribute/useRegisterAttributeModal";
import useAttributeUpdateModal from "@/utils/hooks/attribute/useUpdateAttributeModal";
import useAttributeDeleteModal from "@/utils/hooks/attribute/useDeleteAttributeModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { MdAdd, MdDelete } from "react-icons/md";
import { Attribute } from "@/models/attribute";

interface AttributeRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome do atributo é obrigatório"),
  type: z.string().min(1, "Tipo do atributo é obrigatório"),
  option_name: z.string()
});

const AttributeRegister = ({ isOpen, onClose }: AttributeRegisterProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [listOptions, setListOptions] = useState<string[]>([]);

  const attributeService = useAttributeService()
  const attributeRegisterModal = useAttributeRegisterModal()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "1",
      option_name: ""
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    if (data.type == "2" && listOptions.length == 0) {
      toast.error("Opções do atributo são obrigatórias");
      return;
    }
    setLoading(true);

    await attributeService
      .POST(
        {
          name: data.name,
          type: Number(data.type),
          user_id: session?.user?.user?.id,
        },
        session?.user?.accessToken
      )
      .then((res: Attribute | undefined) => {
        if (res?.id) {
          if (data.type == "2") {
            listOptions.map((option) => {
              attributeService.POSTOPTION(
                {
                  option_name: option,
                  attribute_id: res.id,
                  user_id: session?.user?.user?.id,
                },
                session?.user?.accessToken
              ).then((res) => {
                toast.success(`Opção do atributo criado com sucesso`);
              })
            });
          }
        }
        useAttributeRegisterModal.setState({ isRegister: true });
        toast.success(`Atributo ${data.name} criado com sucesso`);
        setLoading(false);
        attributeRegisterModal.onClose();
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
      setListOptions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    useAttributeRegisterModal.setState({ isRegister: false });
    useAttributeUpdateModal.setState({ isUpdate: false });
    useAttributeDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  console.log("ListOptions", listOptions);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">
            Cadastro de Atributo
          </h1>
        </>
      }
      body={
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className=" w-full">
              <div>
                <h1 className="my-4 font-semibold text-green-primary">
                  Informações do atributo
                </h1>
                <div className="flex flex-row mb-5">
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-primary">
                            Nome
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Insira o nome do atributo"
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
                  <div className="w-full">
                  <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de atributo</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={"1"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[300]">
                                <SelectItem value="1">
                                  Texto
                                </SelectItem>
                                <SelectItem value="2">
                                  Seleção
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                </div>
                <div className="mt-5">
                      {watch("type") == "2" && (
                        <div className="w-full flex flex-row items-center">
                          <div className="w-full">
                          <FormField
                            control={form.control}
                            name="option_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder="Insira o nome da opção"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          </div>
                          <div className="ml-5">
                            <Button onClick={(e) => {
                              e.preventDefault();
                              if (watch("option_name") == "") {
                                toast.error("Nome da opção é obrigatório");
                                return;
                              }
                              setListOptions([...listOptions, watch("option_name")]);
                              setCustomValue("option_name", "");
                            }} className="rounded-lg p-2 bg-green-primary">
                            <MdAdd size={24} color="#fff" />
                            </Button>
                          </div>
                        </div>
                      )}
                         
                         {listOptions?.length > 0 && (
                          <div className="w-full mt-5">
                          <h1 className="font-bold text-lg mb-3">Opções</h1>
                              {listOptions.map((option, index) => (
                                <div key={index} className="flex flex-row items-center  mb-3">
                                <div className="p-1 rounded-md w-full border border-gray-200">
                                <p className="text-sm">
                                {option}
                                </p>
                                </div>
                                <div className="
                                cursor-pointer">
                                  <MdDelete size={32} color="red" onClick={() => {
                                    const newList = listOptions.filter((item, i) => i !== index);
                                    setListOptions(newList);
                                  }} />
                                </div>
                                </div>
                              ))}
                        </div>
                         )}
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

export default AttributeRegister;
