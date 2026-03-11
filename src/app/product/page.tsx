"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { IoIosAddCircle } from "react-icons/io";
import ContentMain from "@/components/content-main";
import Loader from "@/components/loader";
import { useProductService } from "@/services/product.service";
import { Product as ProductModel } from "@/models/product";
import ProductRegister from "@/components/product/product-register";
import useProductRegisterModal from "@/utils/hooks/product/useRegisterProductModal";
import Image from "next/image";
import { MdDelete, MdEdit, MdOutlineProductionQuantityLimits, MdSearch } from "react-icons/md";
import ProductEdit from "@/components/product/product-edit";
import useEditProductModal from "@/utils/hooks/product/useEditProductModal";
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
  const [searchName, setSearchName] = useState("");

  const productService = useProductService();
  const categoryService = useCategoryService();
  const productRegisterModal = useProductRegisterModal();
  const productEditModal = useEditProductModal();
  const productDeleteModal = useProductDeleteModal();

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setLoading(true);

    const getProducts = async () => {
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
    };

    const getCategories = async () => {
      const fetched = await categoryService.GETALL(session.user.accessToken);
      if (fetched) setCategories(fetched);
    };

    getProducts();
    getCategories();
  }, [
    session?.user?.accessToken,
    productRegisterModal.isRegister,
    productEditModal.isUpdate,
    productDeleteModal.isDelete,
    filterCategory,
  ]);

  const filteredProducts = useMemo(() => {
    if (!searchName.trim()) return products;
    const q = searchName.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [products, searchName]);

  const handleDelete = (id: string | undefined) => {
    useProductDeleteModal.setState({ itemId: id });
    productDeleteModal.onOpen();
  };

  const handleEdit = (id: string | undefined) => {
    useEditProductModal.setState({ itemId: id });
    productEditModal.onOpen();
  };

  return (
    <>
      <ProductDelete isOpen={productDeleteModal.isOpen} onClose={productDeleteModal.onClose} />
      <ProductEdit isOpen={productEditModal.isOpen} onClose={productEditModal.onClose} />
      <ProductRegister isOpen={productRegisterModal.isOpen} onClose={productRegisterModal.onClose} />

      <ContentMain title="Produtos" subtitle={`${filteredProducts.length} produto${filteredProducts.length !== 1 ? "s" : ""}${searchName ? " encontrado" + (filteredProducts.length !== 1 ? "s" : "") : " cadastrado" + (filteredProducts.length !== 1 ? "s" : "")}`}>
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search by name */}
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

          {/* Category filter */}
          <div className="w-full sm:w-56">
            <Select
              onValueChange={(value) => setFilterCategory(value)}
            >
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

          <Button
            onClick={() => productRegisterModal.onOpen()}
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
              <MdOutlineProductionQuantityLimits size={52} className="text-gray-200 mb-3" />
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
                  onClick={() => productRegisterModal.onOpen()}
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
                        product.images?.length > 0
                          ? product.images[0]
                          : "https://www.pallenz.co.nz/assets/camaleon_cms/image-not-found-4a963b95bf081c3ea02923dceaeb3f8085e1a654fc54840aac61a57a60903fef.png"
                      }
                      alt={product.name}
                      width={450}
                      height={200}
                    />
                  </div>

                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
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
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-3">
                    <h5 className="font-semibold text-gray-900 truncate text-sm mb-1">
                      {product.name}
                    </h5>
                    <p className="text-xs text-gray-500 leading-relaxed flex-1">
                      {truncate(product.description, 70)}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-green-primary text-base">
                          {formatter.format(product.price)}
                        </p>
                        {product.promotion_price && product.promotion_price > 0 && product.promotion_price < product.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatter.format(product.promotion_price)}
                          </p>
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
                        {product.category_id ? product.category?.name : "Sem categoria"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-3 pb-3 flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(product.id)}
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
