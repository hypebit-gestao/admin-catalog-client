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
import { MdDelete, MdEdit } from "react-icons/md";
import useUserDeleteModal from "@/utils/hooks/user/useDeleteUserModal";
import useEditUserModal from "@/utils/hooks/user/useEditUserModal";
import UserEdit from "@/components/user/user-edit";
import UserDelete from "@/components/user/user-delete";

const formSchema = z.object({
  name: z.string().min(1, "O campo Nome é obrigatório"),
  cpf_cnpj: z.string().min(1, "O campo CPF/CNPJ é obrigatório"),
  email: z.string().email("E-mail inválido"),
  username: z.string().min(1, "O campo Nome de usuário é obrigatório"),
  password: z.string().min(1, "O campo Senha é obrigatório"),
  address_id: z.string().min(1, "O campo Endereço é obrigatório"),
  phone: z.string().min(1, "O campo Telefone é obrigatório"),
  image_url: z.any(),
  cep: z.string().min(1, "CEP é obrigatório"),
  street: z.string().min(1, "Logradouro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  district: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatório"),
  state: z.string().min(1, "Estado é obrigatório"),
  complement: z.string(),
});

const User = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [rowData, setRowData] = useState<User[]>([]);
  const userService = useUserService();
  const userRegisterModal = useUserRegisterModal();
  const userDeleteModal = useUserDeleteModal()
  const userEditModal = useEditUserModal()

  useEffect(() => {
    setLoading(true);
    const getUsers = async () => {
      const fetchedUser = await userService.GETALL(session?.user.accessToken);
      if (fetchedUser) {
        setLoading(false);
        setRowData(fetchedUser as User[]);
      }
    };

    getUsers();
  }, [session?.user?.accessToken, userRegisterModal.isOpen, userEditModal.isOpen, userDeleteModal.isOpen]);

  const handleDelete = (id: string) => {
    useUserDeleteModal.setState({ itemId: id });
    userDeleteModal.onOpen();
  };

  const handleEdit = (id: string) => {
    useEditUserModal.setState({ itemId: id });
    userEditModal.onOpen();

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
      field: "cpf_cnpj",
      flex: 1,
      headerName: "CPF/CNPJ",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "email",
      flex: 1,
      headerName: "E-mail",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "phone",
      flex: 1,
      headerName: "Telefone",
      filter: true,
      floatingFilter: true,
    },
    {
      field: "status",
      flex: 1,
      headerName: "Status",
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
    <UserDelete
      isOpen={userDeleteModal.isOpen}
      onClose={userDeleteModal.onClose}
    />
    <UserEdit
      isOpen={userEditModal.isOpen}
      onClose={userEditModal.onClose}
    />
      <UserRegister
        isOpen={userRegisterModal.isOpen}
        onClose={userRegisterModal.onClose}
      />
      <ContentMain title="Lojas">
        <div className="flex justify-end">
          <IoIosAddCircle
            onClick={() => userRegisterModal.onOpen()}
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

export default User;
