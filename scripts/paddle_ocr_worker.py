#!/usr/bin/env python3
"""Local PaddleOCR worker for receipt images; listens only on loopback."""

import argparse
import json
import logging
import os
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
MAX_IMAGE_BYTES = 10 * 1024 * 1024
SUPPORTED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def build_ocr():
    from paddleocr import PaddleOCR

    return PaddleOCR(
        lang="id",
        ocr_version="PP-OCRv6",
        text_detection_model_name="PP-OCRv6_small_det",
        text_recognition_model_name="PP-OCRv6_small_rec",
        device="cpu",
        use_doc_orientation_classify=False,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )


def text_rows(result) -> str:
    data = result.json.get("res", result.json)
    texts = data.get("rec_texts", [])
    boxes = data.get("rec_boxes", [])
    entries = []
    for text, box in zip(texts, boxes):
        value = str(text).strip()
        if not value or len(box) < 4:
            continue
        x1, y1, x2, y2 = (float(v) for v in box[:4])
        entries.append({"text": value, "x": x1, "cy": (y1 + y2) / 2, "h": max(1.0, y2 - y1)})

    entries.sort(key=lambda item: (item["cy"], item["x"]))
    rows = []
    for entry in entries:
        target = None
        for row in reversed(rows):
            tolerance = max(8.0, min(entry["h"], row["height"]) * 0.6)
            if abs(entry["cy"] - row["cy"]) <= tolerance:
                target = row
                break
        if target is None:
            rows.append({"cy": entry["cy"], "height": entry["h"], "entries": [entry]})
        else:
            target["entries"].append(entry)
            target["cy"] = sum(item["cy"] for item in target["entries"]) / len(target["entries"])
            target["height"] = max(target["height"], entry["h"])

    rows.sort(key=lambda row: row["cy"])
    return "\n".join(
        " ".join(item["text"] for item in sorted(row["entries"], key=lambda item: item["x"]))
        for row in rows
    )


class OCRHandler(BaseHTTPRequestHandler):
    server_version = "FinanceNoteOCR/1.0"

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {"ready": True})
        else:
            self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/scan":
            self._send_json(404, {"error": "Not found"})
            return

        content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        extension = SUPPORTED_TYPES.get(content_type)
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        if extension is None:
            self._send_json(415, {"error": "Unsupported image type"})
            return
        if content_length <= 0 or content_length > MAX_IMAGE_BYTES:
            self._send_json(413, {"error": "Image must be between 1 byte and 10 MB"})
            return

        image = self.rfile.read(content_length)
        if len(image) != content_length:
            self._send_json(400, {"error": "Incomplete image upload"})
            return

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(prefix="finance-receipt-", suffix=extension, delete=False) as temp:
                temp.write(image)
                temp_path = Path(temp.name)
            if self.server.engine == "tesseract":
                result = subprocess.run(
                    ["tesseract", str(temp_path), "stdout", "-l", "ind+eng", "--psm", "6"],
                    check=True,
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                text = result.stdout.strip()
            else:
                prediction = self.server.ocr.predict(str(temp_path))
                text = text_rows(prediction[0]) if prediction else ""
            self._send_json(200, {"text": text})
        except Exception:
            logging.exception("Receipt OCR prediction failed")
            self._send_json(503, {"error": "OCR prediction failed"})
        finally:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)

    def log_message(self, format_string, *args):
        logging.info("%s - %s", self.address_string(), format_string % args)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--warmup", action="store_true", help="download/cache models and exit")
    args = parser.parse_args()

    engine_path = Path(__file__).resolve().parent.parent / ".ocr-engine"
    engine = os.environ.get("OCR_ENGINE") or (engine_path.read_text().strip() if engine_path.exists() else "paddle")
    if engine == "tesseract":
        languages = subprocess.run(["tesseract", "--list-langs"], check=True, capture_output=True, text=True).stdout
        if "ind" not in languages or "eng" not in languages:
            raise RuntimeError("Tesseract language data ind+eng is missing")
        logging.info("Tesseract CPU OCR ready for Indonesian receipts")
        if args.warmup:
            return
        ocr = None
    elif engine == "paddle":
        ocr = build_ocr()
        logging.info("PaddleOCR PP-OCRv6 small ready for Indonesian receipts")
        if args.warmup:
            return
    else:
        raise RuntimeError(f"Unsupported OCR_ENGINE: {engine}")

    host = os.environ.get("PADDLE_OCR_HOST", "127.0.0.1")
    port = int(os.environ.get("PADDLE_OCR_PORT", "3101"))
    server = HTTPServer((host, port), OCRHandler)
    server.ocr = ocr
    server.engine = engine
    logging.info("PaddleOCR worker listening on %s:%s", host, port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
