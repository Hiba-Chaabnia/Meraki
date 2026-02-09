FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
COPY src/ src/

RUN pip install --no-cache-dir .

CMD ["python", "-c", "import os; port = os.environ.get('PORT', '8000'); os.system(f'uvicorn meraki_flow.api:app --host 0.0.0.0 --port {port}')"]
