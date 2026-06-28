import { fetchWrapper } from "../utils/functions/fetch";
import { AuditLog } from "@/models/audit-log";

export const useAuditLogService = () => {
  const GETBYUSER = async (
    token: string,
    userId: string,
    limit = 50
  ): Promise<AuditLog[] | undefined> => {
    return fetchWrapper<AuditLog[]>(
      `audit-log/user/${userId}?limit=${limit}`,
      { method: "GET", headers: { Authorization: token } }
    );
  };

  const GETALL = async (
    token: string,
    userId?: string,
    limit = 100
  ): Promise<AuditLog[] | undefined> => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (userId) qs.set("userId", userId);
    return fetchWrapper<AuditLog[]>(`audit-log?${qs.toString()}`, {
      method: "GET",
      headers: { Authorization: token },
    });
  };

  return { GETBYUSER, GETALL };
};
