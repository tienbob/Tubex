@echo off
REM Run Docker Compose with automatic migrations
echo Starting Tubex development environment with automatic migrations...

REM Make sure scripts are executable in the Docker container
docker-compose run --rm migrations chmod +x /app/scripts/docker-migrate.sh

REM Start all services
docker-compose up -d

echo.
echo Services started! Migrations will run automatically.
echo To check migration logs: docker-compose logs -f migrations
echo.
