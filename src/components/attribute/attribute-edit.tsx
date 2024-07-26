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
import useSizeUpdateModal from "@/utils/hooks/size/useUpdateSizeModal";
import { Size } from "@/models/size";
import useSizeRegisterModal from "@/utils/hooks/size/useRegisterSizeModal";
import useSizeDeleteModal from "@/utils/hooks/size/useDeleteSizeModal";
import useAttributeUpdateModal from "@/utils/hooks/attribute/useUpdateAttributeModal";
import { useAttributeService } from "@/services/attribute.service";
import { Attribute, AttributeOption } from "@/models/attribute";
import useAttributeRegisterModal from "@/utils/hooks/attribute/useRegisterAttributeModal";
import useAttributeDeleteModal from "@/utils/hooks/attribute/useDeleteAttributeModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { MdAdd, MdDelete } from "react-icons/md";

interface SizeUpdateProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome do atributo é obrigatório"),
  type: z.string().min(1, "Tipo do atributo é obrigatório"),
  option_name: z.string()
});

const AttributeEdit = ({ isOpen, onClose }: SizeUpdateProps) => {
  const { data: session } = useSession();
  const router = useRouter();
  const sizeService = useSizeService();
  const attributeService = useAttributeService();
  const sizeEditModal = useSizeUpdateModal();
  const attributeDeleteModal = useAttributeDeleteModal()
  const attributeEditModal = useAttributeUpdateModal();
  const [size, setSize] = useState<Size>();
  const [attribute, setAttribute] = useState<Attribute>();
  const [attributeOption, setAttributeOption] = useState<AttributeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [listOptions, setListOptions] = useState<AttributeOption[]>([]);
  const [newListOptions, setNewListOptions] = useState<string[]>([]);
  const [listDeleteOptions, setListDeleteOptions] = useState<AttributeOption[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      option_name: "",
    },
  });

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

  const handleClose = () => {
    onClose();
    setListOptions([]);
    setNewListOptions([]);
  };

  useEffect(() => {
    setLoading(true);
    const getAttribute = async () => {
      const fetchedAttribute = await attributeService.GETBYID(
        session?.user.accessToken,
        attributeEditModal.itemId
      );

      if (fetchedAttribute) {
        if (fetchedAttribute.id === attributeEditModal.itemId) {
          setAttribute(fetchedAttribute);
          setCustomValue("name", fetchedAttribute.name);
          setCustomValue("type", String(fetchedAttribute.type));
          // setCustomValue("option_name", fetchedAttribute.)
          // setCustomValue("attribute", fetchedAttribute.size);

          setLoading(false);
        }
      }
    };
    const getAllAttributeOption = async () => {
      setLoading(true)
      const fetchedAttributeOption = await attributeService.GETALLATTRIBUTEOPTION(
        session?.user.accessToken,
      );

      if (fetchedAttributeOption) {
        setLoading(false);
        setAttributeOption(fetchedAttributeOption);
      }
    };

    getAttribute();
    getAllAttributeOption();
  }, [session?.user.accessToken, attributeEditModal.itemId]);

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    if (loading) return;
    setLoading(true);
    try {
      await attributeService.PUT(
        {
          ...data,
          type: Number(data.type),
          id: attribute?.id,
        },
        session?.user.accessToken
      ).then((res: Attribute | undefined) => {
        if (res?.id) {
          if (data.type == "2") {
            if (newListOptions?.length > 0) {
              newListOptions.map((option) => {
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
        }
      })

      if (listDeleteOptions.length > 0) {
        listDeleteOptions.map((option: any) => {
          attributeService.DELETEATTRIBUTEOPTION(option, session?.user.accessToken).then((res) => {
            toast.success(`Opção do atributo deletado com sucesso`);
            useAttributeDeleteModal.setState({ isDelete: true });
          }).catch((err) => {
            console.log("Err: ", err);
          })
        });
      }

      useAttributeUpdateModal.setState({ isUpdate: true });
      toast.success(`Atributo atualizado com sucesso`);
      setLoading(false);
      attributeEditModal.onClose();
      router.refresh();
    } catch (error) {
      setLoading(false);
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    useAttributeRegisterModal.setState({ isRegister: false });
    useAttributeUpdateModal.setState({ isUpdate: false });
    useAttributeDeleteModal.setState({ isDelete: false });
  }, [isOpen]);



  useEffect(() => {
    if (attributeOption) {
      const options = attributeOption.filter((item) => item.attribute_id === attribute?.id);
      if (options) {
        setListOptions(options.map((item: any) => item));
      }
    }
  }, [attribute, attributeOption, isOpen, attributeEditModal.isUpdate, attributeDeleteModal.isDelete]);


  console.log("List: ", listOptions);
  console.log("NewList: ", newListOptions);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => handleClose()}
      header={
        <>
          <h1 className="text-primary-blue font-bold text-xl">
            Editar Atributo
          </h1>
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
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[300]">
                                {/* <SelectItem value="1">
                                  Texto
                                </SelectItem> */}
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
                              // setListOptions([...listOptions, watch("option_name")]);
                              setNewListOptions([...newListOptions, watch("option_name")]);
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
                              {listOptions.map((option: AttributeOption | any, index) => (
                                <div key={index} className="flex flex-row items-center  mb-3">
                                <div className="p-1 rounded-md w-full border border-gray-200">
                                <p className="text-sm">
                                {option.option_name}
                                </p>
                                </div>
                                <div className="
                                cursor-pointer">
                                  <MdDelete size={32} color="red" onClick={() => {
                                    const newList = listOptions.filter((item, i) => i !== index);
                                    setListOptions(newList);
                                    setListDeleteOptions([...listDeleteOptions, option.id]);
                                  }} />
                                </div>
                                </div>
                              ))}
                        </div>
                         )}

              {newListOptions.length > 0 && (
                      <div className={`${listOptions?.length <= 0 ? 'mt-5' : 'mt-auto'} w-full`}>
                        {newListOptions.map((option, index: number) => (
                          <div key={index} className="flex flex-row items-center mb-3">
                            <div className="p-1 rounded-md w-full border border-gray-200">
                              <p className="text-sm">{option}</p>
                            </div>
                            <div className="cursor-pointer">
                              <MdDelete
                                size={32}
                                color="red"
                                onClick={() => {
                                  const newList = newListOptions.filter((item, i) => i !== index);
                                  setNewListOptions(newList);
                                }}
                              />
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
                    {loading ? <Loader /> : "Atualizar"}
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

export default AttributeEdit;
