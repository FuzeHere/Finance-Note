FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PADDLE_OCR_HOST=0.0.0.0 \
    PADDLE_OCR_PORT=3101

RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/* && \
    useradd --system --create-home --uid 10001 ocr

RUN python -m pip install --no-cache-dir --upgrade pip && \
    python -m pip install --no-cache-dir paddlepaddle==3.2.0 \
      -i https://www.paddlepaddle.org.cn/packages/stable/cpu/ && \
    python -m pip install --no-cache-dir paddleocr==3.7.0

WORKDIR /app
COPY --chown=ocr:ocr scripts/paddle_ocr_worker.py ./paddle_ocr_worker.py
USER ocr

VOLUME ["/home/ocr/.paddlex"]
EXPOSE 3101
CMD ["python", "paddle_ocr_worker.py"]
