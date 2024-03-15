"use client";

import { signOut, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import ContentMain from "@/components/content-main";
import { useCategoryService } from "@/services/category.service";
import { useProductService } from "@/services/product.service";
import Loader from "@/components/loader";

const Home = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [countProducts, setCountProducts] = useState(0);
  const [countCategories, setCountCategories] = useState<number | undefined>(0);
  const categoryService = useCategoryService();
  const productService = useProductService();

  useEffect(() => {
    setLoading(true);
    const getCountProducts = async () => {
      const productsCount = await productService.COUNTPRODUCTS(
        session?.user?.user?.id,
        session?.user.accessToken
      );
      if (productsCount) {
        setLoading(false);
        setCountProducts(productsCount);
      }
    };

    const getCountCategories = async () => {
      await categoryService
        .COUNTCATEGORIES(session?.user.accessToken)
        .then((res) => {
          console.log("RES: ", res);
        });
    };

    getCountProducts();
    getCountCategories();
  }, [session?.user?.accessToken]);

  // console.log("CountCat: ", countCategories);

  return (
    <ContentMain title="Home">
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-y-8 lg:gap-64 mt-12">
        <div className="bg-green-primary p-4 rounded-lg flex flex-col justify-center items-center ">
          {loading ? (
            <Loader />
          ) : (
            <>
              <h1 className="text-white text-xl">Produtos </h1>
              {/* <h3 className="text-white text-2xl mt-5">{countProducts}</h3> */}
            </>
          )}
        </div>
        {/* <div className="bg-green-primary p-4 rounded-lg flex flex-col justify-center items-center ">
          <h1 className="text-white text-xl">Pedidos </h1>
          <h3 className="text-white text-2xl mt-5">4</h3>
        </div> */}
        <div className="bg-green-primary p-4 rounded-lg flex flex-col justify-center items-center ">
          {loading ? (
            <Loader />
          ) : (
            <>
              <h1 className="text-white text-xl">Categorias </h1>
              {/* <h3 className="text-white text-2xl mt-5">{countCategories}</h3> */}
            </>
          )}
        </div>
      </div>
    </ContentMain>
  );
};

export default Home;
