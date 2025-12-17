FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY services/diagnosis-workflow-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY services/diagnosis-workflow-service/app ./app

# Expose port
EXPOSE 8003

# Run the application with reload for development
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003", "--reload"]


