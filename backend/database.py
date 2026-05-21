import os
import pymysql
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "antigravity"),
    "password": os.getenv("DB_PASSWORD", "antigravity123"),
    "database": os.getenv("DB_NAME", "antigravity_db"),
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
    "autocommit": True,
}

def get_connection():
    return pymysql.connect(**DB_CONFIG)

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Create all tables if not exist."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id              INT AUTO_INCREMENT PRIMARY KEY,
                    order_number    VARCHAR(50)  UNIQUE NOT NULL,
                    customer_name   VARCHAR(255) NOT NULL,
                    whatsapp_number VARCHAR(30)  DEFAULT '',
                    template_id     VARCHAR(50)  DEFAULT '',
                    template_name   VARCHAR(100) DEFAULT '',
                    template_width  INT          DEFAULT 0,
                    template_height INT          DEFAULT 0,
                    notes           TEXT,
                    status          ENUM('pending','processing','completed','cancelled')
                                    DEFAULT 'pending',
                    canvas_data_url LONGTEXT,
                    total_price     DECIMAL(10,2) DEFAULT 0,
                    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id             INT AUTO_INCREMENT PRIMARY KEY,
                    order_id       INT          NOT NULL,
                    order_number   VARCHAR(50)  NOT NULL,
                    amount         DECIMAL(10,2) NOT NULL,
                    payment_method ENUM('cash','transfer','qris') DEFAULT 'cash',
                    notes          TEXT,
                    received_by    VARCHAR(100) DEFAULT 'Admin',
                    paid_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
    print("✅ Database tables ready.")
