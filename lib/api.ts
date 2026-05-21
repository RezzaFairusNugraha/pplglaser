const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "pplglaser";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  adminAuth = false
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(adminAuth ? { "x-admin-secret": ADMIN_SECRET } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API Error");
  }
  return res.json() as Promise<T>;
}

// ─── Public (customer) ────────────────────────────────────────────────────────
export async function submitOrder(data: {
  order_number: string;
  customer_name: string;
  whatsapp_number?: string;
  template_id?: string;
  template_name?: string;
  template_width?: number;
  template_height?: number;
  notes?: string;
  canvas_data_url?: string;
  total_price?: number;
}) {
  return apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export async function getDashboard() {
  return apiFetch<DashboardData>("/dashboard", {}, true);
}

export async function getOrders(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const q = qs.toString() ? `?${qs}` : "";
  return apiFetch<{ data: Order[]; total: number }>(`/orders${q}`, {}, true);
}

export async function getOrder(orderNumber: string) {
  return apiFetch<{ order: Order; payments: Payment[] }>(
    `/orders/${orderNumber}`,
    {},
    true
  );
}

export async function updateOrderStatus(
  orderNumber: string,
  status: string,
  total_price?: number
) {
  return apiFetch(
    `/orders/${orderNumber}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status, total_price }),
    },
    true
  );
}

export async function deleteOrder(orderNumber: string) {
  return apiFetch(
    `/orders/${orderNumber}`,
    { method: "DELETE" },
    true
  );
}

export async function createPayment(data: {
  order_number: string;
  amount: number;
  payment_method: string;
  notes?: string;
  received_by?: string;
}) {
  return apiFetch(
    "/payments",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    true
  );
}

export async function getPayments(params?: { limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const q = qs.toString() ? `?${qs}` : "";
  return apiFetch<{ data: Payment[]; total: number }>(`/payments${q}`, {}, true);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  whatsapp_number: string;
  template_id: string;
  template_name: string;
  template_width: number;
  template_height: number;
  notes: string;
  status: "pending" | "processing" | "completed" | "cancelled";
  canvas_data_url: string;
  total_price: number;
  total_paid: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  order_number: string;
  amount: number;
  payment_method: "cash" | "transfer" | "qris";
  notes: string;
  received_by: string;
  paid_at: string;
  customer_name?: string;
  template_name?: string;
}

export interface DashboardData {
  total_orders: number;
  pending: number;
  processing: number;
  completed: number;
  total_revenue: number;
  today_payments: number;
  today_revenue: number;
  recent_orders: Order[];
  recent_payments: Payment[];
}
