"use client";

import React, { useEffect, useState } from "react";
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
import { Input, InputCurrency } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useUploadService } from "@/services/upload.service";
import { useProductService } from "@/services/product.service";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import { LuMoveLeft, LuMoveRight } from "react-icons/lu";
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams, useRouter } from "next/navigation";
import { TiDelete } from "react-icons/ti";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/loader";
import { IoMdAdd } from "react-icons/io";
import { useSizeService } from "@/services/size.service";
import { Size } from "@/models/size";
import { useProductSizeService } from "@/services/productSize.service";
import { Attribute } from "@/models/attribute";
import { useAttributeService } from "@/services/attribute.service";
import { TbTrash } from "react-icons/tb";
import { FaSave } from "react-icons/fa";
import { Product } from "@/models/product";
import ContentMain from "@/components/content-main";

const formSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    category_id: z.string().nullable(),
    size_ids: z.any(),
    attribute_ids: z.any(),
    images: z.any(),
    featured: z.boolean(),
    active: z.boolean(),
    currency: z.string(),
    price: z.string(),
    installment_available: z.boolean().optional(),
    installment_with_interest: z.boolean().optional(),
    installment_interest_value: z.string().optional(),
    max_installments: z.string().optional(),
    isPromotion: z.boolean(),
    isSize: z.boolean(),
    isAttribute: z.boolean(),
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

