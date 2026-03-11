"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { IoIosAddCircle } from "react-icons/io";
import ContentMain from "@/components/content-main";
import { Button } from "@/components/ui/button";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-quartz.css";
import { AG_GRID_LOCALE_PT_BR } from "@/utils/locales/ag-grid";
import { RowNode } from "ag-grid-community";
import Loader from "@/components/loader";
import moment from "moment";

import { MdDelete, MdEdit } from "react-icons/md";
import { useCouponService } from "@/services/coupon.service";
import useCouponRegisterModal from "@/utils/hooks/coupon/useRegisterCouponModal";
import useCouponUpdateModal from "@/utils/hooks/coupon/useUpdateCouponModal";
import useCouponDeleteModal from "@/utils/hooks/coupon/useDeleteCouponModal";
import { Coupon as CouponModel } from "@/models/coupon";
import CouponDelete from "@/components/coupon/coupon-delete";
import CouponEdit from "@/components/coupon/coupon-edit";
import CouponRegister from "@/components/coupon/coupon-register";

const Coupon = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [rowData, setRowData] = useState<CouponModel[]>([]);
  const [screenWidth, setScreenWidth] = useState(0);
  const couponService = useCouponService();
  const couponRegisterModal = useCouponRegisterModal();
  const couponEditModal = useCouponUpdateModal();
  const couponDeleteModal = useCouponDeleteModal();

  useEffect(() => {
    setLoading(true);
    const getCoupons = async () => {
      const fetchedCoupon = await couponService.GETALL(session?.user.accessToken);
      if (fetchedCoupon) {
        setLoading(false);
        setRowData(fetchedCoupon as CouponModel[]);
      }
    };

    getCoupons();
  }, [
    session?.user?.accessToken,
    couponRegisterModal.isRegister,
    couponEditModal.isUpdate,
    couponDeleteModal.isDelete,
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
    useCouponDeleteModal.setState({ itemId: id });
    couponDeleteModal.onOpen();
  };

  const handleEdit = (id: string | undefined) => {
    couponEditModal.onOpen();
    useCouponUpdateModal.setState({ itemId: id });
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
      field: "code",
      flex: 1,
      headerName: "Código do cupom",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "discount",
      flex: 1,
      headerName: "Desconto",
      filter: false,
      floatingFilter: false,
      cellRenderer: (e: RowNode) => {
        return `${e.data.discount}%`;
      }
    },
    {
      field: "stock",
      flex: 1,
      headerName: "Estoque",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "expires_at",
      flex: 1,
      headerName: "Data de Expiração",
      filter: false,
      floatingFilter: false,
    },
    {
      field: "active",
      flex: 1,
      headerName: "Ativo",
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
          field: "code",
          flex: 1,
          headerName: "Código do cupom",
          filter: true,
          floatingFilter: true,
        },
        {
          field: "discount",
          flex: 1,
          headerName: "Desconto",
          filter: false,
          floatingFilter: false,
          cellRenderer: (e: RowNode) => {
            return `${e.data.discount}%`;
          }
        },
        {
          field: "stock",
          flex: 1,
          headerName: "Estoque",
          filter: false,
          floatingFilter: false,
        },
        {
          field: "expires_at",
          flex: 1,
          headerName: "Data de Expiração",
          filter: false,
          floatingFilter: false,
        },
        {
          field: "active",
          flex: 1,
          headerName: "Ativo",
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
          field: "code",
          flex: 1,
          headerName: "Código do cupom",
          filter: true,
          floatingFilter: true,
        },
        {
          field: "discount",
          flex: 1,
          headerName: "Desconto",
          filter: false,
          floatingFilter: false,
          cellRenderer: (e: RowNode) => {
            return `${Number(e.data.discount).toFixed(0)}%`;
          }
        },
        {
          field: "stock",
          flex: 1,
          headerName: "Estoque",
          filter: false,
          floatingFilter: false,
        },
        {
          field: "expires_at",
          flex: 1,
          headerName: "Data de Expiração",
          filter: false,
          floatingFilter: false,
          cellRenderer: (e: RowNode)  => {
            return moment(e.data.expires_at).format("DD/MM/YYYY HH:mm");
          }
        },
        {
          field: "active",
          flex: 1,
          headerName: "Ativo",
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
    <CouponDelete 
      isOpen={couponDeleteModal.isOpen}
      onClose={couponDeleteModal.onClose}
    />
    <CouponEdit
      isOpen={couponEditModal.isOpen}
      onClose={couponEditModal.onClose}
    />
    <CouponRegister
      isOpen={couponRegisterModal.isOpen}
      onClose={couponRegisterModal.onClose}
    />
      <ContentMain title="Cupons de Desconto">
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => couponRegisterModal.onOpen()}
            className="bg-green-primary hover:bg-green-primary/90 gap-2"
          >
            <IoIosAddCircle size={22} />
            Novo Cupom
          </Button>
        </div>

        <div className="my-10 ">
          {loading === true ? (
            <Loader color="text-green-primary" />
          ) : (
            <>
              <div className="lg:hidden space-y-3">
                {rowData?.map((coupon, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg text-green-primary truncate">
                          {coupon.code}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                          <span>Desconto: <strong>{Number(coupon.discount).toFixed(0)}%</strong></span>
                          <span>·</span>
                          <span>Estoque: <strong>{coupon.stock}</strong></span>
                        </div>
                        {coupon.expires_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expira: {moment(coupon.expires_at).format("DD/MM/YYYY HH:mm")}
                          </p>
                        )}
                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${coupon.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          {coupon.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(coupon && coupon.id)}
                          className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                          aria-label="Editar cupom"
                        >
                          <MdEdit size={28} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon && coupon.id)}
                          className="text-red-500 hover:text-red-600 transition-colors p-1"
                          aria-label="Excluir cupom"
                        >
                          <MdDelete size={28} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {rowData.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum cupom cadastrado</p>
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

export default Coupon;
