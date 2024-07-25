"use client";

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

import { MdDelete, MdEdit } from "react-icons/md";
import { useSizeService } from "@/services/size.service";
import { Attribute as AttributeModel } from "@/models/attribute";
import useSizeRegisterModal from "@/utils/hooks/size/useRegisterSizeModal";
import useSizeUpdateModal from "@/utils/hooks/size/useUpdateSizeModal";
import useSizeDeleteModal from "@/utils/hooks/size/useDeleteSizeModal";
import SizeDelete from "@/components/size/size-delete";
import SizeEdit from "@/components/size/size-edit";
import SizeRegister from "@/components/size/size-register";
import useAttributeRegisterModal from "@/utils/hooks/attribute/useRegisterAttributeModal";
import useAttributeUpdateModal from "@/utils/hooks/attribute/useUpdateAttributeModal";
import useAttributeDeleteModal from "@/utils/hooks/attribute/useDeleteAttributeModal";
import AttributeRegister from "@/components/attribute/attribute-register";
import AttributeEdit from "@/components/attribute/attribute-edit";
import AttributeDelete from "@/components/attribute/attribute-delete";
import { useAttributeService } from "@/services/attribute.service";

const Attribute = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [rowData, setRowData] = useState<AttributeModel[]>([]);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const sizeService = useSizeService();
  const attributeService = useAttributeService();
  const sizeRegisterModal = useSizeRegisterModal();
  const sizeEditModal = useSizeUpdateModal();
  const sizeDeleteModal = useSizeDeleteModal();
  const attributeRegisterModal = useAttributeRegisterModal();
  const attributeEditModal = useAttributeUpdateModal();
  const attributeDeleteModal = useAttributeDeleteModal();

  useEffect(() => {
    setLoading(true);
    const getAttributes = async () => {
      const fetchedAttribute = await attributeService.GETALL(session?.user.accessToken);
      if (fetchedAttribute) {
        setLoading(false);
        setRowData(fetchedAttribute as AttributeModel[]);
      }
    };

    getAttributes();
  }, [
    session?.user?.accessToken,
    attributeRegisterModal.isRegister,
    attributeEditModal.isUpdate,
    attributeDeleteModal.isDelete,
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

  const handleDelete = (id: string | undefined) => {
    useAttributeDeleteModal.setState({ itemId: id });
    attributeDeleteModal.onOpen();
  };

  const handleEdit = (id: string | undefined) => {
    attributeEditModal.onOpen();
    useAttributeUpdateModal.setState({ itemId: id });
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
      field: "type",
      flex: 1,
      headerName: "Tipo",
      filter: false,
      floatingFilter: false,
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
          field: "type",
          flex: 1,
          headerName: "Tipo",
          filter: false,
          floatingFilter: false,
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
          field: "type",
          flex: 1,
          headerName: "Tipo",
          filter: false,
          floatingFilter: false,
          
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
      <AttributeDelete
        isOpen={attributeDeleteModal.isOpen}
        onClose={attributeDeleteModal.onClose}
      />
      <AttributeEdit isOpen={attributeEditModal.isOpen} onClose={attributeEditModal.onClose} />
      <AttributeRegister
        isOpen={attributeRegisterModal.isOpen}
        onClose={attributeRegisterModal.onClose}
      />
      <ContentMain title="Atributos">
        <div className="flex justify-end">
          <IoIosAddCircle
            onClick={() => attributeRegisterModal.onOpen()}
            size={44}
            className="text-green-primary cursor-pointer  hover:opacity-70 transition-all duration-200"
          />
        </div>

        <div className="my-10 ">
          {loading === true ? (
            <Loader color="text-green-primary" />
          ) : (
            <>
              <div className="lg:hidden ">
                {rowData?.map((attribute, index) => (
                  <div
                    key={index}
                    className="card w-auto bg-base-100 shadow-xl"
                  >
                    <div className="card-body bg-white">
                      <h2 className="font-bold text-2xl text-green-primary truncate">
                        {attribute.name}
                      </h2>
                      {/* <p className="text-[#2c6e49]">{category?.description}</p> */}
                      <div className="card-actions justify-between">
                        <div className="flex flex-row items-center">
                          <div
                            onClick={() => handleEdit(attribute && attribute.id)}
                            className="mr-3 cursor-pointer"
                          >
                            <MdEdit color="blue" size={32} />
                          </div>
                          <div
                            onClick={() => handleDelete(attribute && attribute.id)}
                            className="cursor-pointer"
                          >
                            <MdDelete color="red" size={32} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

export default Attribute;
