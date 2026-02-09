FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
COPY src/ src/
COPY start_server.py .

RUN pip install --no-cache-dir .

CMD ["python", "start_server.py"]
