#!/usr/bin/env bash

# Helper script to manage Antigravity Laser CNC Podman/Docker containers.

set -e

# Change directory to the script's directory
cd "$(dirname "$0")"

# Auto-detect container compose command
if podman compose version >/dev/null 2>&1; then
    COMPOSE_CMD="podman compose"
elif command -v podman-compose >/dev/null 2>&1; then
    COMPOSE_CMD="podman-compose"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Tidak dapat menemukan 'podman compose', 'podman-compose', 'docker compose', atau 'docker-compose'."
    exit 1
fi

# Auto-detect compose file
if [ -f podman-compose.yml ]; then
    COMPOSE_FILE_ARG="-f podman-compose.yml"
elif [ -f docker-compose.yml ]; then
    COMPOSE_FILE_ARG="-f docker-compose.yml"
else
    COMPOSE_FILE_ARG=""
fi

show_help() {
    echo "Penggunaan: ./run-podman.sh [opsi]"
    echo ""
    echo "Opsi:"
    echo "  up       - Membuat .env (jika belum ada), build image, dan jalankan container di background"
    echo "  down     - Menghentikan dan menghapus semua container"
    echo "  restart  - Restart semua container"
    echo "  logs     - Melihat log dari semua container secara real-time"
    echo "  status   - Melihat status container yang sedang berjalan"
    echo "  help     - Menampilkan bantuan ini"
}

init_env() {
    if [ ! -f .env ]; then
        echo "📝 File .env tidak ditemukan. Menyalin dari .env.example..."
        cp .env.example .env
        echo "⚠️  Harap sesuaikan password dan konfigurasi di dalam file .env jika diperlukan!"
    fi
}

case "$1" in
    up)
        init_env
        echo "🚀 Menjalankan container dengan $COMPOSE_CMD $COMPOSE_FILE_ARG..."
        $COMPOSE_CMD $COMPOSE_FILE_ARG up -d --build
        echo "✅ Semua service berhasil dijalankan! Gunakan './run-podman.sh logs' untuk memantau."
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
