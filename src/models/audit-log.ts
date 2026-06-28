export interface AuditLog {
  id: string;
  user_id?: string;
  user_type?: number;
  method: string;
  route: string;
  entity?: string;
  entity_id?: string;
  action?: string;
  payload?: string;
  status_code?: number;
  ip?: string;
  created_at: string;
}
