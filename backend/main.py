import os
import time
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from database import get_db, init_db
from dotenv import load_dotenv

load_dotenv()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "pplglaser")

app = FastAPI(title="PPLG Laser CNC API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Retry DB init on startup ───────────────────────────────────────────────
@app.on_event("startup")
def startup():
    for i in range(10):
        try:
            init_db()
            return
        except Exception as e:
            print(f"⏳ DB not ready yet ({i+1}/10): {e}")
            time.sleep(3)
    raise RuntimeError("❌ Could not connect to database after 10 attempts")


# ─── Auth dependency ─────────────────────────────────────────────────────────
def require_admin(x_admin_secret: str = Header(...)):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ─── Schemas ─────────────────────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    order_number: str
    customer_name: str
    whatsapp_number: Optional[str] = ""
    template_id: Optional[str] = ""
    template_name: Optional[str] = ""
    template_width: Optional[int] = 0
    template_height: Optional[int] = 0
    notes: Optional[str] = ""
    canvas_data_url: Optional[str] = ""
    total_price: Optional[float] = 0

class UpdateOrderStatusRequest(BaseModel):
    status: str
    total_price: Optional[float] = None

class CreatePaymentRequest(BaseModel):
    order_number: str
    amount: float
    payment_method: str = "cash"
    notes: Optional[str] = ""
    received_by: Optional[str] = "Admin"


# ─── Health ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "PPLG Laser CNC API"}


# ─── Orders ──────────────────────────────────────────────────────────────────
@app.post("/api/orders", status_code=201)
def create_order(body: CreateOrderRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            # Check duplicate
            cur.execute("SELECT id FROM orders WHERE order_number=%s", (body.order_number,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Order number already exists")

            cur.execute("""
                INSERT INTO orders
                  (order_number, customer_name, whatsapp_number,
                   template_id, template_name, template_width, template_height,
                   notes, canvas_data_url, total_price)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                body.order_number, body.customer_name, body.whatsapp_number,
                body.template_id, body.template_name, body.template_width, body.template_height,
                body.notes, body.canvas_data_url, body.total_price
            ))
            new_id = cur.lastrowid

    return {"id": new_id, "order_number": body.order_number, "message": "Order created"}


@app.get("/api/orders")
def list_orders(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    _: None = Depends(require_admin),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            base = """
                SELECT o.*,
                  COALESCE(SUM(p.amount), 0) AS total_paid
                FROM orders o
                LEFT JOIN payments p ON p.order_id = o.id
            """
            where = "WHERE o.status = %s" if status else ""
            group = "GROUP BY o.id ORDER BY o.created_at DESC LIMIT %s OFFSET %s"
            params = ([status] if status else []) + [limit, offset]
            cur.execute(f"{base} {where} {group}", params)
            orders = cur.fetchall()

            cur.execute(
                "SELECT COUNT(*) AS cnt FROM orders" + (" WHERE status=%s" if status else ""),
                ([status] if status else []),
            )
            total = cur.fetchone()["cnt"]

    return {"data": orders, "total": total}


@app.get("/api/orders/{order_number}")
def get_order(order_number: str, _: None = Depends(require_admin)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT o.*,
                  COALESCE(SUM(p.amount), 0) AS total_paid
                FROM orders o
                LEFT JOIN payments p ON p.order_id = o.id
                WHERE o.order_number = %s
                GROUP BY o.id
            """, (order_number,))
            order = cur.fetchone()
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")

            cur.execute(
                "SELECT * FROM payments WHERE order_number=%s ORDER BY paid_at DESC",
                (order_number,)
            )
            payments = cur.fetchall()

    return {"order": order, "payments": payments}


@app.put("/api/orders/{order_number}/status")
def update_order_status(
    order_number: str,
    body: UpdateOrderStatusRequest,
    _: None = Depends(require_admin),
):
    valid = ["pending", "processing", "completed", "cancelled"]
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")

    with get_db() as conn:
        with conn.cursor() as cur:
            if body.total_price is not None:
                cur.execute(
                    "UPDATE orders SET status=%s, total_price=%s WHERE order_number=%s",
                    (body.status, body.total_price, order_number),
                )
            else:
                cur.execute(
                    "UPDATE orders SET status=%s WHERE order_number=%s",
                    (body.status, order_number),
                )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Order not found")

    return {"message": "Status updated"}


@app.delete("/api/orders/{order_number}")
def delete_order(order_number: str, _: None = Depends(require_admin)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM payments WHERE order_number=%s", (order_number,))
            cur.execute("DELETE FROM orders WHERE order_number=%s", (order_number,))
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}


# ─── Payments ─────────────────────────────────────────────────────────────────
@app.post("/api/payments", status_code=201)
def create_payment(body: CreatePaymentRequest, _: None = Depends(require_admin)):
    valid_methods = ["cash", "transfer", "qris"]
    if body.payment_method not in valid_methods:
        raise HTTPException(status_code=400, detail=f"payment_method must be one of {valid_methods}")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM orders WHERE order_number=%s", (body.order_number,))
            order = cur.fetchone()
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")

            cur.execute("""
                INSERT INTO payments
                  (order_id, order_number, amount, payment_method, notes, received_by)
                VALUES (%s,%s,%s,%s,%s,%s)
            """, (
                order["id"], body.order_number,
                body.amount, body.payment_method,
                body.notes, body.received_by,
            ))
            pay_id = cur.lastrowid

    return {"id": pay_id, "message": "Payment recorded"}


@app.get("/api/payments")
def list_payments(limit: int = 100, offset: int = 0, _: None = Depends(require_admin)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT p.*, o.customer_name, o.template_name
                FROM payments p
                JOIN orders o ON o.id = p.order_id
                ORDER BY p.paid_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            payments = cur.fetchall()
            cur.execute("SELECT COUNT(*) AS cnt FROM payments")
            total = cur.fetchone()["cnt"]

    return {"data": payments, "total": total}


# ─── Dashboard stats ──────────────────────────────────────────────────────────
@app.get("/api/dashboard")
def dashboard(_: None = Depends(require_admin)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS total FROM orders")
            total_orders = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(*) AS cnt FROM orders WHERE status='pending'")
            pending = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) AS cnt FROM orders WHERE status='processing'")
            processing = cur.fetchone()["cnt"]

            cur.execute("SELECT COUNT(*) AS cnt FROM orders WHERE status='completed'")
            completed = cur.fetchone()["cnt"]

            cur.execute("SELECT COALESCE(SUM(amount),0) AS total FROM payments")
            total_revenue = cur.fetchone()["total"]

            cur.execute("""
                SELECT COUNT(*) AS cnt FROM payments
                WHERE DATE(paid_at) = CURDATE()
            """)
            today_payments = cur.fetchone()["cnt"]

            cur.execute("""
                SELECT COALESCE(SUM(amount),0) AS total FROM payments
                WHERE DATE(paid_at) = CURDATE()
            """)
            today_revenue = cur.fetchone()["total"]

            cur.execute("""
                SELECT o.order_number, o.customer_name, o.template_name,
                       o.status, o.total_price, o.created_at,
                       COALESCE(SUM(p.amount),0) AS total_paid
                FROM orders o
                LEFT JOIN payments p ON p.order_id = o.id
                GROUP BY o.id
                ORDER BY o.created_at DESC
                LIMIT 10
            """)
            recent_orders = cur.fetchall()

            cur.execute("""
                SELECT p.*, o.customer_name
                FROM payments p
                JOIN orders o ON o.id = p.order_id
                ORDER BY p.paid_at DESC
                LIMIT 10
            """)
            recent_payments = cur.fetchall()

    return {
        "total_orders": total_orders,
        "pending": pending,
        "processing": processing,
        "completed": completed,
        "total_revenue": float(total_revenue),
        "today_payments": today_payments,
        "today_revenue": float(today_revenue),
        "recent_orders": recent_orders,
        "recent_payments": recent_payments,
    }
