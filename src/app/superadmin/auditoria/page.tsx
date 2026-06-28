"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ContentMain from "@/components/content-main";
import { useUserService } from "@/services/user.service";
import { useAuditLogService } from "@/services/audit-log.service";
import { User } from "@/models/user";
import { AuditLog } from "@/models/audit-log";
import { MdHistory, MdRefresh, MdSearch, MdExpandMore, MdExpandLess } from "react-icons/md";

// ─── helpers ──────────────────────────────────────────────────────────────────

function auditBadgeClass(action?: string): string {
  if (!action) return "bg-gray-100 text-gray-600";
  if (action.startsWith("FAILED")) return "bg-red-100 text-red-700";
  if (action.startsWith("CREATE")) return "bg-emerald-100 text-emerald-700";
  if (action.startsWith("DELETE")) return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

type ActionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE" | "FAILED";

const ACTION_FILTERS: { key: ActionFilter; label: string; cls: string }[] = [
  { key: "ALL", label: "Todos", cls: "border-gray-200 text-gray-600 hover:border-gray-300 bg-white" },
  { key: "CREATE", label: "Criação", cls: "hover:bg-emerald-50 border-emerald-200 text-emerald-700 bg-white" },
  { key: "UPDATE", label: "Edição", cls: "hover:bg-blue-50 border-blue-200 text-blue-700 bg-white" },
  { key: "DELETE", label: "Exclusão", cls: "hover:bg-red-50 border-red-200 text-red-700 bg-white" },
  { key: "FAILED", label: "Falhas", cls: "hover:bg-red-50 border-red-200 text-red-700 bg-white" },
];

const ACTION_ACTIVE: Record<ActionFilter, string> = {
  ALL: "bg-gray-800 text-white border-gray-800",
  CREATE: "bg-emerald-600 text-white border-emerald-600",
  UPDATE: "bg-blue-600 text-white border-blue-600",
  DELETE: "bg-red-600 text-white border-red-600",
  FAILED: "bg-red-600 text-white border-red-600",
};

// ─── Log row ──────────────────────────────────────────────────────────────────

const LogRow = ({ log }: { log: AuditLog }) => {
  const [expanded, setExpanded] = useState(false);
  const hasPayload = !!log.payload && log.payload !== "{}";

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${auditBadgeClass(log.action)}`}
        >
          {log.action ?? log.method}
        </span>
        <span className="font-mono text-xs text-gray-600 truncate flex-1">{log.route}</span>
        {log.entity_id && (
          <span className="hidden sm:block text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
            {log.entity_id}
          </span>
        )}
        <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap" title={formatDate(log.created_at)}>
          {relativeTime(log.created_at)}
        </span>
        {hasPayload && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-0.5 rounded hover:bg-gray-100 text-gray-400"
          >
            {expanded ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
          </button>
        )}
      </div>
      {expanded && hasPayload && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wider">Payload</p>
          <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words">
            {(() => {
              try {
                return JSON.stringify(JSON.parse(log.payload!), null, 2);
              } catch {
                return log.payload;
              }
            })()}
          </pre>
        </div>
      )}
      <div className="px-4 pb-2 flex items-center gap-3 text-[10px] text-gray-400">
        <span>{formatDate(log.created_at)}</span>
        {log.ip && <span>IP: {log.ip}</span>}
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const AuditoriaPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userService = useUserService();
  const auditLogService = useAuditLogService();

  const [stores, setStores] = useState<User[]>([]);
  const [selectedStore, setSelectedStore] = useState<User | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [storeSearch, setStoreSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.user?.user_type !== 2) {
      router.push("/home");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    (async () => {
      setLoadingStores(true);
      const data = await userService.GETALL(session.user.accessToken);
      if (data) setStores(data.filter((u: any) => u.user_type === 1));
      setLoadingStores(false);
    })();
  }, [session?.user?.accessToken]);

  const fetchLogs = useCallback(async (store: User) => {
    if (!session?.user?.accessToken || !store.id) return;
    setLoadingLogs(true);
    const data = await auditLogService.GETBYUSER(session.user.accessToken, store.id!, 200);
    if (data) setLogs(data);
    setLoadingLogs(false);
  }, [session?.user?.accessToken]);

  const handleSelectStore = (store: User) => {
    setSelectedStore(store);
    setActionFilter("ALL");
    setEntityFilter("");
    setLogs([]);
    fetchLogs(store);
  };

  const filteredStores = useMemo(() =>
    stores.filter((s) =>
      !storeSearch ||
      s.name?.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.person_link?.toLowerCase().includes(storeSearch.toLowerCase())
    ),
    [stores, storeSearch]
  );

  const entities = useMemo(() =>
    Array.from(new Set(logs.map((l) => l.entity).filter(Boolean))) as string[],
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchAction =
        actionFilter === "ALL" || log.action?.startsWith(actionFilter);
      const matchEntity = !entityFilter || log.entity === entityFilter;
      return matchAction && matchEntity;
    });
  }, [logs, actionFilter, entityFilter]);

  if (status === "loading" || (status === "authenticated" && session?.user?.user?.user_type !== 2)) {
    return null;
  }

  return (
    <ContentMain title="Auditoria por Loja" subtitle="Histórico de ações por loja">
      <div className="flex gap-5 min-h-[600px]">
        {/* Store list */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar loja..."
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-primary/30"
            />
          </div>

          <div className="flex-1 bg-white border border-gray-100 rounded-xl overflow-y-auto max-h-[640px]">
            {loadingStores ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
              </div>
            ) : filteredStores.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">Nenhuma loja</p>
            ) : (
              filteredStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleSelectStore(store)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                    selectedStore?.id === store.id
                      ? "bg-green-50 border-l-2 border-l-green-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{store.name}</p>
                  <p className="text-xs text-gray-400 truncate">/{store.person_link}</p>
                </button>
              ))
            )}
          </div>
          <p className="text-xs text-gray-400 text-right">{filteredStores.length} lojas</p>
        </div>

        {/* Logs panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {!selectedStore ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl py-20 text-center">
              <MdHistory size={48} className="text-gray-200 mb-3" />
              <p className="text-gray-500">Selecione uma loja para ver o histórico</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base font-bold text-gray-900">{selectedStore.name}</h2>
                  <p className="text-xs text-gray-400">{selectedStore.email}</p>
                </div>
                <button
                  onClick={() => fetchLogs(selectedStore)}
                  disabled={loadingLogs}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="Recarregar"
                >
                  <MdRefresh size={16} className={`text-gray-500 ${loadingLogs ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                {ACTION_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActionFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      actionFilter === f.key ? ACTION_ACTIVE[f.key] : f.cls
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                {entities.length > 0 && (
                  <select
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                    className="ml-auto text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-primary/30"
                  >
                    <option value="">Todas as entidades</option>
                    {entities.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Log list */}
              {loadingLogs ? (
                <div className="flex justify-center py-16">
                  <div className="w-7 h-7 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-xl py-16 text-center">
                  <MdHistory size={40} className="text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">Nenhum evento encontrado</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[560px] pr-1">
                  <p className="text-xs text-gray-400">{filteredLogs.length} evento(s)</p>
                  {filteredLogs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ContentMain>
  );
};

export default AuditoriaPage;
