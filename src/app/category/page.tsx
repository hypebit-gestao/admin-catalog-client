"use client";

import * as z from "zod";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { IoIosAddCircle } from "react-icons/io";
import { Button } from "@/components/ui/button";
import ContentMain from "@/components/content-main";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-quartz.css";
import { AG_GRID_LOCALE_PT_BR } from "@/utils/locales/ag-grid";
import { RowNode } from "ag-grid-community";
import Loader from "@/components/loader";

import UserRegister from "@/components/user/user-register";

import useCategoryRegisterModal from "@/utils/hooks/category/useRegisterCategoryModal";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import CategoryRegister from "@/components/category/category-register";
import { MdDelete, MdEdit } from "react-icons/md";
import useCategoryUpdateModal from "@/utils/hooks/category/useUpdateCategoryModal";
import CategoryEdit from "@/components/category/category-edit";
import useCategoryDeleteModal from "@/utils/hooks/category/useDeleteCategoryModal";
import CategoryDelete from "@/components/category/category-delete";
import Image from "next/image";

const Category = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [rowData, setRowData] = useState<Category[]>([]);
  const [screenWidth, setScreenWidth] = useState(0);
  const categoryService = useCategoryService();
  const categoryRegisterModal = useCategoryRegisterModal();
  const categoryEditModal = useCategoryUpdateModal();
  const categoryDeleteModal = useCategoryDeleteModal();

  useEffect(() => {
    setLoading(true);
    const getCategories = async () => {
      const fetchedCategory = await categoryService.GETALL(
        session?.user.accessToken
      );
      if (fetchedCategory) {
        setLoading(false);
        setRowData(fetchedCategory as Category[]);
      }
    };

    getCategories();
  }, [
    session?.user?.accessToken,
    categoryRegisterModal.isRegister,
    categoryEditModal.isUpdate,
    categoryDeleteModal.isDelete,
  ]);

  useEffect(() => {
    setScreenWidth(window.innerWidth);
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleDelete = (id: string | undefined) => {
    useCategoryDeleteModal.setState({ itemId: id });
    categoryDeleteModal.onOpen();
  };

  const handleEdit = (id: string | undefined) => {
    categoryEditModal.onOpen();
    useCategoryUpdateModal.setState({ itemId: id });
  };
  const ActionsRenderer = (props: any) => {
    return (
      <div className="flex flex-row justify-center items-center">
        <>
          <button
            className="text-blue-500 hover:text-blue-600 transition-all duration-200 mr-4"
            onClick={() => {
              handleEdit(props.data?.id);
            }}
          >
            <MdEdit className="" size={36} />
          </button>
          <button
            className="text-red-500 hover:text-red-600 transition-all duration-200"
            onClick={() => handleDelete(props.data?.id)}
          >
            <MdDelete className="" size={36} />
          </button>
        </>
      </div>
    );
  };

  const getRowStyle = (params: { node: RowNode }) => {
    if (
      params.node &&
      params.node.rowIndex !== null &&
      params.node.rowIndex !== undefined
    ) {
      if (params.node.rowIndex % 2 === 0) {
        return { background: "#E8E8E8", color: "#000000" };
      } else {
        return { background: "#D9D9D9", color: "#000000" };
      }
    }

    return {};
  };

  const [colDefs, setColDefs] = useState([
    {
      field: "name",
      flex: 1,
      headerName: "Nome",
      filter: true,
      floatingFilter: true,
    },

    {
      field: "actions",
      headerName: "Ações",
      width: 200,
      cellRenderer: ActionsRenderer,
    },
  ]);

  useEffect(() => {
    if (screenWidth < 768) {
      setColDefs([
        {
          field: "name",
          flex: 1,
          headerName: "Nome",
          filter: true,
          floatingFilter: true,
        },
        {
          field: "actions",
          headerName: "Ações",
          width: 200,
          cellRenderer: ActionsRenderer,
        },
      ]);
    } else {
      setColDefs([
        {
          field: "name",
          flex: 1,
          headerName: "Nome",
          filter: true,
          floatingFilter: true,
        },

        {
          field: "actions",
          headerName: "Ações",
          width: 200,
          cellRenderer: ActionsRenderer,
        },
      ]);
    }
  }, [screenWidth]);

  return (
    <>
      <CategoryDelete
        isOpen={categoryDeleteModal.isOpen}
        onClose={categoryDeleteModal.onClose}
      />
      <CategoryEdit
        isOpen={categoryEditModal.isOpen}
        onClose={categoryEditModal.onClose}
      />
      <CategoryRegister
        isOpen={categoryRegisterModal.isOpen}
        onClose={categoryRegisterModal.onClose}
      />
      <ContentMain title="Categorias">
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => categoryRegisterModal.onOpen()}
            className="bg-green-primary hover:bg-green-primary/90 gap-2"
          >
            <IoIosAddCircle size={22} />
            Nova Categoria
          </Button>
        </div>

        <div className="my-6">
          {loading === true ? (
            <Loader color="text-green-primary" />
          ) : (
            <>
              <div className="lg:hidden space-y-3">
                {rowData?.map((category, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="h-[160px] w-full">
                      <Image
                        className="h-full w-full object-cover"
                        src={category.image_url || `https://www.pallenz.co.nz/assets/camaleon_cms/image-not-found-4a963b95bf081c3ea02923dceaeb3f8085e1a654fc54840aac61a57a60903fef.png`}
                        alt={category.name}
                        width={800}
                        height={160}
                      />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <h2 className="font-bold text-base text-green-primary truncate flex-1">
                        {category.name}
                      </h2>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(category && category.id)}
                          className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                          aria-label="Editar categoria"
                        >
                          <MdEdit size={28} />
                        </button>
                        <button
                          onClick={() => handleDelete(category && category.id)}
                          className="text-red-500 hover:text-red-600 transition-colors p-1"
                          aria-label="Excluir categoria"
                        >
                          <MdDelete size={28} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {rowData.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma categoria cadastrada</p>
                )}
              </div>
              <div className="hidden lg:block ag-theme-quartz">
                <AgGridReact
                  rowData={rowData}
                  columnDefs={colDefs as any}
                  getRowStyle={getRowStyle as any}
                  domLayout="autoHeight"
                  pagination={true}
                  paginationPageSizeSelector={[10, 20]}
                  paginationPageSize={10}
                  localeText={AG_GRID_LOCALE_PT_BR}
                />
              </div>
            </>
          )}
        </div>
      </ContentMain>
    </>
  );
};

export default Category;
