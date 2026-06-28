"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ContentMain from "@/components/content-main";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles//ag-grid.css";
import "ag-grid-community/styles//ag-theme-quartz.css";
import { AG_GRID_LOCALE_PT_BR } from "@/utils/locales/ag-grid";
import { RowNode } from "ag-grid-community";
import Loader from "@/components/loader";
import { useSizeService } from "@/services/size.service";
import { Size as SizeModel } from "@/models/size";
import useSizeDeleteModal from "@/utils/hooks/size/useDeleteSizeModal";
import SizeDelete from "@/components/size/size-delete";
import { MdDelete, MdEdit, MdSearch, MdCheck, MdClose, MdOutlineCategory } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";
import toast from "react-hot-toast";

const SizePage = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [rowData, setRowData] = useState<SizeModel[]>([]);
  const [search, setSearch] = useState("");
  const [newSizeName, setNewSizeName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);
  const sizeService = useSizeService();
  const sizeDeleteModal = useSizeDeleteModal();

  const token = session?.user?.accessToken;
  const userId = session?.user?.user?.id;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    sizeService
      .GETALL(token)
      .then((res) => { if (res) setRowData(res as SizeModel[]); })
      .finally(() => setLoading(false));
  }, [token, sizeDeleteModal.isDelete]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rowData;
    const q = search.toLowerCase();
    return rowData.filter((s) => s.size?.toLowerCase().includes(q));
  }, [rowData, search]);

  const handleDelete = (id: string | undefined) => {
    useSizeDeleteModal.setState({ itemId: id });
    sizeDeleteModal.onOpen();
  };

  const handleCreate = async () => {
    const name = newSizeName.trim();
    if (!name || !token || !userId) return;
    setCreating(true);
    try {
      const created = await sizeService.POST({ size: name, user_id: userId }, token);
      if (created) {
        setRowData((prev) => [created, ...prev]);
        setNewSizeName("");
        toast.success(`Variação "${name}" criada`);
        newInputRef.current?.focus();
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar variação");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (size: SizeModel) => {
    setEditingId(size.id!);
    setEditingValue(size.size ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
  };

  const commitEdit = async (id: string) => {
    const name = editingValue.trim();
    if (!name || !token) { cancelEdit(); return; }
    try {
      await sizeService.PUT({ id, size: name }, token);
      setRowData((prev) => prev.map((s) => s.id === id ? { ...s, size: name } : s));
      toast.success("Variação atualizada");
    } catch {
      toast.error("Erro ao atualizar variação");
    } finally {
      cancelEdit();
    }
  };

  const handleGridCellChanged = async (params: any) => {
    if (!token) return;
    try {
      await sizeService.PUT({ id: params.data.id, size: params.newValue }, token);
      toast.success("Variação atualizada");
    } catch {
      toast.error("Erro ao atualizar variação");
      params.api.refreshCells({ rowNodes: [params.node] });
    }
  };

  const ActionsRenderer = (props: any) => (
    <div className="flex flex-row justify-center items-center gap-2 h-full">
      <button
        className="text-red-500 hover:text-red-600 transition-all duration-200"
        onClick={() => handleDelete(props.data?.id)}
      >
        <MdDelete size={22} />
      </button>
    </div>
  );

  const getRowStyle = (params: { node: RowNode }) => {
    if (params.node?.rowIndex !== null && params.node?.rowIndex !== undefined) {
      return params.node.rowIndex % 2 === 0
        ? { background: "#F9FAFB", color: "#000000" }
        : { background: "#F3F4F6", color: "#000000" };
    }
    return {};
  };

  const colDefs = [
    {
      field: "size",
      flex: 1,
      headerName: "Nome da variação",
      filter: true,
      floatingFilter: true,
      editable: true,
      cellStyle: { cursor: "text" },
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 100,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
    },
  ];

  return (
    <>
      <SizeDelete isOpen={sizeDeleteModal.isOpen} onClose={sizeDeleteModal.onClose} />
      <ContentMain
        title="Variações"
        subtitle={`${filtered.length} variação${filtered.length !== 1 ? "ões" : ""} cadastrada${filtered.length !== 1 ? "s" : ""}`}
      >
        {/* Inline creation bar */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <IoMdAdd size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={newInputRef}
              type="text"
              placeholder="Nova variação (Ex: P, M, G, 250g, Morango...)"
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary/50 transition-all"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newSizeName.trim()}
            className="px-4 py-2 text-sm font-semibold bg-green-primary hover:bg-green-primary/90 disabled:opacity-50 text-white rounded-lg transition-colors flex-shrink-0"
          >
            {creating ? "Adicionando..." : "Adicionar"}
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar variação..."
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

        <div>
          {loading ? (
            <Loader color="text-green-primary" />
          ) : (
            <>
              {/* Mobile list */}
              <div className="lg:hidden space-y-3">
                {filtered.length === 0 && !search ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MdOutlineCategory size={48} className="text-gray-200 mb-3" />
                    <p className="font-semibold text-gray-500">Nenhuma variação cadastrada</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Variações são as opções do produto: tamanho (P, M, G), peso (250g, 500g), sabor (Morango, Chocolate), cor, etc.
                    </p>
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma variação encontrada para &quot;{search}&quot;
                  </p>
                ) : (
                  filtered.map((size) => (
                    <div
                      key={size.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-3"
                    >
                      {editingId === size.id ? (
                        <input
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => commitEdit(size.id!)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitEdit(size.id!);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="flex-1 text-sm font-semibold border border-green-primary/50 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-green-primary/30"
                        />
                      ) : (
                        <span className="font-bold text-lg text-green-primary truncate flex-1">
                          {size.size}
                        </span>
                      )}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {editingId === size.id ? (
                          <>
                            <button
                              onClick={() => commitEdit(size.id!)}
                              className="text-green-600 hover:text-green-700 p-1"
                            >
                              <MdCheck size={22} />
                            </button>
                            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600 p-1">
                              <MdClose size={22} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(size)}
                              className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                            >
                              <MdEdit size={22} />
                            </button>
                            <button
                              onClick={() => handleDelete(size.id)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1"
                            >
                              <MdDelete size={22} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop AG Grid */}
              <div className="hidden lg:block">
                {filtered.length === 0 && !search ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-gray-50">
                    <MdOutlineCategory size={48} className="text-gray-200 mb-3" />
                    <p className="font-semibold text-gray-500">Nenhuma variação cadastrada</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      Variações são as opções do produto: tamanho (P, M, G), peso (250g, 500g), sabor (Morango, Chocolate), cor, etc.
                    </p>
                    <p className="text-xs text-gray-400 mt-3">Use o campo acima para adicionar a primeira variação.</p>
                  </div>
                ) : (
                  <div className="ag-theme-quartz">
                    <AgGridReact
                      rowData={filtered}
                      columnDefs={colDefs as any}
                      getRowStyle={getRowStyle as any}
                      domLayout="autoHeight"
                      pagination={true}
                      paginationPageSizeSelector={[10, 20]}
                      paginationPageSize={10}
                      localeText={AG_GRID_LOCALE_PT_BR}
                      onCellValueChanged={handleGridCellChanged}
                      stopEditingWhenCellsLoseFocus={true}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ContentMain>
    </>
  );
};

export default SizePage;
