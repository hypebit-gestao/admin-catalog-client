"use client";

import React, { useEffect, useRef, useState } from "react";
import Modal from "../modal";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputMask from "react-input-mask";
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
import { Address } from "@/models/address";
import { useAddressService } from "@/services/address.service";
import { useUserService } from "@/services/user.service";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useUploadService } from "@/services/upload.service";
import { ReturnUpload, Upload } from "@/models/upload";
import useUserRegisterModal from "@/utils/hooks/user/useRegisterUserModal";
import { useRouter } from "next/navigation";
import { useCepService } from "@/services/cep.service";
import Image from "next/image";
import { TiDelete } from "react-icons/ti";
import useEditUserModal from "@/utils/hooks/user/useEditUserModal";
import { User } from "@/models/user";
import Loader from "../loader";

interface UserEditProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "O campo Nome é obrigatório"),
  cpf_cnpj: z.string().min(1, "O campo CPF/CNPJ é obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  // password: z.string().min(1, "O campo Senha é obrigatório"),
  person_link: z.string().min(1, "O campo Link personalizado é obrigatório"),
  image_url: z.any(),
  cep: z.string().min(1, "CEP é obrigatório"),
  street: z.string().min(1, "Logradouro é obrigatório"),
  number: z.number(),
  district: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatório"),
  state: z.string().min(1, "Estado é obrigatório"),
  complement: z.string(),
});

