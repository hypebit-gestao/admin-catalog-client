"use client";

import React, { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useUploadService } from "@/services/upload.service";
import { useProductService } from "@/services/product.service";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams, useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { IoMdAdd } from "react-icons/io";
import { useSizeService } from "@/services/size.service";
import { Size } from "@/models/size";
import { useProductSizeService } from "@/services/productSize.service";
import { TbTrash, TbPencil, TbX } from "react-icons/tb";
import { FaSave } from "react-icons/fa";
import { Product } from "@/models/product";
import ContentMain from "@/components/content-main";
import Loader from "@/components/loader";
import { ImageDropzone, ImagePreviewItem } from "@/components/image-dropzone";
import { VideoDropzone, VideoPreviewItem } from "@/components/video-dropzone";
import { RichTextEditor } from "@/components/rich-text-editor";
import { FormSkeleton } from "@/components/ui/skeleton";
import { useUnsavedChanges } from "@/utils/hooks/useUnsavedChanges";
import { useProductVolumePriceService, VolumePrice } from "@/services/productVolumePrice.service";
import { cn } from "@/lib/utils";

function CreateInlineSize({ token, userId, onCreated }: {
  token?: string;
  userId?: string;
  onCreated: (size: Size) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const sizeService = useSizeService();

  const handleCreate = async () => {
    if (!value.trim() || !token || !userId) return;
    setLoading(true);
    try {
      const created = await sizeService.POST({ size: value.trim(), user_id: userId }, token);
      if (created) {
        onCreated(created as Size);
        setValue("");
        setOpen(false);
        toast.success(`Variação "${value.trim()}" criada`);
      }
    } catch {
      toast.error("Erro ao criar variação");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
      >
        <IoMdAdd className="w-3.5 h-3.5" />
        Criar nova opção que ainda não existe na lista
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border rounded-md p-2 bg-green-50">
      <Input
        autoFocus
        placeholder="Nome da nova variação (Ex: 500g, GG, Menta...)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
          if (e.key === "Escape") { setOpen(false); setValue(""); }
        }}
        className="flex-1 text-sm"
      />
      <Button
        type="button"
        size="sm"
        onClick={handleCreate}
        disabled={!value.trim() || loading}
        className="bg-green-primary hover:bg-green-primary/90 text-white"
      >
        {loading ? "..." : "Criar"}
      </Button>
      <button
        type="button"
        onClick={() => { setOpen(false); setValue(""); }}
        className="text-gray-400 hover:text-gray-600"
      >
        <TbX className="w-4 h-4" />
      </button>
    </div>
  );
}

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
    isPromotion: z.boolean(),
    isSize: z.boolean(),
    isAttribute: z.boolean(),
    promotion_price: z.string(),
    user_id: z.string(),
    unit: z.string().optional(),
    type: z.enum(["product", "service"]),
    price_on_request: z.boolean(),
  })
  .refine(
    (data) =>
      data.price_on_request ||
      (data.promotion_price !== null &&
        Number(data.promotion_price) <= Number(data.price)),
    {
      message: "O preço promocional não pode ser maior que o preço normal",
      path: ["promotion_price"],
    }
  )
  .refine(
    (data) => data.price_on_request || Number(data.price) >= Number(data.promotion_price),
    {
      message: "O preço normal não pode ser menor que o preço promocional",
      path: ["price"],
    }
  );

type SizeListItem = {
  productSizeId?: string;
  sizeId: string;
  sizeName: string;
  price: string;
  groupName: string;
  imageIndex: number | null;
};

type TabKey = "basic" | "media" | "sizes" | "advanced";

const TAB_LABELS: Record<TabKey, string> = {
  basic: "Básico",
  media: "Mídia",
  sizes: "Variações",
  advanced: "Avançado",
};

