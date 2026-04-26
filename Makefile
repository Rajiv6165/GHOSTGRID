# Makefile for GhostGrid Docker operations

.PHONY: help build up down logs clean restart shell-db shell-backend

help:
	@echo "GhostGrid Docker Commands:"
	@echo "  make build     - Build all Docker images"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View logs for all services"
	@echo "  make clean     - Remove containers and volumes"
	@echo "  make restart   - Restart all services"
	@echo "  make shell-db  - Access PostgreSQL shell"
	@echo "  make shell-backend - Access backend container shell"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --remove-orphans

restart:
	docker-compose restart

shell-db:
	docker-compose exec db psql -U postgres -d ghostgrid

shell-backend:
	docker-compose exec backend bash

# Development commands (without Docker)
dev-backend:
	cd ghostgrid-backend && python manage.py runserver

dev-frontend:
	cd ghostgrid-frontend && npm run dev

seed-demo:
	cd ghostgrid-backend && python manage.py seed_demo --force