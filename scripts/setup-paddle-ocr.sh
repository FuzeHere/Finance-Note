#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$ROOT_DIR/.venv-paddle"

UV_BIN="$(command -v uv || true)"
if [[ -z "$UV_BIN" ]]; then
  command -v curl >/dev/null 2>&1 || { echo "curl is required to install uv." >&2; exit 1; }
  curl -LsSf https://astral.sh/uv/install.sh | sh
  for candidate in "$HOME/.local/bin/uv" "$HOME/.cargo/bin/uv"; do
    if [[ -x "$candidate" ]]; then UV_BIN="$candidate"; break; fi
  done
fi

if [[ -z "$UV_BIN" || ! -x "$UV_BIN" ]]; then
  echo "uv installation did not produce a runnable binary." >&2
  exit 1
fi

# PaddlePaddle wheels currently support Python up to 3.13; Ubuntu 26.04 ships 3.14.
"$UV_BIN" python install 3.13
"$UV_BIN" venv --clear --python 3.13 "$VENV_DIR"
"$UV_BIN" pip install --python "$VENV_DIR/bin/python" \
  --index-url https://www.paddlepaddle.org.cn/packages/stable/cpu/ paddlepaddle==3.2.0
"$UV_BIN" pip install --python "$VENV_DIR/bin/python" paddleocr==3.7.0
"$VENV_DIR/bin/python" -c 'import paddle; import paddleocr; print("PaddlePaddle", paddle.__version__); print("PaddleOCR", paddleocr.__version__)'
"$VENV_DIR/bin/python" "$ROOT_DIR/scripts/paddle_ocr_worker.py" --warmup

echo "PaddleOCR is installed and its Indonesian CPU models are cached."
echo "Start or restart the PM2 processes with: pm2 startOrRestart ecosystem.config.cjs --update-env"
