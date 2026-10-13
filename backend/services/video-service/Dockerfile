FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir fastapi uvicorn httpx pydantic

COPY adapter /app/adapter

ENV TARGET_SERVICE_URL=http://localhost:5010
EXPOSE 8004

CMD ["uvicorn", "adapter.main:app", "--host", "0.0.0.0", "--port", "8004"]
