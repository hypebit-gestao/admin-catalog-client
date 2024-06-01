"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import ContentMain from "@/components/content-main";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-quartz.css";
import { AG_GRID_LOCALE_PT_BR } from "@/utils/locales/ag-grid";
import { RowNode } from "ag-grid-community";
import Loader from "@/components/loader";

import useCategoryRegisterModal from "@/utils/hooks/category/useRegisterCategoryModal";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import { MdDelete, MdEdit } from "react-icons/md";
import useCategoryDeleteModal from "@/utils/hooks/category/useDeleteCategoryModal";
import { useOrderService } from "@/services/order.service";
import { Order as OrderModel } from "@/models/order";
import OrderEdit from "@/components/order/order-edit";
import useEditOrderModal from "@/utils/hooks/order/useEditOrderModal";
import OrderDelete from "@/components/order/order-delete";
import useOrderDeleteModal from "@/utils/hooks/order/useDeleteOrderModal";
import ExportToExcel from "@/utils/tools/excelExport";

const Order = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [rowData, setRowData] = useState<OrderModel[]>([]);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const categoryService = useCategoryService();
  const orderService = useOrderService();
  const categoryRegisterModal = useCategoryRegisterModal();

  const orderEditModal = useEditOrderModal();
  const orderDeleteModal = useOrderDeleteModal();
  const categoryDeleteModal = useCategoryDeleteModal();

  useEffect(() => {
    setLoading(true);
    const getOrders = async () => {
      const fetchedOrder = await orderService.GETALL(
        session?.user.accessToken,
        session?.user?.user?.id
      );
      if (fetchedOrder) {
        setLoading(false);
        setRowData(fetchedOrder as OrderModel[]);
      }
    };

    getOrders();
  }, [
    session?.user?.accessToken,
    categoryRegisterModal.isRegister,
    orderEditModal.isUpdate,
    orderDeleteModal.isDelete,
    categoryDeleteModal.isDelete,
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
    useOrderDeleteModal.setState({ itemId: id });
    orderDeleteModal.onOpen();
  };

  const handleEdit = (id: string | undefined) => {
    orderEditModal.onOpen();
    useEditOrderModal.setState({ itemId: id });
  };
  const ActionsRenderer = (props: any) => {
    return (
      <div className="flex flex-row justify-center items-center">
        <>
          <button
            className="text-blue-500 hover:text-blue-600 transition-all duration-200 mr-4"
            onClick={() => {
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
        </>
      </div>
    );
  };

  const formatterStatus = (status: string) => {
    switch (status) {
      case "PENDENT":
        return "Pendente";
      case "CANCELLED":
        return "Cancelado";
      case "DELIVERED":
        return "Entregue";
      case "SENT":
        return "Enviado";
      default:
        return "Pendente";
    }
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
      field: "customer_name",
      flex: 1,
      headerName: "Nome do cliente",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "total",
      flex: 1,
      headerName: "Total do pedido",
    },
    {
      field: "status",
      valueFormatter: (params: any) => formatterStatus(params.value),
      flex: 1,
      headerName: "Status do pedido",
    },
    {
      field: "observation",
      flex: 1,
      headerName: "Observação",
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 200,
      cellRenderer: ActionsRenderer,
    },
  ]);

  return (
    <>
      <OrderEdit
        isOpen={orderEditModal.isOpen}
        onClose={orderEditModal.onClose}
      />
      <OrderDelete
        isOpen={orderDeleteModal.isOpen}
        onClose={orderDeleteModal.onClose}
      />

      <ContentMain title="Pedidos">
        <div className="my-10 ">
          {loading === true ? (
            <Loader color="text-green-primary" />
          ) : (
            <>
              {/* <div className="lg:hidden ">
                {rowData?.map((category, index) => (
                  <div
                    key={index}
                    className="card w-auto bg-base-100 shadow-xl"
                  >
                    <div className="h-auto">
                      {category.image_url ? (
                        <Image
                          className="h-full w-full "
                          src={`${category.image_url}`}
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
                      <h2 className="font-bold text-2xl text-green-primary truncate">
                        {category.category?.name}
                      </h2>
                      <p className="text-[#2c6e49]">
                        {category.category?.description}
                      </p>
                      <div className="card-actions justify-between">
                        <div className="flex flex-row items-center">
                          <div
                            onClick={() => handleEdit(category && category.id)}
                            className="mr-3 cursor-pointer"
                          >
                            <MdEdit color="blue" size={32} />
                          </div>
                          <div
                            onClick={() =>
                              handleDelete(category && category.id)
                            }
                            className="cursor-pointer"
                          >
                            <MdDelete color="red" size={32} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div> */}
              <div className=" ag-theme-quartz">
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
                <div>
                  <ExportToExcel
                    currencyColumns={[3]}
                    fileName={"Pedidos"}
                    className="bg-green-primary text-white px-4 py-3 rounded-md mt-4"
                    // icon={
                    //   <Icon.DocumentAttachOutline
                    //     width={"20px"}
                    //     height={"20px"}
                    //     color={"#116d5c"}
                    //   />
                    // }
                    label
                    excelData={rowData.map((item: OrderModel) => {
                      return {
                        "Nome do cliente": item.customer_name,
                        "Status do pedido": formatterStatus(item.status),
                        Observação: item.observation,
                        "Total do pedido": item.total,
                      };
                    })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </ContentMain>
    </>
  );
};

export default Order;