const ProductEditPage = () => {
  const { data: session } = useSession();
  const params = useParams()!;
  const productId = params.id as string;
  const router = useRouter();

  const productService = useProductService();
  const categoryService = useCategoryService();
  const sizeService = useSizeService();
  const productSizeService = useProductSizeService();
  const attributeService = useAttributeService();
  const uploadService = useUploadService();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product>();
  const [sizes, setSizes] = useState<Size[]>([]);
  const [filePreviews, setFilePreviews] = useState<any[]>([]);
  const [sizeList, setSizeList] = useState<
    Array<{
      productSizeId?: string;
      sizeId: string;
      sizeName: string;
      price: string;
    }>
  >([]);
  const [selectedNewSizeId, setSelectedNewSizeId] = useState<string>("");
  const [newSizePrice, setNewSizePrice] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
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
      isAttribute: false,
      promotion_price: "",
      installment_available: false,
      installment_with_interest: false,
      installment_interest_value: "",
      max_installments: "1",
      user_id: session?.user?.user?.name ?? "",
    },
  });

  const { setValue, watch } = form;

  type FormSchemaType = z.infer<typeof formSchema>;
  type FormFieldKey = keyof FormSchemaType;

  const setCustomValue = (id: FormFieldKey, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const isPromotion = watch("isPromotion");
  const isSize = watch("isSize");
  const installmentAvailable = watch("installment_available");
  const installmentWithInterest = watch("installment_with_interest");

  useEffect(() => {
    if (!session?.user?.accessToken || !productId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [fetchedProduct, fetchedCategories, fetchedSizes] =
          await Promise.all([
            productService.GETBYID(productId, session.user.accessToken),
            categoryService.GETALL(session.user.accessToken),
            sizeService.GETALL(session.user.accessToken),
          ]);

        if (fetchedProduct) {
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
            "installment_available",
            Boolean(fetchedProduct.installment_available)
          );
          setCustomValue(
            "installment_with_interest",
            Boolean(fetchedProduct.installment_with_interest)
          );
          setCustomValue(
            "installment_interest_value",
            fetchedProduct.installment_interest_value != null
              ? String(fetchedProduct.installment_interest_value)
              : ""
          );
          setCustomValue(
            "max_installments",
            fetchedProduct.max_installments != null
              ? String(fetchedProduct.max_installments)
              : "1"
          );
          setCustomValue(
            "promotion_price",
            fetchedProduct.promotion_price?.toString() ?? "0"
          );
          setCustomValue(
            "isPromotion",
            Number(fetchedProduct.promotion_price) > 0
          );
          setCustomValue("user_id", fetchedProduct.user_id);

          if (fetchedProduct.images) {
            setFilePreviews(fetchedProduct.images.map((img) => img));
          }

          if (fetchedProduct.product_size) {
            setSizeList(
              fetchedProduct.product_size.map((ps) => ({
                productSizeId: ps.id,
                sizeId: ps.size.id,
                sizeName: ps.size.size,
                price: ps.price?.toString() ?? "",
              }))
            );
            if (fetchedProduct.product_size.length > 0) {
              setCustomValue("isSize", true);
            }
          }
        }

        if (fetchedCategories) setCategories(fetchedCategories);
        if (fetchedSizes) setSizes(fetchedSizes);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [session?.user?.accessToken, productId]);

  const handleDeleteFile = (index: number) => {
    const updated = [...filePreviews];
    updated.splice(index, 1);
    setFilePreviews(updated);
    setProduct({
      ...(product as Product),
      images: updated.map((p) => (typeof p === "string" ? p : p.file)),
    });
  };

  const handleMoveUp = (index: number) => {
    const updated = [...filePreviews];
    [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
    setFilePreviews(updated);
  };

  const handleMoveDown = (index: number) => {
    const updated = [...filePreviews];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setFilePreviews(updated);
  };

  const handleUpdateSizePrice = async (index: number) => {
    const item = sizeList[index];
    if (!item.productSizeId) return;
    try {
      await productSizeService.PUT(
        {
          id: item.productSizeId,
          product_id: product?.id,
          size_id: item.sizeId,
          price: item.price ? Number(item.price) : null,
        },
        session?.user?.accessToken
      );
      toast.success("Preço do tamanho atualizado");
    } catch {
      toast.error("Erro ao atualizar preço");
    }
  };

  const handleRemoveSize = async (index: number) => {
    const item = sizeList[index];
    try {
      if (item.productSizeId) {
        await productSizeService.DELETE(
          item.productSizeId,
          session?.user?.accessToken
        );
      }
      setSizeList(sizeList.filter((_, i) => i !== index));
      toast.success("Tamanho removido");
    } catch {
      toast.error("Erro ao remover tamanho");
    }
  };

  const handleAddSize = async () => {
    if (!selectedNewSizeId || !product?.id) return;
    const selectedSize = sizes.find((s) => s.id === selectedNewSizeId);
    if (!selectedSize) return;
    try {
      const created = await productSizeService.POST(
        {
          product_id: product.id,
          size_id: selectedNewSizeId,
          price: newSizePrice ? Number(newSizePrice) : null,
        },
        session?.user?.accessToken
      );
      setSizeList([
        ...sizeList,
        {
          productSizeId: (created as any)?.id,
          sizeId: selectedNewSizeId,
          sizeName: selectedSize.size!,
          price: newSizePrice,
        },
      ]);
      setSelectedNewSizeId("");
      setNewSizePrice("");
      toast.success("Tamanho adicionado");
    } catch {
      toast.error("Erro ao adicionar tamanho");
    }
  };

  const onUpdate = async (data: z.infer<typeof formSchema>) => {
    data.images = filePreviews.map((p) => p);
    if (submitting) return;
    setSubmitting(true);

    try {
      if (data.images) {
        for (let i = 0; i < data.images.length; i++) {
          const file = data.images[i];
          if (file?.file?.size !== undefined) {
            const res: any = await uploadService.POST({
              file: file.file,
              folderName: session?.user?.user?.name,
            });
            if (Array.isArray(res) && res.length > 0) {
              data.images[i] = res[0].imageUrl;
            }
          }
        }
      }

      await productService.PUT(
        {
          id: product?.id,
          name: data.name,
          description: data.description,
          category_id: data.category_id !== "" ? data.category_id : null,
          images: data.images,
          currency: data.currency,
          price: Number(data.price),
          promotion_price: data.isPromotion ? Number(data.promotion_price) : null,
          user_id: session?.user?.user?.id,
          featured: data.featured,
          active: data.active,
          max_installments: data.installment_available
            ? Number(data.max_installments ?? 1)
            : 1,
          installment_available: data.installment_available,
          installment_with_interest: data.installment_available
            ? data.installment_with_interest
            : false,
          installment_interest_value:
            data.installment_available && data.installment_with_interest
              ? Number(data.installment_interest_value)
              : null,
        },
        session?.user?.accessToken
      );

      const currentAttributeIds = form.watch("attribute_ids");
      if (
        currentAttributeIds?.length >
        (product?.product_attribute?.length ?? 0)
      ) {
        const newAttrs = currentAttributeIds.filter(
          (attr: any) =>
            !product?.product_attribute?.some(
              (pa: any) => pa.attribute.id === attr.value
            )
        );
        for (const attr of newAttrs) {
          await attributeService.POSTPRODUCTOPTION(
            {
              user_id: session?.user?.user?.id,
              product_id: product?.id,
              attribute_id: attr.value,
            },
            session?.user?.accessToken
          );
        }
      } else {
        const removed = product?.product_attribute?.filter(
          (pa) =>
            !currentAttributeIds?.some(
              (attr: any) => attr.value === pa.attribute.id
            )
        );
        for (const pa of removed ?? []) {
          await attributeService.DELETEPRODUCTOPTION(
            (pa as any).id,
            session?.user?.accessToken
          );
        }
      }

      toast.success(`${data.name} atualizado com sucesso`);
      router.push("/product");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ContentMain title="Editar Produto">
        <div className="flex justify-center py-20">
          <Loader color="text-green-primary" />
        </div>
      </ContentMain>
    );
  }

  return (
    <ContentMain
      title="Editar Produto"
      subtitle={product?.name ?? "Carregando..."}
    >
      <div className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onUpdate)} className="w-full">
            {/* Informações do produto */}
            <div>
              <h2 className="my-4 font-semibold text-green-primary">
                Informações do produto
              </h2>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-primary">Nome</FormLabel>
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

              <div className="flex flex-col lg:flex-row gap-5 mb-5">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <SelectComponent
                          onValueChange={(value) =>
                            field.onChange(value === "null" ? null : value)
                          }
                          defaultValue={
                            field.value === null ? "null" : (field.value as any)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-[300]">
                            <SelectItem value="null">Sem categoria</SelectItem>
                            {categories.map((category, i) => (
                              <SelectItem key={i} value={category.id as string}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectComponent>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex-1">
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <SelectComponent
                      disabled
                      defaultValue={session?.user?.user?.name}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={session?.user?.user?.name ?? ""}>
                          {session?.user?.user?.name}
                        </SelectItem>
                      </SelectContent>
                    </SelectComponent>
                  </FormItem>
                </div>
              </div>

              <div className="mb-3">
                <h3 className="font-bold">
                  Deseja adicionar preço promocional no produto?
                </h3>
              </div>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="isPromotion"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox
                          className="w-5 h-5"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col lg:flex-row gap-5 mb-5">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-blue-primary">Preço</FormLabel>
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
                  <div className="flex-1">
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

              <div className="mb-5">
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

            {/* Informações adicionais */}
            <div className="mt-8">
              <h2 className="my-4 font-semibold text-green-primary">
                Informações adicionais
              </h2>

              <div className="mb-3">
                <h3 className="font-bold">Seu produto possui tamanho?</h3>
              </div>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="isSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox
                          className="w-5 h-5"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isSize && (
                <div className="mb-5">
                  <FormLabel>Tamanhos do produto</FormLabel>

                  {sizeList.length > 0 && (
                    <div className="mt-2 mb-3 flex flex-col gap-2">
                      {sizeList.map((item, index) => (
                        <div
                          key={item.sizeId}
                          className="flex items-center gap-2 border rounded-md p-2"
                        >
                          <span className="flex-1 text-sm font-medium">
                            {item.sizeName}
                          </span>
                          <Input
                            className="w-32 text-sm"
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="Preço (opcional)"
                            value={item.price}
                            onChange={(e) => {
                              const updated = [...sizeList];
                              updated[index] = {
                                ...updated[index],
                                price: e.target.value,
                              };
                              setSizeList(updated);
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateSizePrice(index)}
                          >
                            <FaSave className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveSize(index)}
                          >
                            <TbTrash className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <SelectComponent
                      value={selectedNewSizeId}
                      onValueChange={setSelectedNewSizeId}
                    >
                      <SelectTrigger className="flex-1 text-sm">
                        <SelectValue placeholder="Selecione um tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizes
                          .filter((s) => !sizeList.some((sl) => sl.sizeId === s.id))
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id!}>
                              {s.size}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </SelectComponent>
                    <Input
                      className="w-32 text-sm"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Preço (opcional)"
                      value={newSizePrice}
                      onChange={(e) => setNewSizePrice(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSize}
                      disabled={!selectedNewSizeId}
                    >
                      <IoMdAdd className="w-4 h-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}

              <div className="mb-3">
                <h3 className="font-bold">Parcelamento</h3>
              </div>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="installment_available"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            className="w-5 h-5"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span>Parcelamento disponível</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {installmentAvailable && (
                <div className="mb-5 space-y-3">
                  <FormField
                    control={form.control}
                    name="installment_with_interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              className="w-5 h-5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Com juros</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {installmentWithInterest && (
                    <FormField
                      control={form.control}
                      name="installment_interest_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor do juros (%)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex.: 2.5"
                              type="number"
                              step="0.01"
                              min={0}
                              max={100}
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
                    name="max_installments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máximo de parcelas</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex.: 6"
                            type="number"
                            step="1"
                            min={1}
                            max={36}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Imagens do produto</FormLabel>
                      <FormControl>
                        <Input
                          {...fieldProps}
                          id="images"
                          type="file"
                          accept="image/*, application/pdf"
                          multiple
                          onChange={(event: any) => {
                            onChange(event.target.files);
                            const files = event.target.files;
                            if (files && files.length > 0) {
                              const newPreviews = Array.from(files).map(
                                (file: any) => ({
                                  file,
                                  preview: URL.createObjectURL(
                                    new Blob([file], { type: file.type })
                                  ),
                                })
                              );
                              setFilePreviews([...filePreviews, ...newPreviews]);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="flex flex-row items-center flex-wrap gap-6">
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
                              <div className="flex flex-col items-center">
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
                                    <LuMoveRight
                                      className="cursor-pointer"
                                      onClick={() => handleMoveDown(index)}
                                      size={24}
                                      color="#2c6e49"
                                    />
                                  )}
                                  {index > 0 && (
                                    <LuMoveLeft
                                      className="cursor-pointer"
                                      onClick={() => handleMoveUp(index)}
                                      size={24}
                                      color="#2c6e49"
                                    />
                                  )}
                                </div>
                              </div>
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
                            type="button"
                            onClick={() =>
                              document.getElementById("images")?.click()
                            }
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

              <div>
                <FormLabel>Status</FormLabel>
                <div className="mt-3 space-y-3">
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              className="w-5 h-5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Produto ativo</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              className="w-5 h-5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Produto em destaque</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-10 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/product")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-primary hover:bg-green-primary/90"
              >
                {submitting ? <Loader /> : "Atualizar"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ContentMain>
  );
};

export default ProductEditPage;