const UserEdit = ({ isOpen, onClose }: UserEditProps) => {
  const { data: session } = useSession();
  const addressService = useAddressService();
  const userService = useUserService();
  const uploadService = useUploadService();
  const userRegisterModal = useUserRegisterModal();
  const userEditModal = useEditUserModal();
  const cepService = useCepService();
  const [user, setUser] = useState<User>();
  const [address, setAddress] = useState<Address>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputFileRef = useRef<any>(null);
  const [filePreview, setFilePreview] = useState<any>(null);

  const handleDeleteFile = () => {
    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }
    setCustomValue("image_url", "");
    setFilePreview(null);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf_cnpj: "",
      email: "",
      phone: "",
      person_link: "",
      // password: "",
      image_url: "",
      cep: "",
      street: "",
      number: 0,
      district: "",
      city: "",
      state: "",
      complement: "",
    },
  });

  const phoneMask = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{2})(\d)/, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    return value;
  };

  const cepMask = (value: string) => {
    if (!value) return "";

    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    return value;
  };

  const cpfCnpjMask = (value: string) => {
    if (!value) return "";

    value = value.replace(/\D/g, "");

    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      value = value.replace(/^(\d{2})(\d)/, "$1.$2");
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
      value = value.replace(/(\d{4})(\d)/, "$1-$2");
    }

    return value;
  };

  const removeFormatting = (value: string) => {
    return value.replace(/\D/g, ""); // Remove todos os caracteres não numéricos
  };

  const { setValue, watch } = form;

  const cep = watch("cep");

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
    const getUser = async () => {
      const fetchedUser = await userService.GETBYID(
        userEditModal.itemId,
        session?.user.accessToken
      );

      if (fetchedUser) {
        if (fetchedUser.id === userEditModal.itemId) {
          setUser(fetchedUser as User);
          setCustomValue("name", fetchedUser.name);
          setCustomValue("cpf_cnpj", fetchedUser.cpf_cnpj);
          setCustomValue("email", fetchedUser.email);
          setCustomValue("person_link", fetchedUser.person_link);
          setCustomValue("phone", fetchedUser.phone);
          setCustomValue("image_url", fetchedUser.image_url);
          if (fetchedUser.image_url) {
            setFilePreview(fetchedUser.image_url);
          }
          setLoading(false);
        }
      }
    };

    getUser();

    if (user?.address_id) {
      const getAddress = async () => {
        const fetchedAddress = await addressService.GETBYID(
          user?.address_id,
          session?.user.accessToken
        );

        if (fetchedAddress) {
          if (fetchedAddress.id === user?.address_id) {
            setAddress(fetchedAddress);
            setValue("cep", fetchedAddress.cep);
            setValue("street", fetchedAddress.street);
            setValue("number", fetchedAddress.number);
            setValue("district", fetchedAddress.district);
            setValue("city", fetchedAddress.city);
            setValue("state", fetchedAddress.state);
            setValue("complement", fetchedAddress.complement);
          }
        }
      };
      getAddress();
    }
  }, [
    session?.user.accessToken,
    userEditModal.itemId,
    user?.address_id,
    userEditModal.isOpen,
  ]);
  const getCep = async () => {
    await cepService
      .GET(cep)
      .then((res) => {
        setCustomValue("street", res.logradouro);
        setCustomValue("district", res.bairro);
        setCustomValue("city", res.localidade);
        setCustomValue("state", res.uf);
        setCustomValue("complement", res.complemento);
      })
      .catch((err) => {
        toast.error("CEP não encontrado");
      });
  };

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    try {
      if (data?.image_url) {
        await uploadService
          .POST({
            file: data.image_url,
            folderName: data.name,
          })
          .then(async (res: ReturnUpload | undefined) => {
            if (Array.isArray(res) && res.length > 0 && res[0].imageUrl) {
              await userService.PUT(
                {
                  ...data,
                  user_type: 1,
                  status: "ACTIVE",
                  payer_id: 0,
                  address_id: user?.address_id,
                  image_url: res[0].imageUrl,
                  id: user?.id,
                  shipping_taxes: user?.shipping_taxes,
                  shipping_type: user?.shipping_type,
                },
                session?.user?.accessToken
              );
            }
          });
      } else {
        await userService.PUT(
          {
            ...data,
            user_type: 1,
            payer_id: 0,
            status: "ACTIVE",
            address_id: user?.address_id,
            id: user?.id,
            shipping_taxes: user?.shipping_taxes,
            shipping_type: user?.shipping_type,
          },
          session?.user.accessToken
        );
      }
      useEditUserModal.setState({ isUpdate: true });
      toast.success(`${data.name} atualizado com sucesso`);
      userEditModal.onClose();
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">Editar Loja</h1>
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
                    Informações pessoais
                  </h1>
                  <div className="flex flex-row mb-5">
                    <div className="w-full mr-5">
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
                                placeholder="Insira o nome do usuário"
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
                        name="cpf_cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              CPF/CNPJ
                            </FormLabel>
                            <FormControl>
                              <Input
                                maxLength={18}
                                className=""
                                placeholder="Insira o cpf/cnpj do usuário"
                                value={cpfCnpjMask(field.value)}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-row mb-5">
                    <div className="w-full mr-5">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              E-mail
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Insira o e-mail do usuário"
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Telefone
                            </FormLabel>
                            <FormControl>
                              <Input
                                maxLength={15}
                                className=""
                                placeholder="Insira o telefone do usuário"
                                value={phoneMask(field.value)}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                }}
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
                  <h1 className="my-4 font-semibold text-green-primary">
                    Informações de endereço
                  </h1>
                  <div className="flex flex-row mb-5">
                    <div className="w-full mr-5">
                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Cep
                            </FormLabel>
                            <FormControl>
                              <Input
                                maxLength={9}
                                onBlur={(e) => {
                                  setCustomValue("cep", e.target.value);
                                  getCep();
                                }}
                                placeholder="Insira o cep"
                                value={cepMask(field.value)}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                }}
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
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Rua
                            </FormLabel>
                            <FormControl>
                              <Input
                                className=""
                                placeholder="Insira a rua"
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
                    <div className="w-full mr-5">
                      <FormField
                        control={form.control}
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Bairro
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Insira o bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Número
                            </FormLabel>
                            <FormControl>
                              <Input
                                className=""
                                placeholder="Insira o número"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-row ">
                    <div className="w-full mr-5">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Cidade
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Insira a cidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Estado
                            </FormLabel>
                            <FormControl>
                              <Input
                                maxLength={2}
                                className=""
                                placeholder="Insira o estado"
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
                  <h1 className="my-4 font-semibold text-green-primary">
                    Informações adicionais
                  </h1>

                  <div className="mb-5">
                    <div>
                      <FormField
                        control={form.control}
                        name="person_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              URL
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Insira o nome da loja que aparecerá no link do site"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row ">
                    <div className="w-full ">
                      <FormField
                        control={form.control}
                        name="image_url"
                        render={({
                          field: { value, onChange, ...fieldProps },
                        }) => (
                          <FormItem>
                            <FormLabel>Logo da Loja</FormLabel>
                            <FormControl>
                              <Input
                                {...fieldProps}
                                ref={inputFileRef}
                                placeholder="Logo da Loja"
                                type="file"
                                accept="image/*, application/pdf"
                                onChange={(event) => {
                                  onChange(
                                    event.target.files && event.target.files[0]
                                  );
                                  if (event.target.files) {
                                    if (event.target.files[0]) {
                                      const reader = new FileReader();

                                      reader.onloadend = () => {
                                        setFilePreview(reader.result);
                                      };

                                      reader.readAsDataURL(
                                        event.target.files[0]
                                      );
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            {filePreview && (
                              <div className="relative mt-3 w-[300px] ">
                                <div
                                  className="absolute top-0 right-0 cursor-pointer"
                                  onClick={handleDeleteFile}
                                >
                                  <TiDelete color="red" size={24} />
                                </div>

                                <Image
                                  className=""
                                  src={filePreview}
                                  alt="Preview"
                                  width={300}
                                  height={300}
                                />
                              </div>
                            )}

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

export default UserEdit;
