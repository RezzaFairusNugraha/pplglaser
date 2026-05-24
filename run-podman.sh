#!/usr/bin/env bash

# Helper script untuk menjalankan PPLG Laser CNC Frontend
# Backend sudah jalan di: https://backlaser.pplgsmkn4.my.id

set -e

# Pindah ke direktori script ini
cd "$(dirname "$0")"

# ── Auto-detect compose command ───────────────────────────────────────────────
if podman compose version > /dev/null 2>&1; then
    COMPOSE_CMD="podman compose"
elif command -v podman-compose > /dev/null 2>&1; then
    COMPOSE_CMD="podman-compose"
elif docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Tidak dapat menemukan 'podman compose', 'podman-compose', 'docker compose', atau 'docker-compose'."
    exit 1
fi

# ── Auto-detect compose file ──────────────────────────────────────────────────
if [ -f podman-compose.yml ]; then
    COMPOSE_FILE_ARG="-f podman-compose.yml"
elif [ -f docker-compose.yml ]; then
    COMPOSE_FILE_ARG="-f docker-compose.yml"
else
    COMPOSE_FILE_ARG=""
fi

# ── Fungsi help ───────────────────────────────────────────────────────────────
show_help() {
    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║     PPLG Laser CNC — Frontend Runner         ║"
    echo "║  Backend: https://backlaser.pplgsmkn4.my.id  ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""
    echo "Penggunaan: ./run-podman.sh [opsi]"
    echo ""
    echo "  up       - Build & jalankan frontend container"
    echo "  down     - Hentikan dan hapus container"
    echo "  restart  - Restart container"
    echo "  logs     - Lihat log real-time"
    echo "  status   - Lihat status container"
    echo "  help     - Tampilkan bantuan ini"
}

# ── Buat .env dari .env.example jika belum ada ────────────────────────────────
init_env() {
    if [ ! -f .env ]; then
        echo "📝 File .env tidak ditemukan. Menyalin dari .env.example..."
        cp .env.example .env
        echo "✅ File .env dibuat dengan konfigurasi default."
        echo "   BACKEND_URL sudah di-set ke https://backlaser.pplgsmkn4.my.id"
    fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
case "$1" in
    up)
        init_env
        echo ""
        echo "🚀 Menjalankan PPLG Frontend..."
        echo "   Backend: $(grep BACKEND_URL .env | cut -d= -f2)"
        echo "   Port   : $(grep HTTP_PORT .env | cut -d= -f2)"
        echo ""
        $COMPOSE_CMD $COMPOSE_FILE_ARG up -d --build
        echo ""
        echo "✅ Frontend berhasil dijalankan!"
        echo "   Akses: http://localhost:$(grep HTTP_PORT .env | cut -d= -f2)"
        echo "   Admin: http://localhost:$(grep HTTP_PORT .env | cut -d= -f2)/admin"
        echo ""
        echo "   Gunakan './run-podman.sh logs' untuk memantau."
        ;;
    down)
        echo "🛑 Menghentikan container..."
        $COMPOSE_CMD $COMPOSE_FILE_ARG down
        echo "✅ Semua container berhasil dihentikan."
        ;;
    restart)
        echo "🔄 Merestart container..."
        $COMPOSE_CMD $COMPOSE_FILE_ARG restart
        echo "✅ Restart selesai."
        ;;
    logs)
        $COMPOSE_CMD $COMPOSE_FILE_ARG logs -f
        ;;
    status)
        $COMPOSE_CMD $COMPOSE_FILE_ARG ps
        ;;
    help|*)
        show_help
        ;;
esac
