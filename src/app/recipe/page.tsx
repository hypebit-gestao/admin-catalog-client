"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ContentMain from "@/components/content-main";
import { useRecipeService } from "@/services/recipe.service";
import { Recipe } from "@/models/recipe";
import toast from "react-hot-toast";
import { MdMenuBook, MdEdit, MdDelete, MdAdd, MdClose, MdDragIndicator } from "react-icons/md";
import { FaYoutube } from "react-icons/fa";

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const m = url.match(pattern);
    if (m) return m[1];
  }
  return null;
}

function YouTubeThumbnail({ url }: { url: string }) {
  const id = getYouTubeId(url);
  if (!id) return <span className="text-xs text-gray-400 truncate">{url}</span>;
  return (
    <div className="flex items-center gap-2">
      <img
        src={`https://img.youtube.com/vi/${id}/default.jpg`}
        alt="thumb"
        className="w-14 h-10 object-cover rounded"
      />
      <span className="text-xs text-gray-600 truncate max-w-[180px]">{url}</span>
    </div>
  );
}

interface FormState {
  id?: string;
  title: string;
  description: string;
  videos: string[];
  active: boolean;
  display_order: number;
}

const EMPTY_FORM: FormState = { title: "", description: "", videos: [], active: true, display_order: 0 };

export default function RecipePage() {
  const { data: session } = useSession();
  const recipeService = useRecipeService();
  const token = session?.user?.accessToken ?? "";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [videoInput, setVideoInput] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await recipeService.GETALL(token);
      setRecipes(data ?? []);
    } catch {
      toast.error("Erro ao carregar modos de preparo");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, display_order: recipes.length });
    setPanelOpen(true);
  };

  const openEdit = (r: Recipe) => {
    setForm({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      videos: r.videos ?? [],
      active: r.active,
      display_order: r.display_order ?? 0,
    });
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setVideoInput("");
  };

  const addVideo = () => {
    const url = videoInput.trim();
    if (!url) return;
    if (!getYouTubeId(url)) {
      toast.error("URL do YouTube inválida");
      return;
    }
    setForm((f) => ({ ...f, videos: [...f.videos, url] }));
    setVideoInput("");
  };

  const removeVideo = (idx: number) => {
    setForm((f) => ({ ...f, videos: f.videos.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    try {
      const payload: Recipe = {
        id: form.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        videos: form.videos,
        active: form.active,
        display_order: form.display_order,
      };
      if (form.id) {
        await recipeService.PUT(payload, token);
        toast.success("Atualizado com sucesso");
      } else {
        await recipeService.POST(payload, token);
        toast.success("Criado com sucesso");
      }
      closePanel();
      load();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await recipeService.DELETE(id, token);
      toast.success("Removido");
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (r: Recipe) => {
    try {
      await recipeService.TOGGLE(r.id!, token);
      setRecipes((prev) => prev.map((x) => x.id === r.id ? { ...x, active: !x.active } : x));
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  return (
    <ContentMain
      title="Modo de Preparo"
      subtitle="Adicione seções com vídeos ensinando como preparar seus pratos"
    >
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#2c6e49] hover:bg-[#235c3c] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <MdAdd size={18} />
          Novo Modo de Preparo
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <MdMenuBook size={32} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Nenhum modo de preparo cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Clique em &quot;Novo Modo de Preparo&quot; para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((r, idx) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 shadow-sm"
            >
              <div className="text-gray-300 mt-1 shrink-0">
                <MdDragIndicator size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">#{idx + 1}</span>
                  <span className="font-semibold text-gray-900">{r.title}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {r.active ? "Ativo" : "Inativo"}
                  </span>
                  {(r.videos?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                      <FaYoutube size={11} />
                      {r.videos!.length} {r.videos!.length === 1 ? "vídeo" : "vídeos"}
                    </span>
                  )}
                </div>
                {r.description && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{r.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(r)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                >
                  {r.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => openEdit(r)}
                  className="p-2 rounded-lg text-gray-500 hover:text-[#2c6e49] hover:bg-green-50 transition-colors"
                  title="Editar"
                >
                  <MdEdit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(r.id!)}
                  disabled={deleting === r.id}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Excluir"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={closePanel} />
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-lg text-[#2c6e49]">
                {form.id ? "Editar" : "Novo"} Modo de Preparo
              </h2>
              <button onClick={closePanel} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <MdClose size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c6e49]/30 focus:border-[#2c6e49]"
                  placeholder="Ex: Como preparar Nhoque"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descrição <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c6e49]/30 focus:border-[#2c6e49] resize-none"
                  placeholder="Uma breve descrição do modo de preparo..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Videos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vídeos do YouTube
                </label>
                <div className="space-y-2 mb-3">
                  {form.videos.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <YouTubeThumbnail url={url} />
                      </div>
                      <button
                        onClick={() => removeVideo(idx)}
                        className="shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <MdClose size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c6e49]/30 focus:border-[#2c6e49]"
                    placeholder="Cole a URL do YouTube aqui"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVideo())}
                  />
                  <button
                    onClick={addVideo}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm font-medium shrink-0"
                  >
                    <FaYoutube size={14} />
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    form.active ? "bg-[#2c6e49]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.active ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {form.active ? "Visível na loja" : "Oculto na loja"}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={closePanel}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-medium bg-[#2c6e49] hover:bg-[#235c3c] text-white rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ContentMain>
  );
}
