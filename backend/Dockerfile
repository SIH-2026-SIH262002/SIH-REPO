FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
ENV PIP_DEFAULT_TIMEOUT=300
RUN pip install --no-cache-dir --retries 5 -r /app/backend/requirements.txt

COPY backend /app/backend
COPY ml/model_bundle.joblib /app/ml/model_bundle.joblib

WORKDIR /app/backend
RUN mkdir -p /app/backend/uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]