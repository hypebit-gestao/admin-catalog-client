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

import { Button } from "@/components/ui/button";
import useShippingRegisterModal from "@/utils/hooks/shipping/useRegisterShippingModal";
import ShippingRegister from "@/components/shipping/shipping-register";
import usePersonalizationStoreModal from "@/utils/hooks/pesonalization-store/usePersonalizationStoreModal";
import PersonalizationStore from "@/components/personalization_store/personalization-store";

const Configurations = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const shippingModal = useShippingRegisterModal();
  const personalizationStoreModal = usePersonalizationStoreModal();

  return (
    <>
      <ShippingRegister
        isOpen={shippingModal.isOpen}
        onClose={shippingModal.onClose}
      />
      <PersonalizationStore
        isOpen={personalizationStoreModal.isOpen}
        onClose={personalizationStoreModal.onClose}
      />
      <ContentMain title="Configurações da Loja">
        <div className="h-[96%]  flex items-center justify-center">
          <div className="flex flex-col w-full items-center">
            <div className="mb-8 w-full flex justify-center">
              <Button
                onClick={() => shippingModal.onOpen()}
                size="xl"
                className="w-1/2"
                type="submit"
              >
                <h1 className="text-xl">Entrega</h1>
              </Button>
            </div>
            <div className="w-full flex justify-center">
              <Button
                onClick={() => personalizationStoreModal.onOpen()}
                size="xl"
                className="w-1/2"
                type="submit"
              >
                <h1 className="text-xl">Personalização da loja</h1>
              </Button>
            </div>
          </div>
        </div>
      </ContentMain>
    </>
  );
};

export default Configurations;
