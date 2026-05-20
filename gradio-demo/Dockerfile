# Lightweight Gradio-only image for a separate Hugging Face Space (T5).
# Does NOT bundle FastAPI or Next.js — point QCRYPT_API_BASE_URL at a running API.
#
# Build: docker build -t qcrypt-gradio-demo ./gradio-demo
# Run:   docker run -p 7860:7860 -e QCRYPT_API_BASE_URL=http://host.docker.internal:8000/api/v2 qcrypt-gradio-demo

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY api_client.py app.py ./

ENV PORT=7860 \
    QCRYPT_API_BASE_URL=http://localhost:8000/api/v2

EXPOSE 7860

CMD ["python", "app.py"]
