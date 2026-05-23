#!/bin/sh
# wait-for-db.sh — Tunggu MySQL/MariaDB siap sebelum start uvicorn

set -e

HOST="${DB_HOST:-db}"
PORT="${DB_PORT:-3306}"
MAX_TRIES=30
WAIT=3

echo "⏳ Waiting for database at ${HOST}:${PORT}..."

i=0
while [ $i -lt $MAX_TRIES ]; do
    i=$((i+1))
    # Coba konek ke port DB menggunakan Python (tersedia di image)
    if python -c "
import socket, sys
try:
    s = socket.create_connection(('${HOST}', ${PORT}), timeout=3)
    s.close()
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
        echo "✅ Database is reachable! Starting backend..."
        break
    fi
    echo "   DB not reachable yet (${i}/${MAX_TRIES}), retrying in ${WAIT}s..."
    sleep $WAIT
done

if [ $i -ge $MAX_TRIES ]; then
    echo "❌ Database never became reachable after ${MAX_TRIES} attempts. Exiting."
    exit 1
fi

# Jalankan uvicorn
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
