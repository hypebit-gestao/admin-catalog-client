"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { signOut, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IoIosAddCircle } from "react-icons/io";
import ContentMain from "@/components/content-main";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-quartz.css";
import { AG_GRID_LOCALE_PT_BR } from "@/utils/locales/ag-grid";
import { RowNode } from "ag-grid-community";
import Loader from "@/components/loader";
import { useUserService } from "@/services/user.service";
import { User } from "next-auth";
import UserRegister from "@/components/user/user-register";
import useUserRegisterModal from "@/utils/hooks/user/useRegisterUserModal";
import { useProductService } from "@/services/product.service";
import { Product } from "@/models/product";
import ProductRegister from "@/components/product/product-register";
import useProductRegisterModal from "@/utils/hooks/product/useRegisterProductModal";
import Image from "next/image";

import { MdDelete, MdEdit } from "react-icons/md";
import ProductEdit from "@/components/product/product-edit";
import useEditProductModal from "@/utils/hooks/product/useEditProductModal";
import ProductDelete from "@/components/product/product-delete";
import useProductDeleteModal from "@/utils/hooks/product/useDeleteProductModal";

const Product = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const userService = useUserService();
  const productService = useProductService();
  const productRegisterModal = useProductRegisterModal();
  const productEditModal = useEditProductModal();
  const productDeleteModal = useProductDeleteModal();

  useEffect(() => {
    setLoading(true);
    const getProducts = async () => {
      const fetchedProduct = await productService.GETBYUSERID(
        session?.user?.user?.id,
        session?.user.accessToken
      );
      if (fetchedProduct) {
        setLoading(false);
        setProducts(fetchedProduct);
      }
    };

    getProducts();
  }, [
    session?.user?.accessToken,
    productRegisterModal.isOpen,
    productEditModal.isOpen,
    productDeleteModal.isOpen,
  ]);

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
      <ProductDelete
        isOpen={productDeleteModal.isOpen}
        onClose={productDeleteModal.onClose}
      />

      <ProductEdit
        isOpen={productEditModal.isOpen}
        onClose={productEditModal.onClose}
      />

      <ProductRegister
        isOpen={productRegisterModal.isOpen}
        onClose={productRegisterModal.onClose}
      />
      <ContentMain title="Produtos">
        <div className="flex justify-end">
          <IoIosAddCircle
            onClick={() => productRegisterModal.onOpen()}
            size={44}
            className="text-blue-primary cursor-pointer  hover:opacity-70 transition-all duration-200"
          />
        </div>

        <div className="my-10 ">
          {loading === true ? (
            <Loader color="text-green-primary" />
          ) : (
            <>
              <div className="grid grid-cols-2 2xl:grid-cols-3 gap-y-12">
                {products?.map((product, index) => (
                  <div
                    key={index}
                    className="card w-[350px] bg-base-100 shadow-xl"
                  >
                    <div className="h-[300px]">
                      {product.images ? (
                        <Image
                          className="h-full w-full "
                          src={`${
                            product?.images?.length > 0
                              ? product?.images[0]
                              : ""
                          }`}
                          alt="Shoes"
                          width={1920}
                          height={1080}
                          objectFit="cover"
                        />
                      ) : (
                        <Image
                          className="h-[300px] w-full"
                          src={`https://www.pallenz.co.nz/assets/camaleon_cms/image-not-found-4a963b95bf081c3ea02923dceaeb3f8085e1a654fc54840aac61a57a60903fef.png`}
                          alt="Shoes"
                          width={1920}
                          height={1080}
                          objectFit="cover"
                        />
                      )}
                    </div>
                    <div className="card-body bg-white">
                      <h2 className="font-bold text-2xl text-green-primary">
                        {product.name}
                      </h2>
                      <p className="text-[#2c6e49]">{product.description}</p>
                      <div className="card-actions justify-between">
                        <div className="flex flex-row items-center">
                          <div
                            onClick={() => handleEdit(product && product.id)}
                            className="mr-3 cursor-pointer"
                          >
                            <MdEdit color="blue" size={32} />
                          </div>
                          <div
                            onClick={() => handleDelete(product && product.id)}
                            className="cursor-pointer"
                          >
                            <MdDelete color="red" size={32} />
                          </div>
                        </div>
                        <div className="rounded-xl bg-green-primary text-white p-2">
                          {product.category?.name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ContentMain>
    </>
  );
};

export default Product;
