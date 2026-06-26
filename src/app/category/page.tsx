"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoIosAddCircle } from "react-icons/io";
import { Button } from "@/components/ui/button";
import ContentMain from "@/components/content-main";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-quartz.css";
import { AG_GRID_LOCALE_PT_BR } from "@/utils/locales/ag-grid";
import { RowNode } from "ag-grid-community";
import Loader from "@/components/loader";
import { useCategoryService } from "@/services/category.service";
import { Category } from "@/models/category";
import { MdDelete, MdEdit, MdSearch, MdDragIndicator } from "react-icons/md";
import { RxDragHandleDots2 } from "react-icons/rx";
import useCategoryDeleteModal from "@/utils/hooks/category/useDeleteCategoryModal";
import CategoryDelete from "@/components/category/category-delete";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CategoryPage = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data: session } = useSession();
  const [rowData, setRowData] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<Category[]>([]);
  const [hasReorderChanges, setHasReorderChanges] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const categoryService = useCategoryService();
  const categoryDeleteModal = useCategoryDeleteModal();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    categoryService
      .GETALL(session.user.accessToken)
      .then((res) => { if (res) setRowData(res as Category[]); })
      .finally(() => setLoading(false));
  }, [session?.user?.accessToken, categoryDeleteModal.isDelete]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rowData;
    const q = search.toLowerCase();
    return rowData.filter((c) => c.name?.toLowerCase().includes(q));
  }, [rowData, search]);

  const handleDelete = (id: string | undefined) => {
    useCategoryDeleteModal.setState({ itemId: id });
    categoryDeleteModal.onOpen();
  };

  const enterReorderMode = () => {
    setReorderList([...rowData]);
    setHasReorderChanges(false);
    setIsReorderMode(true);
  };

  const cancelReorder = () => {
    setIsReorderMode(false);
    setHasReorderChanges(false);
  };

  const saveReorder = async () => {
    if (!session?.user?.accessToken || !hasReorderChanges) return;
    setSaving(true);
    try {
      await categoryService.REORDER(
        reorderList.map((c) => c.id!),
        session.user.accessToken
      );
      setRowData([...reorderList]);
      setIsReorderMode(false);
      setHasReorderChanges(false);
      toast.success("Ordem das categorias salva com sucesso");
    } catch {
      toast.error("Erro ao salvar a ordem das categorias");
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    const newList = [...reorderList];
    const [dragged] = newList.splice(dragIndex.current, 1);
    newList.splice(index, 0, dragged);
    dragIndex.current = index;
    setReorderList(newList);
    setHasReorderChanges(true);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
  };

  const ActionsRenderer = (props: any) => (
    <div className="flex flex-row justify-center items-center">
      <button
        className="text-blue-500 hover:text-blue-600 transition-all duration-200 mr-4"
        onClick={() => router.push(`/category/${props.data?.id}/edit`)}
      >
        <MdEdit size={36} />
      </button>
      <button
        className="text-red-500 hover:text-red-600 transition-all duration-200"
        onClick={() => handleDelete(props.data?.id)}
      >
        <MdDelete size={36} />
      </button>
    </div>
  );

  const getRowStyle = (params: { node: RowNode }) => {
    if (params.node?.rowIndex !== null && params.node?.rowIndex !== undefined) {
      return params.node.rowIndex % 2 === 0
        ? { background: "#E8E8E8", color: "#000000" }
        : { background: "#D9D9D9", color: "#000000" };
    }
    return {};
  };

  const colDefs = [
    { field: "name", flex: 1, headerName: "Nome", filter: true, floatingFilter: true },
    { field: "actions", headerName: "Ações", width: 200, cellRenderer: ActionsRenderer },
  ];

  if (isReorderMode) {
    return (
      <>
        <ContentMain
          title="Ordenar Categorias"
          subtitle="Arraste para definir a ordem de exibição no site"
        >
          <div className="flex gap-3 mb-6">
            <Button
              onClick={cancelReorder}
              variant="outline"
              className="flex-shrink-0"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveReorder}
              disabled={!hasReorderChanges || saving}
              className="bg-green-primary hover:bg-green-primary/90 flex-shrink-0"
            >
              {saving ? <Loader /> : "Salvar ordem"}
            </Button>
            {hasReorderChanges && (
              <span className="text-sm text-amber-600 self-center">
                Alterações não salvas
              </span>
            )}
          </div>

          <div className="space-y-2 max-w-xl">
            {reorderList.map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing select-none shadow-sm hover:border-green-primary/40 transition-colors"
              >
                <RxDragHandleDots2 size={22} className="text-gray-400 flex-shrink-0" />
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name ?? ""}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover flex-shrink-0 w-10 h-10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                )}
                <span className="font-medium text-sm text-gray-800 truncate flex-1">
                  {category.name}
                </span>
                <span className="text-xs text-gray-400 flex-shrink-0">#{index + 1}</span>
              </div>
            ))}
          </div>
        </ContentMain>
      </>
    );
  }

  return (
    <>
      <CategoryDelete
        isOpen={categoryDeleteModal.isOpen}
        onClose={categoryDeleteModal.onClose}
      />
      <ContentMain title="Categorias" subtitle={`${filtered.length} categoria${filtered.length !== 1 ? "s" : ""}`}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <MdSearch
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary/50 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex gap-2 sm:ml-auto">
            <Button
              onClick={enterReorderMode}
              variant="outline"
              className="gap-2 flex-shrink-0"
              disabled={rowData.length < 2}
            >
              <MdDragIndicator size={18} />
              Ordenar
            </Button>
            <Button
              onClick={() => router.push("/category/new")}
              className="bg-green-primary hover:bg-green-primary/90 gap-2 flex-shrink-0"
            >
              <IoIosAddCircle size={22} />
              Nova Categoria
            </Button>
          </div>
        </div>

        <div className="my-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader color="text-green-primary" />
            </div>
          ) : (
            <>
              <div className="lg:hidden space-y-3">
                {filtered.map((category, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="h-[160px] w-full">
                      <Image
                        className="h-full w-full object-cover"
                        src={
                          category.image_url ||
                          "https://www.pallenz.co.nz/assets/camaleon_cms/image-not-found-4a963b95bf081c3ea02923dceaeb3f8085e1a654fc54840aac61a57a60903fef.png"
                        }
                        alt={category.name ?? ""}
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
                          onClick={() => router.push(`/category/${category.id}/edit`)}
                          className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                        >
                          <MdEdit size={28} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-500 hover:text-red-600 transition-colors p-1"
                        >
                          <MdDelete size={28} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {search ? `Nenhuma categoria encontrada para "${search}"` : "Nenhuma categoria cadastrada"}
                  </p>
                )}
              </div>
              <div className="hidden lg:block ag-theme-quartz">
                <AgGridReact
                  rowData={filtered}
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

export default CategoryPage;