const ProductEditPage = () => {
  const { data: session } = useSession();
  const params = useParams()!;
  const productId = params.id as string;
  const router = useRouter();

  const productService = useProductService();
  const categoryService = useCategoryService();
  const sizeService = useSizeService();
  const productSizeService = useProductSizeService();
  const uploadService = useUploadService();
  const volumePriceService = useProductVolumePriceService();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product>();
  const [sizes, setSizes] = useState<Size[]>([]);
  const [filePreviews, setFilePreviews] = useState<ImagePreviewItem[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreviewItem[]>([]);
  const [sizeList, setSizeList] = useState<SizeListItem[]>([]);
  const [selectedNewSizeId, setSelectedNewSizeId] = useState<string>("");
  const [newSizePrice, setNewSizePrice] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingGroupValue, setEditingGroupValue] = useState<string>("");
  const [volumePrices, setVolumePrices] = useState<VolumePrice[]>([]);
  const [hasVolumePrice, setHasVolumePrice] = useState(false);
  const [newVpMinQty, setNewVpMinQty] = useState("");
  const [newVpUnitPrice, setNewVpUnitPrice] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'absolute'>('percentage');
  const [discountMaxValue, setDiscountMaxValue] = useState("");
  const [stockEnabled, setStockEnabled] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [outOfStockBehavior, setOutOfStockBehavior] = useState<'show_unavailable' | 'hide'>('show_unavailable');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      size_ids: [],
      attribute_ids: [],
      images: "",
      currency: "",
      featured: false,
      active: true,
      price: "",
      isPromotion: false,
      isSize: false,
      isAttribute: false,
      promotion_price: "",
      user_id: session?.user?.user?.name ?? "",
      unit: "",
      type: "product",
      price_on_request: false,
    },
  });

  const { setValue, watch, formState: { errors } } = form;
  const { confirmLeave } = useUnsavedChanges(form.formState.isDirty);

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
  const priceOnRequest = watch("price_on_request");
  const productType = watch("type");
  const watchedPrice = watch("price");
  const watchedPromoPrice = watch("promotion_price");

  const discountPercent =
    isPromotion && Number(watchedPrice) > 0 && Number(watchedPromoPrice) > 0
      ? Math.round((1 - Number(watchedPromoPrice) / Number(watchedPrice)) * 100)
      : null;

  const handleTabOnError = () => {
    const errs = form.formState.errors;
    if (errs.name || errs.price || errs.category_id) setActiveTab("basic");
  };

  // Group sizeList by groupName for display
  const groupedSizeList = sizeList.reduce<Record<string, SizeListItem[]>>(
    (acc, item) => {
      const key = item.groupName || "";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {}
  );

  const uniqueGroupNames = Array.from(new Set(sizeList.map((s) => s.groupName).filter(Boolean)));

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
          setCustomValue("promotion_price", fetchedProduct.promotion_price?.toString() ?? "0");
          setCustomValue("isPromotion", Number(fetchedProduct.promotion_price) > 0);
          setCustomValue("user_id", fetchedProduct.user_id);
          setCustomValue("unit", fetchedProduct.unit ?? "");
          setCustomValue("type", (fetchedProduct.type as "product" | "service") ?? "product");
          setCustomValue("price_on_request", Boolean(fetchedProduct.price_on_request));
          setDiscountEnabled(Boolean(fetchedProduct.discount_enabled));
          setDiscountType((fetchedProduct.max_discount_type as 'percentage' | 'absolute') ?? 'percentage');
          setDiscountMaxValue(fetchedProduct.max_discount_value?.toString() ?? "");
          setStockEnabled(Boolean(fetchedProduct.stock_enabled));
          setStockQuantity(fetchedProduct.stock_quantity?.toString() ?? "");
          setOutOfStockBehavior((fetchedProduct.out_of_stock_behavior as 'show_unavailable' | 'hide') ?? 'show_unavailable');
          setTags(Array.isArray(fetchedProduct.tags) ? fetchedProduct.tags : []);

          if (fetchedProduct.images) {
            setFilePreviews(fetchedProduct.images as ImagePreviewItem[]);
          }

          if (fetchedProduct.videos) {
            setVideoPreviews(
              fetchedProduct.videos.map((v: any) =>
                typeof v === "string"
                  ? { url: v, orientation: "horizontal" as const }
                  : v
              ) as VideoPreviewItem[]
            );
          }

          if (fetchedProduct.product_size && fetchedProduct.product_size.length > 0) {
            setSizeList(
              fetchedProduct.product_size.map((ps) => ({
                productSizeId: ps.id,
                sizeId: ps.size.id,
                sizeName: ps.size.size,
                price: ps.price?.toString() ?? "",
                groupName: ps.group_name ?? "",
                imageIndex: ps.image_index ?? null,
              }))
            );
            setCustomValue("isSize", true);
          }

          if (fetchedProduct.volume_prices && fetchedProduct.volume_prices.length > 0) {
            setVolumePrices(fetchedProduct.volume_prices);
            setHasVolumePrice(true);
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

  const handleAddImages = (files: File[]) => {
    const newItems: ImagePreviewItem[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFilePreviews((prev) => [...prev, ...newItems]);
  };

  const handleDeleteFile = (index: number) => {
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveLeft = (index: number) => {
    setFilePreviews((prev) => {
      const updated = [...prev];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      return updated;
    });
  };

  const handleMoveRight = (index: number) => {
    setFilePreviews((prev) => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
  };

  const handleAddVideos = (files: File[]) => {
    const newItems: VideoPreviewItem[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      orientation: "horizontal" as const,
    }));
    setVideoPreviews((prev) => [...prev, ...newItems]);
  };

  const handleDeleteVideo = (index: number) => {
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeVideoOrientation = (index: number, orientation: "horizontal" | "vertical") => {
    setVideoPreviews((prev) =>
      prev.map((item, i) => (i === index ? { ...item, orientation } : item))
    );
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
          group_name: item.groupName || null,
          image_index: item.imageIndex,
        },
        session?.user?.accessToken
      );
      toast.success("Variação atualizada");
    } catch {
      toast.error("Erro ao atualizar variação");
    }
  };

  const handleRemoveSize = async (index: number) => {
    const item = sizeList[index];
    try {
      if (item.productSizeId) {
        await productSizeService.DELETE(item.productSizeId, session?.user?.accessToken);
      }
      setSizeList(sizeList.filter((_, i) => i !== index));
      toast.success("Variação removida");
    } catch {
      toast.error("Erro ao remover variação");
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
          group_name: newGroupName.trim() || null,
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
          groupName: newGroupName.trim(),
          imageIndex: null,
        },
      ]);
      setSelectedNewSizeId("");
      setNewSizePrice("");
      toast.success("Variação adicionada");
    } catch {
      toast.error("Erro ao adicionar variação");
    }
  };

  const handleRenameGroup = async (originalName: string) => {
    const newName = editingGroupValue.trim();
    const itemsToUpdate = sizeList.filter((s) => s.groupName === originalName);
    try {
      await Promise.all(
        itemsToUpdate
          .filter((item) => item.productSizeId)
          .map((item) =>
            productSizeService.PUT(
              {
                id: item.productSizeId!,
                product_id: product?.id,
                size_id: item.sizeId,
                price: item.price ? Number(item.price) : null,
                group_name: newName || null,
              },
              session?.user?.accessToken
            )
          )
      );
      setSizeList((prev) =>
        prev.map((item) =>
          item.groupName === originalName ? { ...item, groupName: newName } : item
        )
      );
      setEditingGroup(null);
      toast.success("Grupo renomeado");
    } catch {
      toast.error("Erro ao renomear grupo");
    }
  };

  const handleAddVolumePrice = async () => {
    const minQty = parseInt(newVpMinQty);
    const unitPrice = parseFloat(newVpUnitPrice);
    if (!product?.id || isNaN(minQty) || minQty < 1 || isNaN(unitPrice) || unitPrice < 0) return;
    if (volumePrices.some((vp) => vp.min_quantity === minQty)) {
      toast.error("Já existe uma faixa com essa quantidade mínima");
      return;
    }
    try {
      const created = await volumePriceService.POST(
        { product_id: product.id, min_quantity: minQty, unit_price: unitPrice },
        session?.user?.accessToken
      );
      setVolumePrices((prev) => [...prev, created].sort((a, b) => a.min_quantity - b.min_quantity));
      setNewVpMinQty("");
      setNewVpUnitPrice("");
      toast.success("Faixa de desconto adicionada");
    } catch {
      toast.error("Erro ao adicionar faixa de desconto");
    }
  };

  const handleDeleteVolumePrice = async (id: string) => {
    try {
      await volumePriceService.DELETE(id, session?.user?.accessToken);
      setVolumePrices((prev) => prev.filter((vp) => vp.id !== id));
      toast.success("Faixa removida");
    } catch {
      toast.error("Erro ao remover faixa");
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

      const resolvedVideos: { url: string; orientation: "horizontal" | "vertical" }[] = [];
      for (const item of videoPreviews) {
        if ("url" in item) {
          resolvedVideos.push({ url: item.url, orientation: item.orientation });
        } else if (item.file) {
          const res: any = await uploadService.POST({
            file: item.file,
            folderName: session?.user?.user?.name,
          });
          if (Array.isArray(res) && res.length > 0) {
            resolvedVideos.push({ url: res[0].imageUrl, orientation: item.orientation });
          }
        }
      }

      await productService.PUT(
        {
          id: product?.id,
          name: data.name,
          description: data.description,
          category_id: data.category_id !== "" ? data.category_id : null,
          tags: tags.length > 0 ? tags : null,
          images: data.images,
          currency: data.currency,
          price: data.price_on_request ? 0 : Number(data.price),
          promotion_price: data.isPromotion ? Number(data.promotion_price) : null,
          user_id: session?.user?.user?.id,
          featured: data.featured,
          active: data.active,
          max_installments: 1,
          installment_available: false,
          installment_with_interest: false,
          installment_interest_value: null,
          unit: data.unit || null,
          variation_label: null,
          type: data.type,
          price_on_request: data.price_on_request,
          videos: resolvedVideos.length > 0 ? resolvedVideos : [],
          discount_enabled: discountEnabled,
          max_discount_type: discountEnabled ? discountType : 'percentage',
          max_discount_value: discountEnabled && discountMaxValue ? Number(discountMaxValue) : null,
          stock_enabled: stockEnabled,
          stock_quantity: stockEnabled && stockQuantity !== "" ? Number(stockQuantity) : null,
          out_of_stock_behavior: outOfStockBehavior,
        },
        session?.user?.accessToken
      );

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
        <FormSkeleton rows={7} />
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
          <form
            onSubmit={(e) => {
              form.handleSubmit(onUpdate)(e);
              setTimeout(() => {
                if (Object.keys(form.formState.errors).length > 0) handleTabOnError();
              }, 0);
            }}
            className="w-full"
          >
            {/* Tab header */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
              {(["basic", "media", "sizes", "advanced"] as const).map((tab) => {
                const hasError =
                  tab === "basic" && (!!errors.name || !!errors.price);
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-1.5 flex-shrink-0",
                      activeTab === tab
                        ? "border-green-primary text-green-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {TAB_LABELS[tab]}
                    {hasError && (
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── TAB: Básico ── */}
            <div className={activeTab === "basic" ? "" : "hidden"}>
              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-primary">Tipo</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                        >
                          <option value="product">Produto</option>
                          <option value="service">Serviço</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-primary">Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Insira o nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-5">
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

              <div className="mb-5">
                <label className="text-sm font-medium">Tags</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5 min-h-[38px] p-2 border rounded-md bg-background">
                  {tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {tag}
                      <button type="button" onClick={() => setTags((prev) => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500 leading-none">&times;</button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                        e.preventDefault();
                        const t = tagInput.trim().replace(/,$/, "");
                        if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
                        setTagInput("");
                      } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                        setTags((prev) => prev.slice(0, -1));
                      }
                    }}
                    placeholder={tags.length === 0 ? "Digite e pressione Enter para adicionar" : ""}
                    className="flex-1 min-w-[160px] outline-none bg-transparent text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Ex: Masculino, Árabe, Floral — use Enter ou vírgula para confirmar.</p>
              </div>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="price_on_request"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            className="w-5 h-5"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="font-medium">Preço a consultar</span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-400 mt-1">
                        Quando marcado, o catálogo exibirá &quot;A consultar&quot; no lugar do preço.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!priceOnRequest && (
                <>
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <FormField
                        control={form.control}
                        name="isPromotion"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  className="w-5 h-5"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <span className="font-bold text-sm">Possui preço promocional?</span>
                              </label>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-5 mb-2">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-primary">Preço</FormLabel>
                            <FormControl>
                              <InputCurrency placeholder="Preço do produto" type="number" {...field} />
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
                              <FormLabel className="text-blue-primary">Preço Promocional</FormLabel>
                              <FormControl>
                                <InputCurrency placeholder="Preço Promocional" type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  {discountPercent !== null && discountPercent > 0 && (
                    <p className="text-xs text-emerald-600 font-medium mb-5">
                      → {discountPercent}% de desconto
                    </p>
                  )}
                </>
              )}

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de venda</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                        >
                          <option value="">Por unidade (padrão)</option>
                          <option value="kg">Por kg — cliente digita a quantidade em gramas</option>
                          <option value="100g">Por 100g — cliente digita a quantidade em gramas</option>
                          <option value="L">Por litro — cliente digita a quantidade em ml</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Descrição do produto"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── TAB: Mídia ── */}
            <div className={activeTab === "media" ? "" : "hidden"}>
              <div className="mb-5">
                <FormItem>
                  <FormLabel>Imagens do {productType === "service" ? "serviço" : "produto"}</FormLabel>
                  <ImageDropzone
                    id="product-images"
                    previews={filePreviews}
                    onAdd={handleAddImages}
                    onDelete={handleDeleteFile}
                    onMoveLeft={handleMoveLeft}
                    onMoveRight={handleMoveRight}
                  />
                </FormItem>
              </div>

              <div className="mb-5">
                <FormLabel>Vídeos</FormLabel>
                <p className="text-xs text-gray-400 mt-1 mb-2">
                  Adicione vídeos que serão exibidos na galeria do produto (MP4, MOV, WEBM).
                </p>
                <VideoDropzone
                  previews={videoPreviews}
                  onAdd={handleAddVideos}
                  onDelete={handleDeleteVideo}
                  onChangeOrientation={handleChangeVideoOrientation}
                />
              </div>
            </div>

            {/* ── TAB: Variações ── */}
            <div className={activeTab === "sizes" ? "" : "hidden"}>
              <div className="mb-3">
                <h3 className="font-bold">Variações do produto</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Use para oferecer opções ao cliente: tamanho (P, M, G), peso (250g, 500g), sabor (morango, chocolate), cor, etc.
                </p>
              </div>

              <div className="mb-5">
                <FormField
                  control={form.control}
                  name="isSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <Checkbox
                            className="w-5 h-5"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <span className="font-medium">Sim, este produto tem variações</span>
                        </label>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {isSize && (
                <div className="mb-6">
                  {Object.keys(groupedSizeList).length > 0 && (
                    <div className="mb-4 flex flex-col gap-4">
                      {Object.entries(groupedSizeList).map(([groupName, items]) => (
                        <div key={groupName}>
                          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded mb-2">
                            {editingGroup === groupName ? (
                              <>
                                <input
                                  autoFocus
                                  value={editingGroupValue}
                                  onChange={(e) => setEditingGroupValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameGroup(groupName);
                                    if (e.key === "Escape") setEditingGroup(null);
                                  }}
                                  placeholder="Nome do grupo"
                                  className="flex-1 text-sm font-semibold bg-white border border-gray-300 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-gray-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRenameGroup(groupName)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <FaSave className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingGroup(null)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <TbX className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-sm font-semibold text-gray-700">
                                  {groupName || "Sem grupo"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGroup(groupName);
                                    setEditingGroupValue(groupName);
                                  }}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <TbPencil className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 pl-2">
                            {items.map((item) => {
                              const index = sizeList.findIndex(
                                (s) =>
                                  s.sizeId === item.sizeId &&
                                  s.groupName === item.groupName &&
                                  s.productSizeId === item.productSizeId
                              );
                              return (
                                <div
                                  key={`${item.productSizeId ?? item.sizeId}-${item.groupName}`}
                                  className="flex flex-col gap-2 border rounded-md p-2"
                                >
                                  <div className="flex items-center gap-2">
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
                                      onBlur={() => { if (item.productSizeId) handleUpdateSizePrice(index); }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      title="Salvar agora"
                                      onClick={() => handleUpdateSizePrice(index)}
                                      className="text-gray-400"
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
                                  {filePreviews.length > 1 && (
                                    <div>
                                      <p className="text-xs text-gray-400 mb-1">Imagem desta variação:</p>
                                      <div className="flex gap-1.5 flex-wrap">
                                        {filePreviews.map((fp, imgIdx) => {
                                          const src = typeof fp === "string" ? fp : (fp as any).preview ?? (fp as any).url ?? fp;
                                          const isSelected = item.imageIndex === imgIdx;
                                          return (
                                            <button
                                              key={imgIdx}
                                              type="button"
                                              title={`Imagem ${imgIdx + 1}`}
                                              onClick={() => {
                                                const updated = [...sizeList];
                                                updated[index] = {
                                                  ...updated[index],
                                                  imageIndex: isSelected ? null : imgIdx,
                                                };
                                                setSizeList(updated);
                                              }}
                                              className={`w-10 h-10 rounded border-2 overflow-hidden transition-colors ${isSelected ? "border-green-500" : "border-gray-200 hover:border-gray-400"}`}
                                            >
                                              <img
                                                src={src}
                                                alt={`img ${imgIdx + 1}`}
                                                className="w-full h-full object-cover"
                                              />
                                            </button>
                                          );
                                        })}
                                        {item.imageIndex !== null && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...sizeList];
                                              updated[index] = { ...updated[index], imageIndex: null };
                                              setSizeList(updated);
                                            }}
                                            className="text-xs text-gray-400 hover:text-gray-600 px-1"
                                          >
                                            remover
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mb-3">
                    <CreateInlineSize
                      token={session?.user?.accessToken}
                      userId={session?.user?.user?.id}
                      onCreated={(newSize) => {
                        setSizes((prev) => [...prev, newSize]);
                        setSelectedNewSizeId(newSize.id!);
                      }}
                    />
                  </div>

                  <div className="border rounded-md p-3 bg-gray-50 flex flex-col gap-2">
                    <p className="text-xs font-medium text-gray-500">Adicionar opção de variação</p>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Tipo (Ex: Peso, Sabor, Tamanho, Cor) — opcional"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        list="group-suggestions"
                        className="flex-1 text-sm"
                      />
                      <datalist id="group-suggestions">
                        {uniqueGroupNames.map((g) => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                    </div>
                    <div className="flex items-center gap-2">
                      <SelectComponent
                        value={selectedNewSizeId}
                        onValueChange={setSelectedNewSizeId}
                      >
                        <SelectTrigger className="flex-1 text-sm">
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizes
                            .filter(
                              (s) =>
                                !sizeList.some(
                                  (sl) =>
                                    sl.sizeId === s.id &&
                                    sl.groupName === newGroupName.trim()
                                )
                            )
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
                        <IoMdAdd className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── TAB: Avançado ── */}
            <div className={activeTab === "advanced" ? "" : "hidden"}>
              {!priceOnRequest && (
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="font-bold">Desconto por quantidade</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Defina faixas de preço: a partir de X unidades o cliente paga R$ Y por unidade.
                    </p>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        className="w-5 h-5"
                        checked={hasVolumePrice}
                        onCheckedChange={(v) => setHasVolumePrice(Boolean(v))}
                      />
                      <span className="font-medium text-sm">Ativar desconto progressivo</span>
                    </div>
                  </div>

                  {hasVolumePrice && (
                    <div className="border rounded-md p-3 bg-gray-50 flex flex-col gap-3">
                      {volumePrices.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 px-1">
                            <span>A partir de</span>
                            <span>Preço por unidade</span>
                            <span></span>
                          </div>
                          {volumePrices.map((vp) => (
                            <div key={vp.id} className="grid grid-cols-3 gap-2 items-center border rounded bg-white px-2 py-2">
                              <span className="text-sm font-medium">{vp.min_quantity} unid.</span>
                              <span className="text-sm">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(vp.unit_price))}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteVolumePrice(vp.id!)}
                                className="justify-self-end text-red-400 hover:text-red-600"
                              >
                                <TbTrash className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 border-t">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">A partir de (unidades)</label>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            placeholder="Ex: 6"
                            value={newVpMinQty}
                            onChange={(e) => setNewVpMinQty(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">Preço por unidade (R$)</label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="Ex: 25.00"
                            value={newVpUnitPrice}
                            onChange={(e) => setNewVpUnitPrice(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="self-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddVolumePrice}
                            disabled={!newVpMinQty || !newVpUnitPrice}
                          >
                            <IoMdAdd className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!priceOnRequest && (
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="font-bold">Desconto negociável</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Permite que o vendedor ofereça desconto direto no card do produto, até o limite configurado.
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        className="w-5 h-5"
                        checked={discountEnabled}
                        onCheckedChange={(v) => setDiscountEnabled(Boolean(v))}
                      />
                      <span className="font-medium text-sm">Ativar desconto negociável</span>
                    </label>
                  </div>
                  {discountEnabled && (
                    <div className="border rounded-md p-3 bg-gray-50 flex flex-col gap-3">
                      <div className="flex gap-3 items-end">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Tipo de desconto</label>
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'absolute')}
                            className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                          >
                            <option value="percentage">Porcentagem (%)</option>
                            <option value="absolute">Valor fixo (R$)</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">
                            Desconto máximo ({discountType === 'percentage' ? '%' : 'R$'})
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step={discountType === 'percentage' ? 1 : 0.01}
                            max={discountType === 'percentage' ? 100 : undefined}
                            placeholder={discountType === 'percentage' ? "Ex: 15" : "Ex: 10.00"}
                            value={discountMaxValue}
                            onChange={(e) => setDiscountMaxValue(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold mb-1">Controle de estoque</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Quando ativado, o site exibe o produto como esgotado ou o oculta automaticamente.
                </p>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <Checkbox
                    className="w-5 h-5"
                    checked={stockEnabled}
                    onCheckedChange={(v) => setStockEnabled(Boolean(v))}
                  />
                  <span className="font-medium text-sm">Controlar estoque deste produto</span>
                </label>

                {stockEnabled && (
                  <div className="border rounded-md p-4 bg-gray-50 flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Quantidade em estoque
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStockQuantity((q) => String(Math.max(0, Number(q || 0) - 1)))}
                          className="w-8 h-8 rounded-md border border-gray-300 bg-white flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          −
                        </button>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="0"
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(e.target.value)}
                          className="w-24 text-center text-base font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setStockQuantity((q) => String(Number(q || 0) + 1))}
                          className="w-8 h-8 rounded-md border border-gray-300 bg-white flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                        {Number(stockQuantity) === 0 && (
                          <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                            Esgotado
                          </span>
                        )}
                        {Number(stockQuantity) > 0 && Number(stockQuantity) <= 5 && (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                            Estoque baixo
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-2 block">
                        Quando o estoque chegar a zero:
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border border-transparent hover:bg-white hover:border-gray-200 transition-colors">
                          <input
                            type="radio"
                            name="out_of_stock_behavior"
                            value="show_unavailable"
                            checked={outOfStockBehavior === 'show_unavailable'}
                            onChange={() => setOutOfStockBehavior('show_unavailable')}
                            className="mt-0.5 accent-green-600"
                          />
                          <div>
                            <p className="text-sm font-medium">Exibir como esgotado</p>
                            <p className="text-xs text-gray-400">O produto continua visível no site com o botão desabilitado e badge &ldquo;Esgotado&rdquo;.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border border-transparent hover:bg-white hover:border-gray-200 transition-colors">
                          <input
                            type="radio"
                            name="out_of_stock_behavior"
                            value="hide"
                            checked={outOfStockBehavior === 'hide'}
                            onChange={() => setOutOfStockBehavior('hide')}
                            className="mt-0.5 accent-green-600"
                          />
                          <div>
                            <p className="text-sm font-medium">Ocultar do catálogo</p>
                            <p className="text-xs text-gray-400">O produto some automaticamente do site quando o estoque zerar.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
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
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              className="w-5 h-5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Produto ativo</span>
                          </label>
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
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              className="w-5 h-5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                            <span>Produto em destaque</span>
                          </label>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Sticky save bar */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 flex gap-3 mt-8 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] z-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => { if (confirmLeave()) router.push("/product"); }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-primary hover:bg-green-primary/90"
              >
                {submitting ? <Loader /> : "Salvar produto"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ContentMain>
  );
};

export default ProductEditPage;
