FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for PostgreSQL and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . /app/

# Collect static files
RUN JWT_SECRET="build-time-static-collection-key-do-not-use-in-production-only" python manage.py collectstatic --noinput

# Ensure entrypoint is executable
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
