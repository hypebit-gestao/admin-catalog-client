"use client";

import * as z from "zod";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { IoIosAddCircle } from "react-icons/io";
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

const Category = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [rowData, setRowData] = useState<Category[]>([]);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const categoryService = useCategoryService();
  const categoryRegisterModal = useCategoryRegisterModal();
  const categoryEditModal = useCategoryUpdateModal();
  const categoryDeleteModal = useCategoryDeleteModal();

  useEffect(() => {
    setLoading(true);
    const getCategories = async () => {
      const fetchedCategory = await categoryService.GETALL(
        session?.user.accessToken,
        session?.user?.user?.id
      );
      if (fetchedCategory) {
        setLoading(false);
        setRowData(fetchedCategory as Category[]);
      }
    };

    getCategories();
  }, [
    session?.user?.accessToken,
    categoryRegisterModal.isOpen,
    categoryEditModal.isOpen,
    categoryDeleteModal.isOpen,
  ]);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleDelete = (id: string) => {
    useCategoryDeleteModal.setState({ itemId: id });
    categoryDeleteModal.onOpen();
  };

  const handleEdit = (id: string) => {
    categoryEditModal.onOpen();
    useCategoryUpdateModal.setState({ itemId: id });
  };
  const ActionsRenderer = (props: any) => {
    return (
      <div className="flex flex-row justify-center items-center ">
        <button
          className="text-blue-500 hover:text-blue-600 transition-all duration-200 mr-4"
          onClick={() => {
            console.log("Props: ", props.data.id);
            handleEdit(props.data.id);
          }}
        >
          <MdEdit className="" size={36} />
        </button>
        <button
          className="text-red-500 hover:text-red-600 transition-all duration-200"
          onClick={() => handleDelete(props.data.id)}
        >
          <MdDelete className="" size={36} />
        </button>
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
      field: "description",
      flex: 1,
      headerName: "Descrição",
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
          field: "description",
          flex: 1,
          headerName: "Descrição",
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
        <div className="flex justify-end">
          <IoIosAddCircle
            onClick={() => categoryRegisterModal.onOpen()}
            size={44}
            className="text-green-primary cursor-pointer  hover:opacity-70 transition-all duration-200"
          />
        </div>

        <div className="my-10 ">
          {loading === true ? (
            <Loader color="text-green-primary" />
          ) : (
            <div className="ag-theme-quartz">
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
          )}
        </div>
      </ContentMain>
    </>
  );
};

export default Category;
