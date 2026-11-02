#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="$ROOT_DIR/.venv-paddle"

if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
  echo "Python 3 is required. Install python3 and python3-venv first." >&2
  exit 1
fi

"$PYTHON_BIN" -m venv "$VENV_DIR"
"$VENV_DIR/bin/python" -m pip install --upgrade pip
"$VENV_DIR/bin/python" -m pip install --no-cache-dir paddlepaddle==3.2.0 \
  -i https://www.paddlepaddle.org.cn/packages/stable/cpu/
"$VENV_DIR/bin/python" -m pip install --no-cache-dir paddleocr==3.7.0
"$VENV_DIR/bin/python" "$ROOT_DIR/scripts/paddle_ocr_worker.py" --warmup

echo "PaddleOCR is installed and its Indonesian CPU models are cached."
echo "Start or restart the PM2 processes with: pm2 startOrRestart ecosystem.config.cjs --update-env"
