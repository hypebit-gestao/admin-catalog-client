"use client";

import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IoIosAddCircle } from "react-icons/io";
import ContentMain from "@/components/content-main";
import Loader from "@/components/loader";
import { useProductService } from "@/services/product.service";
import { Product as ProductModel } from "@/models/product";
import Image from "next/image";
import * as XLSX from "xlsx";
import {
  MdContentCopy,
  MdDelete,
  MdEdit,
  MdOutlineProductionQuantityLimits,
  MdSearch,
  MdToggleOff,
  MdToggleOn,
  MdDownload,
  MdUpload,
  MdStar,
  MdStarBorder,
} from "react-icons/md";
import ProductDelete from "@/components/product/product-delete";
import useProductDeleteModal from "@/utils/hooks/product/useDeleteProductModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function truncate(str: string, num: number) {
  return str?.length > num ? str.slice(0, num) + "..." : str;
}

const Product = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "product" | "service">("all");
  const [searchName, setSearchName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [stockEditId, setStockEditId] = useState<string | null>(null);
  const [stockEditValue, setStockEditValue] = useState<string>("");
  const router = useRouter();

  const productService = useProductService();
  const categoryService = useCategoryService();
  const productDeleteModal = useProductDeleteModal();

  const fetchProducts = useCallback(async () => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    try {
      const fetched = await productService.GETBYUSERID(
        session.user?.user?.id,
        filterCategory === "all" ? "" : filterCategory,
        session.user.accessToken
      );
      setProducts(fetched ?? []);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.accessToken, filterCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, productDeleteModal.isDelete, refreshKey]);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    categoryService
      .GETALL(session.user.accessToken)
      .then((res) => { if (res) setCategories(res); });
  }, [session?.user?.accessToken]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (filterType !== "all") {
      result = result.filter((p) => (p.type ?? "product") === filterType);
    }
    if (!searchName.trim()) return result;
    const q = searchName.toLowerCase().trim();
    return result.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [products, searchName, filterType]);

  const handleDelete = (id: string | undefined) => {
    useProductDeleteModal.setState({ itemId: id });
    productDeleteModal.onOpen();
  };

  const handleToggleActive = async (product: ProductModel) => {
    const newActive = !product.active;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: newActive } : p))
    );
    try {
      await productService.PUT(
        {
          id: product.id,
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          images: product.images,
          currency: product.currency ?? "brl",
          price: product.price,
          promotion_price: product.promotion_price ?? null,
          user_id: product.user_id,
          featured: product.featured,
          active: newActive,
          archived: product.archived,
          installment_available: product.installment_available,
          installment_with_interest: product.installment_with_interest,
          installment_interest_value: product.installment_interest_value ?? null,
          max_installments: product.max_installments ?? 1,
        },
        session?.user?.accessToken
      );
      toast.success(
        newActive ? "Produto ativado" : "Produto desativado"
      );
    } catch (err: any) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: product.active } : p))
      );
      toast.error(err.message);
    }
  };

  const handleToggleBestSeller = async (product: ProductModel) => {
    const newVal = !product.best_seller;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, best_seller: newVal } : p))
    );
    try {
      await productService.PUT(
        {
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          category_id: product.category_id,
          images: product.images,
          currency: product.currency ?? "brl",
          price: product.price,
          promotion_price: product.promotion_price ?? null,
          user_id: product.user_id,
          featured: product.featured,
          active: product.active,
          archived: product.archived,
          best_seller: newVal,
          installment_available: product.installment_available,
          installment_with_interest: product.installment_with_interest,
          installment_interest_value: product.installment_interest_value ?? null,
          max_installments: product.max_installments ?? 1,
        },
        session?.user?.accessToken
      );
      toast.success(newVal ? "Marcado como mais vendido" : "Removido dos mais vendidos");
    } catch (err: any) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, best_seller: product.best_seller } : p))
      );
      toast.error(err.message);
    }
  };

  const handleExport = () => {
    const rows = filteredProducts.map((p) => ({
      Nome: p.name,
      Descricao: p.description?.replace(/<[^>]+>/g, "") ?? "",
      Categoria: p.category?.name ?? "",
      Preco: p.price,
      PrecoPromocional: p.promotion_price ?? "",
      Destaque: p.featured ? "Sim" : "Não",
      MaisVendido: p.best_seller ? "Sim" : "Não",
      Ativo: p.active ? "Sim" : "Não",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "produtos.xlsx");
    toast.success("Exportado com sucesso");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.accessToken) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(ws);

      let created = 0;
      let skipped = 0;
      for (const row of rows) {
        const name = row["Nome"] ?? row["name"];
        const price = parseFloat(row["Preco"] ?? row["price"] ?? "0");
        if (!name || isNaN(price) || price <= 0) { skipped++; continue; }
        try {
          await productService.POST(
            {
              name: String(name),
              description: String(row["Descricao"] ?? row["description"] ?? ""),
              category_id: null,
              images: null,
              currency: "brl",
              price,
              promotion_price: parseFloat(row["PrecoPromocional"] ?? "0") || null,
              user_id: session.user.user?.id,
              featured: false,
              active: true,
              archived: false,
              installment_available: false,
              installment_with_interest: false,
              installment_interest_value: null,
              max_installments: 1,
            },
            session.user.accessToken
          );
          created++;
        } catch {
          skipped++;
        }
      }
      toast.success(`${created} produto(s) importado(s)${skipped > 0 ? `, ${skipped} ignorado(s)` : ""}`);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Erro ao ler o arquivo");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleDuplicate = async (product: ProductModel) => {
    try {
      await productService.POST(
        {
          name: `${product.name} (cópia)`,
          description: product.description ?? "",
          category_id: product.category_id,
          images: product.images ?? null,
          currency: product.currency ?? "brl",
          price: product.price,
          promotion_price: product.promotion_price ?? null,
          user_id: session?.user?.user?.id,
          featured: product.featured,
          active: product.active,
          archived: false,
          installment_available: product.installment_available,
          installment_with_interest: product.installment_with_interest,
          installment_interest_value: product.installment_interest_value ?? null,
          max_installments: product.max_installments ?? 1,
        },
        session?.user?.accessToken
      );
      toast.success(`${product.name} duplicado`);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleQuickStock = async (product: ProductModel, newQty: number) => {
    const updated = products.map((p) =>
      p.id === product.id ? { ...p, stock_quantity: newQty } : p
    );
    setProducts(updated);
    setStockEditId(null);
    try {
      await productService.UPDATESTOCK(
        product.id!,
        { stock_quantity: newQty },
        session?.user?.accessToken
      );
    } catch {
      setProducts(products);
      toast.error("Erro ao atualizar estoque");
    }
  };

  return (
    <>
      <ProductDelete
        isOpen={productDeleteModal.isOpen}
        onClose={productDeleteModal.onClose}
      />

      <ContentMain
        title="Produtos"
        subtitle={`${filteredProducts.length} item${filteredProducts.length !== 1 ? "s" : ""}${
          searchName
            ? " encontrado" + (filteredProducts.length !== 1 ? "s" : "")
            : " cadastrado" + (filteredProducts.length !== 1 ? "s" : "")
        }`}
      >
        {/* Type filter tabs */}
        <div className="flex gap-2 mb-4">
          {(["all", "product", "service"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                filterType === t
                  ? "bg-green-primary text-white border-green-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-primary/40"
              )}
            >
              {t === "all" ? "Todos" : t === "product" ? "Produtos" : "Serviços"}
            </button>
          ))}
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <MdSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary/50 transition-all"
            />
            {searchName && (
              <button
                onClick={() => setSearchName("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
              >
                ✕
              </button>
            )}
          </div>

          <div className="w-full sm:w-56">
            <Select onValueChange={(value) => setFilterCategory(value)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent className="z-[300]">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category?.id as string}>
                    {category?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            onClick={() => importInputRef.current?.click()}
            variant="outline"
            disabled={importing}
            className="gap-2 flex-shrink-0"
          >
            <MdUpload size={18} />
            {importing ? "Importando…" : "Importar"}
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            disabled={filteredProducts.length === 0}
            className="gap-2 flex-shrink-0"
          >
            <MdDownload size={18} />
            Exportar
          </Button>
          <Button
            onClick={() => router.push("/product/new")}
            className="bg-green-primary hover:bg-green-primary/90 gap-2 sm:ml-auto flex-shrink-0"
          >
            <IoIosAddCircle size={22} />
            Novo Produto
          </Button>
        </div>

        {/* Content */}
        <div className="mb-16">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader color="text-green-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200/80 py-20 flex flex-col items-center text-center shadow-sm">
              <MdOutlineProductionQuantityLimits
                size={52}
                className="text-gray-200 mb-3"
              />
              <p className="font-medium text-gray-500 text-base">
                {searchName
                  ? `Nenhum produto encontrado para "${searchName}"`
                  : "Nenhum produto cadastrado ainda"}
              </p>
              {searchName ? (
                <button
                  onClick={() => setSearchName("")}
                  className="mt-3 text-sm text-green-primary hover:underline"
                >
                  Limpar busca
                </button>
              ) : (
                <button
                  onClick={() => router.push("/product/new")}
                  className="mt-3 text-sm text-green-primary hover:underline"
                >
                  Cadastrar primeiro produto
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product, index) => (
                <div
                  key={index}
                  className="group relative flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-green-primary/20 transition-all duration-200"
                >
                  {/* Image */}
                  <div className="w-full h-[200px] overflow-hidden bg-gray-50">
                    <Image
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      src={
                        product.images?.[0] ??
                        "https://www.pallenz.co.nz/assets/camaleon_cms/image-not-found-4a963b95bf081c3ea02923dceaeb3f8085e1a654fc54840aac61a57a60903fef.png"
                      }
                      alt={product.name ?? ""}
                      width={450}
                      height={200}
                    />
                  </div>

                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {product.type === "service" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                        Serviço
                      </span>
                    )}
                    {product.featured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900">
                        Destaque
                      </span>
                    )}
                    {!product.active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Inativo
                      </span>
                    )}
                    {product.archived && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                        Arquivado
                      </span>
                    )}
                    {product.stock_enabled && (product.stock_quantity ?? 1) <= 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                        Esgotado
                      </span>
                    )}
                    {product.stock_enabled && (product.stock_quantity ?? 1) > 0 && (product.stock_quantity ?? 1) <= 5 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900">
                        Estoque baixo
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-3">
                    <h5 className="font-semibold text-gray-900 truncate text-sm mb-1">
                      {product.name}
                    </h5>
                    <p
                      className="text-xs text-gray-500 leading-relaxed flex-1"
                      dangerouslySetInnerHTML={{
                        __html: truncate(
                          product.description?.replace(/<[^>]+>/g, "") ?? "",
                          70
                        ),
                      }}
                    />

                    {product.stock_enabled && (
                      <div className="mt-2 mb-1">
                        {stockEditId === product.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setStockEditValue((v) => String(Math.max(0, Number(v) - 1)))}
                              className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm font-bold bg-white hover:bg-gray-50"
                            >−</button>
                            <input
                              autoFocus
                              type="number"
                              min={0}
                              value={stockEditValue}
                              onChange={(e) => setStockEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleQuickStock(product, Number(stockEditValue));
                                if (e.key === "Escape") setStockEditId(null);
                              }}
                              className="w-14 text-center text-xs border border-gray-300 rounded px-1 py-1 outline-none focus:border-green-primary"
                            />
                            <button
                              onClick={() => setStockEditValue((v) => String(Number(v) + 1))}
                              className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-sm font-bold bg-white hover:bg-gray-50"
                            >+</button>
                            <button
                              onClick={() => handleQuickStock(product, Number(stockEditValue))}
                              className="text-xs text-white bg-green-primary px-2 py-1 rounded hover:bg-green-primary/90"
                            >OK</button>
                            <button
                              onClick={() => setStockEditId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 px-1"
                            >✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setStockEditId(product.id!); setStockEditValue(product.stock_quantity?.toString() ?? "0"); }}
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                              (product.stock_quantity ?? 1) <= 0
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : (product.stock_quantity ?? 1) <= 5
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-green-primary/10 text-green-primary hover:bg-green-primary/20"
                            }`}
                            title="Clique para editar estoque"
                          >
                            <span>Estoque: {product.stock_quantity ?? 0}</span>
                            <MdEdit size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        {product.price_on_request ? (
                          <p className="font-bold text-blue-500 text-base">A consultar</p>
                        ) : (
                          <>
                            <p className="font-bold text-green-primary text-base">
                              {formatter.format(product.price)}
                            </p>
                            {product.promotion_price &&
                              product.promotion_price > 0 &&
                              product.promotion_price < product.price && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatter.format(product.promotion_price)}
                                </p>
                              )}
                          </>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-1 rounded-md",
                          product.category_id
                            ? "bg-green-primary/10 text-green-primary"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {product.category_id
                          ? product.category?.name
                          : "Sem categoria"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-3 pb-3 flex justify-end gap-1">
                    <button
                      onClick={() => handleToggleBestSeller(product)}
                      className="p-1.5 rounded-lg hover:bg-yellow-50 transition-colors"
                      title={product.best_seller ? "Remover dos mais vendidos" : "Marcar como mais vendido"}
                    >
                      {product.best_seller ? (
                        <MdStar size={20} className="text-yellow-500" />
                      ) : (
                        <MdStarBorder size={20} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleActive(product)}
                      className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      title={product.active ? "Desativar produto" : "Ativar produto"}
                    >
                      {product.active ? (
                        <MdToggleOn size={22} className="text-green-primary" />
                      ) : (
                        <MdToggleOff size={22} className="text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors"
                      title="Duplicar produto"
                    >
                      <MdContentCopy size={18} />
                    </button>
                    <button
                      onClick={() => router.push(`/product/${product.id}/edit`)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors"
                      title="Editar produto"
                    >
                      <MdEdit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                      title="Excluir produto"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentMain>
    </>
  );
};

export default Product;
