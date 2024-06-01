"use client";

import React, { useEffect, useState } from "react";
import Modal from "../modal";

import { zodResolver } from "@hookform/resolvers/zod";
import { set, useForm } from "react-hook-form";
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
import { Address } from "@/models/address";
import { useAddressService } from "@/services/address.service";
import { useUserService } from "@/services/user.service";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useUploadService } from "@/services/upload.service";
import { ReturnUpload, Upload } from "@/models/upload";
import { useProductService } from "@/services/product.service";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import { User } from "@/models/user";
import Select from "react-select";
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useProductRegisterModal from "@/utils/hooks/product/useRegisterProductModal";
import { useRouter } from "next/navigation";
import { TiDelete } from "react-icons/ti";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";
import useEditProductModal from "@/utils/hooks/product/useEditProductModal";
import { Product } from "@/models/product";
import Loader from "../loader";
import { Textarea } from "../ui/textarea";
import useProductDeleteModal from "@/utils/hooks/product/useDeleteProductModal";
import NumberFormat from "react-number-format";
import { LuMoveDown, LuMoveLeft, LuMoveRight, LuMoveUp } from "react-icons/lu";
import { IoMdAdd } from "react-icons/io";
import { useSizeService } from "@/services/size.service";
import { Size } from "@/models/size";
import { useProductSizeService } from "@/services/productSize.service";

interface ProductRegisterProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    category_id: z.string().nullable(),
    size_ids: z.any(),
    images: z.any(),
    featured: z.boolean(),
    active: z.boolean(),
    currency: z.string(),
    price: z.string(),
    isPromotion: z.boolean(),
    isSize: z.boolean(),
    promotion_price: z.string(),
    user_id: z.string(),
  })
  .refine(
    (data) =>
      data.promotion_price !== null &&
      Number(data.promotion_price) <= Number(data.price),
    {
      message: "O preço promocional não pode ser maior que o preço normal",
      path: ["promotion_price"],
    }
  )
  .refine((data) => Number(data.price) >= Number(data.promotion_price), {
    message: "O preço normal não pode ser menor que o preço promocional",
    path: ["price"],
  });

