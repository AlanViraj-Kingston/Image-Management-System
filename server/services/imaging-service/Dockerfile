FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY services/imaging-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY services/imaging-service/app ./app

# Expose port
EXPOSE 8002

# Run the application with reload for development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]


