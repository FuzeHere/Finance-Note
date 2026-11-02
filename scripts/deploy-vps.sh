#!/usr/bin/env bash
set -Eeuo pipefail

REPOSITORY_URL="${FINANCE_NOTE_REPOSITORY:-https://github.com/FuzeHere/Finance-Note.git}"
BRANCH="${FINANCE_NOTE_BRANCH:-main}"
INSTALL_DIR="${FINANCE_NOTE_DIR:-$HOME/Finance-Note}"

say() { printf '\n[Finance-Note] %s\n' "$*"; }
fail() { printf '\n[Finance-Note] ERROR: %s\n' "$*" >&2; exit 1; }

if [[ "${1:-}" != "--checkout-ready" ]]; then
  if [[ -f "${BASH_SOURCE[0]}" && -d "$(dirname "${BASH_SOURCE[0]}")/../.git" ]]; then
    INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  fi

  if ! command -v git >/dev/null 2>&1; then
    command -v sudo >/dev/null 2>&1 || fail "git belum terpasang dan sudo tidak tersedia untuk memasangnya."
    sudo apt-get update
    sudo apt-get install -y git
  fi
  if [[ ! -d "$INSTALL_DIR/.git" ]]; then
    [[ ! -e "$INSTALL_DIR" || -z "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]] || fail "$INSTALL_DIR sudah ada dan bukan checkout Git; atur FINANCE_NOTE_DIR ke direktori kosong atau checkout yang benar."
    mkdir -p "$(dirname "$INSTALL_DIR")"
    say "Mengambil repository $BRANCH dari GitHub ke $INSTALL_DIR"
    git clone --branch "$BRANCH" --single-branch "$REPOSITORY_URL" "$INSTALL_DIR"
  else
    cd "$INSTALL_DIR"
    [[ -z "$(git status --porcelain)" ]] || fail "Ada perubahan lokal di $INSTALL_DIR. Simpan/commit perubahan itu dulu agar update tidak menimpanya."
    say "Mengambil commit terbaru dari GitHub ($BRANCH)"
    git fetch origin "$BRANCH"
    git pull --ff-only origin "$BRANCH"
  fi

  exec bash "$INSTALL_DIR/scripts/deploy-vps.sh" --checkout-ready
fi

cd "$INSTALL_DIR"
[[ -f package-lock.json && -f ecosystem.config.cjs ]] || fail "File aplikasi tidak lengkap di $INSTALL_DIR."
[[ "$(id -u)" -ne 0 ]] || fail "Jalankan sebagai user biasa yang memiliki PM2; script akan memakai sudo hanya untuk paket OS dan direktori data."
command -v sudo >/dev/null 2>&1 || fail "sudo tidak ditemukan."
command -v apt-get >/dev/null 2>&1 || fail "Script ini khusus Ubuntu/Debian dengan apt."

say "Memasang pustaka sistem untuk OCR"
sudo apt-get update
sudo apt-get install -y ca-certificates curl git libgl1 libglib2.0-0 libgomp1

command -v node >/dev/null 2>&1 || fail "Node.js 22 atau lebih baru belum terpasang."
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
(( NODE_MAJOR >= 22 )) || fail "Finance-Note memerlukan Node.js 22 atau lebih baru; terdeteksi $(node --version)."
command -v npm >/dev/null 2>&1 || fail "npm belum terpasang."
command -v pm2 >/dev/null 2>&1 || fail "PM2 belum terpasang untuk user $(id -un). Jalankan: npm install -g pm2"

if [[ ! -f .env ]]; then
  cp .env.example .env
  chmod 600 .env
  say "Membuat .env dari contoh. Isi OAuth hanya jika fitur login/sinkronisasi Google digunakan."
fi
APP_URL="${FINANCE_NOTE_APP_URL:-http://192.168.1.10:3100}"
if grep -qx 'NEXT_PUBLIC_APP_URL=http://localhost:3100' .env; then
  sed -i "s|^NEXT_PUBLIC_APP_URL=http://localhost:3100$|NEXT_PUBLIC_APP_URL=$APP_URL|" .env
fi

say "Menyiapkan direktori database"
sudo install -d -o "$(id -un)" -g "$(id -gn)" /var/lib/finance-note

say "Memasang PaddleOCR dengan Python 3.13 dan mengunduh model CPU untuk pemakaian offline"
bash scripts/setup-paddle-ocr.sh

say "Memasang dependency Node dan membangun aplikasi"
npm ci
npm run build

if command -v ufw >/dev/null 2>&1 && sudo ufw status 2>/dev/null | grep -q "Status: active"; then
  say "Membuka port 3100 hanya dari LAN 192.168.1.0/24 dan interface Tailscale"
  sudo ufw allow from 192.168.1.0/24 to any port 3100 proto tcp
  if ip link show tailscale0 >/dev/null 2>&1; then
    sudo ufw allow in on tailscale0 to any port 3100 proto tcp
  fi
fi

say "Menjalankan ulang layanan Finance-Note melalui PM2"
pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
if ! systemctl is-enabled "pm2-$(id -un)" >/dev/null 2>&1; then
  PM2_BIN="$(command -v pm2)"
  sudo env "PATH=$PATH" "$PM2_BIN" startup systemd -u "$(id -un)" --hp "$HOME"
fi

say "Memeriksa kesiapan OCR dan aplikasi"
for attempt in $(seq 1 120); do
  if curl --silent --fail http://127.0.0.1:3101/health >/dev/null; then break; fi
  if [[ "$attempt" -eq 120 ]]; then
    pm2 logs finance-note-ocr --lines 80 --nostream || true
    fail "Worker OCR belum siap. Periksa log di atas."
  fi
  sleep 2
done
for attempt in $(seq 1 30); do
  if curl --silent --fail http://127.0.0.1:3100/ >/dev/null; then break; fi
  if [[ "$attempt" -eq 30 ]]; then
    pm2 logs finance-note --lines 80 --nostream || true
    fail "Aplikasi web belum merespons pada port 3100."
  fi
  sleep 2
done

pm2 save
say "Deploy selesai. LAN: http://192.168.1.10:3100"
say "Akses Tailscale memakai IP atau nama MagicDNS server pada port 3100."
say "Database: /var/lib/finance-note/finance.sqlite"
