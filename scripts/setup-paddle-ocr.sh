#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$ROOT_DIR/.venv-paddle"
ENGINE_FILE="$ROOT_DIR/.ocr-engine"

install_tesseract_fallback() {
  if ! command -v tesseract >/dev/null 2>&1 || ! tesseract --list-langs 2>/dev/null | grep -q '^ind$'; then
    command -v sudo >/dev/null 2>&1 || { echo "Tesseract Indonesian OCR requires sudo to install its system packages." >&2; exit 1; }
    sudo apt-get update
    sudo apt-get install -y tesseract-ocr tesseract-ocr-ind tesseract-ocr-eng
  fi
  tesseract --list-langs 2>/dev/null | grep -q '^ind$' || { echo "Tesseract Indonesian language model is unavailable." >&2; exit 1; }
  tesseract --list-langs 2>/dev/null | grep -q '^eng$' || { echo "Tesseract English language model is unavailable." >&2; exit 1; }
  printf 'tesseract\n' > "$ENGINE_FILE"
  echo "PaddlePaddle cannot run on this CPU; configured offline Tesseract OCR (Indonesian + English)."
}

if [[ -f "$ENGINE_FILE" && "$(<"$ENGINE_FILE")" == "tesseract" && "${FINANCE_NOTE_RETRY_PADDLE:-0}" != "1" ]]; then
  install_tesseract_fallback
  exit 0
fi

# Paddle's x86 CPU wheel requires AVX. Some VPS hosts expose older virtual CPUs.
if ! grep -qw avx /proc/cpuinfo 2>/dev/null; then
  install_tesseract_fallback
  exit 0
fi

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
if "$UV_BIN" python install 3.13 \
  && "$UV_BIN" venv --clear --python 3.13 "$VENV_DIR" \
  && "$UV_BIN" pip install --python "$VENV_DIR/bin/python" \
    --index-url https://www.paddlepaddle.org.cn/packages/stable/cpu/ paddlepaddle==3.2.0 \
  && "$UV_BIN" pip install --python "$VENV_DIR/bin/python" paddleocr==3.7.0 \
  && "$VENV_DIR/bin/python" -c 'import paddle; import paddleocr; print("PaddlePaddle", paddle.__version__); print("PaddleOCR", paddleocr.__version__)'; then
  if "$VENV_DIR/bin/python" "$ROOT_DIR/scripts/paddle_ocr_worker.py" --warmup; then
    printf 'paddle\n' > "$ENGINE_FILE"
    echo "PaddleOCR is installed and its Indonesian CPU models are cached."
    exit 0
  fi
fi

echo "PaddlePaddle failed its CPU import or model warm-up; switching to Tesseract." >&2
install_tesseract_fallback
