"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MdNotifications, MdNotificationsNone, MdDoneAll, MdHistory } from "react-icons/md";
import { useAuditLogService } from "@/services/audit-log.service";
import { useUserService } from "@/services/user.service";
import { AuditLog } from "@/models/audit-log";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "audit_last_seen";
const MAX_SHOWN = 20;

function badgeCls(action?: string): string {
  if (!action) return "bg-gray-100 text-gray-600";
  if (action.startsWith("FAILED")) return "bg-red-100 text-red-700";
  if (action.startsWith("CREATE")) return "bg-emerald-100 text-emerald-700";
  if (action.startsWith("DELETE")) return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function getLastSeen(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

function setLastSeen(iso: string) {
  localStorage.setItem(STORAGE_KEY, iso);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  token: string;
}

const NotificationBell = ({ token }: Props) => {
  const router = useRouter();
  const auditService = useAuditLogService();
  const userService = useUserService();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Load store names for display
    userService.GETALL(token).then((users) => {
      if (!users) return;
      const map: Record<string, string> = {};
      users.forEach((u: any) => { if (u.id && u.name) map[u.id] = u.name; });
      setStoreNames(map);
    });

    auditService.GETALL(token, undefined, MAX_SHOWN).then((data) => {
      if (!data) return;
      setLogs(data);
      const lastSeen = getLastSeen();
      if (!lastSeen) {
        if (data.length > 0) setLastSeen(data[0].created_at);
      } else {
        setUnread(data.filter((l) => new Date(l.created_at) > new Date(lastSeen)).length);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── SSE connection ────────────────────────────────────────────────────────
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/audit-log/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const log: AuditLog = JSON.parse(event.data);
        setLogs((prev) => [log, ...prev].slice(0, MAX_SHOWN));
        const lastSeen = getLastSeen();
        if (!lastSeen || new Date(log.created_at) > new Date(lastSeen)) {
          setUnread((u) => u + 1);
        }
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects, no manual retry needed
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [token]);

  // ── close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    if (logs.length > 0) {
      setLastSeen(logs[0].created_at);
      setUnread(0);
    }
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && logs.length > 0) {
      setLastSeen(logs[0].created_at);
      setUnread(0);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Notificações"
      >
        {unread > 0 ? (
          <MdNotifications size={22} className="text-white" />
        ) : (
          <MdNotificationsNone size={22} className="text-white/80" />
        )}
        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none shadow">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        {/* SSE connected dot */}
        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border border-green-primary ${
            connected ? "bg-green-400" : "bg-gray-400"
          }`}
          title={connected ? "Conectado (tempo real)" : "Reconectando..."}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Notificações</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {connected ? "ao vivo" : "reconectando"}
              </span>
            </div>
            {unread > 0 ? (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
              >
                <MdDoneAll size={14} />
                Marcar lidas
              </button>
            ) : (
              <span className="text-xs text-gray-400">Tudo lido</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <MdHistory size={32} className="mb-2 text-gray-200" />
                <p className="text-sm">Nenhum evento ainda</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={log.id}
                  className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                    i < unread ? "bg-green-50/60" : ""
                  }`}
                >
                  <span
                    className={`shrink-0 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls(log.action)}`}
                  >
                    {log.action ?? log.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-600 truncate">{log.route}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {log.user_id
                        ? storeNames[log.user_id] ?? log.user_id.slice(0, 8) + "…"
                        : "Sistema"}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-gray-400 whitespace-nowrap mt-0.5">
                    {relativeTime(log.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/superadmin/auditoria");
              }}
              className="w-full text-center text-xs text-green-700 hover:text-green-800 font-medium"
            >
              Ver auditoria completa →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