const ProductEdit = ({ isOpen, onClose }: ProductRegisterProps) => {
  const { data: session } = useSession();
  const userService = useUserService();
  const productService = useProductService();
  const categoryService = useCategoryService();
  const sizeService = useSizeService();
  const productSizeService = useProductSizeService();
  const uploadService = useUploadService();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User>();
  const [product, setProduct] = useState<Product>();
  const [sizes, setSizes] = useState<Size[]>([]);
  const productRegisterModal = useProductRegisterModal();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [filePreviews, setFilePreviews] = useState<any[]>([]);
  const productEditModal = useEditProductModal();

  const form = useForm<z.infer<typeof formSchema>>({
    // resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      size_ids: [],
      images: "",
      currency: "",
      featured: false,
      active: true,
      price: "",
      isPromotion: false,
      isSize: false,
      promotion_price: "",
      user_id: session?.user?.user?.name,
    },
  });

  const { setValue, watch } = form;

  type FormSchemaType = z.infer<typeof formSchema>;

  type FormField = keyof FormSchemaType;

  const isPromotion = watch("isPromotion");
  const isSize = watch("isSize");

  const setCustomValue = (id: FormField, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleDeleteFile = (index: number) => {
    const newPreviews = [...filePreviews];
    newPreviews.splice(index, 1);

    const updatedImages = newPreviews.map((preview) =>
      typeof preview === "string" ? preview : preview.file
    );

    setFilePreviews(newPreviews);
    setProduct({ ...(product as Product), images: updatedImages });
  };

  const handleMoveUp = async (index: any) => {
    const newPreviews = [...filePreviews];
    const temp = newPreviews[index];
    newPreviews[index] = newPreviews[index - 1];
    newPreviews[index - 1] = temp;
    setFilePreviews(newPreviews);

    // setProduct({ ...(product as Product), images: newPreviews });
  };

  const handleMoveDown = async (index: any) => {
    const newPreviews = [...filePreviews];
    const temp = newPreviews[index];
    newPreviews[index] = newPreviews[index + 1];
    newPreviews[index + 1] = temp;
    setFilePreviews(newPreviews);

    // setProduct({ ...(product as Product), images: newPreviews });
  };

  useEffect(() => {
    setLoading(true);
    const getProduct = async () => {
      const fetchedProduct = await productService.GETBYID(
        productEditModal.itemId,
        session?.user.accessToken
      );

      if (fetchedProduct) {
        if (fetchedProduct.id === productEditModal.itemId) {
          setProduct(fetchedProduct as Product);
          setCustomValue("name", fetchedProduct.name);
          setCustomValue("description", fetchedProduct.description);
          setCustomValue("category_id", fetchedProduct.category_id);
          setCustomValue("images", fetchedProduct.images);
          setCustomValue("currency", fetchedProduct.currency);
          setCustomValue("featured", fetchedProduct.featured);
          setCustomValue("active", fetchedProduct.active);
          setCustomValue("price", fetchedProduct.price.toString());
          setCustomValue(
            "promotion_price",
            fetchedProduct.promotion_price?.toString()
          );
          setCustomValue(
            "isPromotion",
            Number(fetchedProduct.promotion_price) > 0
          );
          const sizes = fetchedProduct.product_size?.map((item) => {
            return {
              value: item.size.id,
              label: item.size.size,
            };
          });
          if (sizes) {
            setCustomValue("isSize", true);
            setCustomValue("size_ids", sizes);
          }
          // if (fetchedProduct?.product_size?.length > 0) {
          //   setCustomValue("isSize", true);
          //   const sizes = fetchedProduct?.product_size.map(
          //     (size) => size.size.size
          //   );
          //   setCustomValue("size_ids", sizes);
          // }
          setCustomValue("user_id", fetchedProduct.user_id);

          if (fetchedProduct.images) {
            const previews = fetchedProduct.images.map((image) => image);
            setFilePreviews(previews as any);
          }

          setLoading(false);
        }
      }
    };

    getProduct();

    const getUser = async () => {
      const fetchedUser = await userService.GETBYID(
        session?.user?.user?.id,
        session?.user.accessToken
      );
      if (fetchedUser) {
        setLoading(false);
        setUsers(fetchedUser);
      }
    };

    const getCategories = async () => {
      const fetchedCategories = await categoryService.GETALL(
        session?.user.accessToken
      );
      if (fetchedCategories) {
        setLoading(false);
        setCategories(fetchedCategories);
      }
    };

    const getSizes = async () => {
      const fetchedSizes = await sizeService.GETALL(session?.user.accessToken);
      if (fetchedSizes) {
        setSizes(fetchedSizes);
      }
    };

    getSizes();

    getUser();
    getCategories();
  }, [session?.user?.accessToken, productEditModal.itemId]);

  console.log("TAM: ", product?.product_size?.length);
  console.log("TAMOUTRO: ", form.watch("size_ids")?.length);

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    data.images = filePreviews.map((preview) => preview);
    if (loading) return;
    setLoading(true);

    try {
      const uploadedImagesUrls: string[] = [];

      // Verifique se data.images não é null ou undefined antes de iterar
      if (data.images) {
        // Upload files
        for (let i = 0; i < data.images.length; i++) {
          const file = data.images[i];
          let res;

          if (file?.file?.size !== undefined) {
            res = await uploadService.POST({
              file: file?.file,
              folderName: session?.user?.user?.name,
            });
          }

          if (Array.isArray(res) && res.length > 0) {
            uploadedImagesUrls.push(res[0].imageUrl);
          } else {
          }
        }
      }
      await productService
        .PUT(
          {
            id: product?.id,
            name: data.name,
            description: data.description,
            category_id: data.category_id !== "" ? data.category_id : null,
            images: [...uploadedImagesUrls, ...(product?.images || [])],
            currency: data.currency,
            price: Number(data.price),
            promotion_price: data.isPromotion
              ? Number(data.promotion_price)
              : null,
            user_id: session?.user?.user?.id,
            featured: data.featured,
            active: data.active,
          },
          session?.user?.accessToken
        )
        .then((res) => {
          if (
            form.watch("size_ids")?.length >
            (product?.product_size?.length ?? 0)
          ) {
            const newSize = form
              .watch("size_ids")
              ?.filter(
                (size: any) =>
                  !product?.product_size?.some(
                    (item: any) => item.size.id === size.value
                  )
              );

            if (newSize) {
              newSize.map(async (size: any) => {
                await productSizeService.POST(
                  {
                    product_id: product?.id,
                    size_id: size.value,
                  },
                  session?.user?.accessToken
                );
              });
            }
          } else {
            const newSize = product?.product_size?.filter(
              (item) =>
                !form
                  .watch("size_ids")
                  ?.some((size: any) => size.value === item.size.id)
            );

            if (newSize) {
              newSize.map(async (size: any) => {
                await productSizeService.DELETE(
                  size.id,
                  session?.user?.accessToken
                );
              });
            }
          }
        });

      setLoading(false);
      useEditProductModal.setState({ isUpdate: true });
      toast.success(`${data.name} atualizado com sucesso`);

      productEditModal.onClose();
      router.refresh();
    } catch (error) {
      setLoading(false);
      toast.error((error as Error).message);
    }
  };

  useEffect(() => {
    useProductRegisterModal.setState({ isRegister: false });
    useEditProductModal.setState({ isUpdate: false });
    useProductDeleteModal.setState({ isDelete: false });
  }, [isOpen]);

  const options: any = [
    ...sizes.map((size) => ({
      value: size.id,
      label: size.size,
    })),
  ];

  console.log("sizeIds: ", watch("size_ids"));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={
        <>
          <h1 className="text-[#2c6e49] font-bold text-xl">Editar Produto</h1>
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
                    Informações do produto
                  </h1>
                  <div className="flex flex-row mb-5">
                    <div className="w-full ">
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
                                placeholder="Insira o nome do produto"
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
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <SelectComponent
                              onValueChange={(value) => {
                                if (value === "null") {
                                  field.onChange(null);
                                } else {
                                  field.onChange(value);
                                }
                              }}
                              defaultValue={
                                field.value === null
                                  ? "null"
                                  : (field.value as any)
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a categoria do produto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[300]">
                                <SelectItem value={"null"}>
                                  Sem categoria
                                </SelectItem>

                                {categories.map((category, index) => (
                                  <SelectItem
                                    key={index}
                                    value={category?.id as string}
                                  >
                                    {category?.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectComponent>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="user_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usuário</FormLabel>
                            <SelectComponent
                              onValueChange={field.onChange}
                              defaultValue={session?.user?.user?.name}
                              disabled
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[300]">
                                <SelectItem
                                  disabled
                                  defaultValue={session?.user?.user?.name}
                                  value={session?.user?.user?.name}
                                >
                                  {session?.user?.user?.name}
                                </SelectItem>
                              </SelectContent>
                            </SelectComponent>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <h1 className="font-bold">
                      Deseja adicionar preço promocional no produto?
                    </h1>
                  </div>

                  <div className="mb-5">
                    <FormField
                      control={form.control}
                      name="isPromotion"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col">
                            <FormControl>
                              <div className="flex flex-row items-center">
                                <Checkbox
                                  color="blue"
                                  className="w-5 h-5"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-row mb-5">
                    <div className={`w-full ${isPromotion && "lg:mr-5"}`}>
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">
                              Preço
                            </FormLabel>
                            <FormControl>
                              <InputCurrency
                                placeholder="Preço do produto"
                                type="number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {isPromotion && (
                      <div className="w-full mb-5 lg:mb-0 ">
                        <FormField
                          control={form.control}
                          name="promotion_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-blue-primary">
                                Preço Promocional
                              </FormLabel>
                              <FormControl>
                                <InputCurrency
                                  placeholder="Preço Promocional"
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
                  <div className="flex flex-row mb-5">
                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descrição do produto"
                                className="resize-none"
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
                  <div className="mb-3">
                    <h1 className="font-bold">Seu produto possui tamanho?</h1>
                  </div>
                  <div className="mb-5">
                    <FormField
                      control={form.control}
                      name="isSize"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex flex-col">
                            <FormControl>
                              <div className="flex flex-row items-center">
                                <Checkbox
                                  color="blue"
                                  className="w-5 h-5"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </div>
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {isSize && (
                    <div className="w-full mb-5">
                      <FormField
                        control={form.control}
                        name="size_ids"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tamanho</FormLabel>
                            <Select
                              styles={{
                                control: (provided, state) => ({
                                  ...provided,
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "0.375rem",
                                  padding: "0.2rem",
                                  fontSize: "0.875rem",
                                  color: "#374151",
                                  backgroundColor: "#fff",
                                  boxShadow: "none",
                                  "&:hover": {
                                    cursor: "pointer",
                                  },
                                }),
                                option: (provided, state) => ({
                                  ...provided,
                                  backgroundColor: state.isSelected
                                    ? "#2c6e49"
                                    : "#fff",
                                  color: state.isSelected ? "#fff" : "#374151",
                                  "&:hover": {
                                    backgroundColor: "#2c6e49",
                                    color: "#fff",
                                  },
                                }),
                                singleValue: (provided, state) => ({
                                  ...provided,
                                  color: "#374151",
                                }),
                                placeholder: (provided, state) => ({
                                  ...provided,
                                  color: "#000",
                                }),
                                indicatorSeparator: (provided, state) => ({
                                  ...provided,
                                  display: "none",
                                }),
                                dropdownIndicator: (provided, state) => ({
                                  ...provided,
                                  color: "#9ca3af",
                                }),
                              }}
                              // className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                              isMulti
                              placeholder="Selecione os tamanhos do produto"
                              options={options}
                              {...field}
                            />

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <div className="flex flex-col lg:flex-row mb-5">
                    <div className="w-full ">
                      <FormField
                        control={form.control}
                        name="images"
                        render={({
                          field: { value, onChange, ...fieldProps },
                        }) => (
                          <FormItem>
                            <FormLabel>Imagens do produto</FormLabel>
                            <FormControl>
                              <Input
                                {...fieldProps}
                                id="images"
                                placeholder="Imagens"
                                type="file"
                                accept="image/*, application/pdf"
                                onChange={(event: any) => {
                                  onChange(event.target.files);
                                  const files = event.target.files;

                                  if (files && files.length > 0) {
                                    const newPreviews = Array.from(files).map(
                                      (file: any) => {
                                        const blob = new Blob([file], {
                                          type: file.type,
                                        });
                                        return {
                                          file,
                                          preview: URL.createObjectURL(blob),
                                        };
                                      }
                                    );

                                    setFilePreviews([
                                      ...filePreviews,
                                      ...newPreviews,
                                    ]);
                                  }
                                }}
                                multiple
                              />
                            </FormControl>
                            <div className="flex flex-row items-center w-full gap-6 ">
                              {filePreviews.map((preview, index) => (
                                <div
                                  key={index}
                                  className="relative mt-3 w-auto lg:w-[100px]"
                                >
                                  <div
                                    className="absolute top-0 right-0 cursor-pointer"
                                    onClick={() => handleDeleteFile(index)}
                                  >
                                    <TiDelete color="red" size={24} />
                                  </div>

                                  {typeof preview === "string" ||
                                  typeof preview === "object" ? (
                                    <>
                                      <div className="flex flex-col items-center w-full ">
                                        <Image
                                          className="w-[100px] h-[100px] border border-gray-200 rounded-md"
                                          src={
                                            typeof preview === "string"
                                              ? preview
                                              : preview?.preview
                                          }
                                          alt={`Preview ${index + 1}`}
                                          width={100}
                                          height={100}
                                        />
                                        <div className="flex flex-col">
                                          {index < filePreviews.length - 1 && (
                                            <div className="cursor-pointer">
                                              <LuMoveRight
                                                onClick={() =>
                                                  handleMoveDown(index)
                                                }
                                                size={24}
                                                color="#2c6e49"
                                              />
                                            </div>
                                          )}

                                          {index > 0 && (
                                            <div className="cursor-pointer">
                                              <LuMoveLeft
                                                onClick={() =>
                                                  handleMoveUp(index)
                                                }
                                                size={24}
                                                color="#2c6e49"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <Image
                                      className="w-[100px] h-[100px]"
                                      src={URL.createObjectURL(preview.file)}
                                      alt={`Preview ${index + 1}`}
                                      width={100}
                                      height={100}
                                    />
                                  )}
                                </div>
                              ))}
                              {filePreviews.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const inputImages =
                                      document.getElementById("images");
                                    if (inputImages) {
                                      inputImages.click();
                                    }
                                  }}
                                  className="px-3 bg-green-primary rounded-md h-[40px]"
                                >
                                  <IoMdAdd size={24} color="#fff" />
                                </button>
                              )}
                            </div>
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
                                  <div className="ml-2">Produto ativo</div>
                                </div>
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="featured"
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
                                  <div className="ml-2">
                                    Produto em destaque
                                  </div>
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

export default ProductEdit;
