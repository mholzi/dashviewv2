# Dashview V2 Build System
.PHONY: all clean install build test lint format dev help

# Variables
PYTHON := python3
PIP := $(PYTHON) -m pip
NPM := npm
FRONTEND_DIR := custom_components/dashview_v2/frontend
BACKEND_DIR := custom_components/dashview_v2/backend
VENV := venv_linux

# Default target
all: install lint test build

# Help target
help:
	@echo "Dashview V2 Build Commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make build      - Build production frontend"
	@echo "  make dev        - Start development server"
	@echo "  make test       - Run all tests"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make release    - Create release package"

# Install dependencies
install: install-backend install-frontend

install-backend:
	@echo "Installing backend dependencies..."
	$(PYTHON) -m venv $(VENV)
	. $(VENV)/bin/activate && $(PIP) install -r requirements.txt
	. $(VENV)/bin/activate && $(PIP) install -r requirements-dev.txt

install-frontend:
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && $(NPM) install

# Build targets
build: build-frontend

build-frontend:
	@echo "Building frontend..."
	cd $(FRONTEND_DIR) && $(NPM) run build

build-analyze:
	@echo "Building and analyzing bundle..."
	cd $(FRONTEND_DIR) && $(NPM) run build:analyze

# Development server
dev:
	@echo "Starting development server..."
	cd $(FRONTEND_DIR) && $(NPM) run dev

# Testing
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	. $(VENV)/bin/activate && pytest tests/backend -v --cov=custom_components.dashview_v2.backend

test-frontend:
	@echo "Running frontend tests..."
	cd $(FRONTEND_DIR) && $(NPM) run test:coverage

test-integration:
	@echo "Running integration tests..."
	. $(VENV)/bin/activate && pytest tests/test_integration.py -v

# Linting
lint: lint-backend lint-frontend

lint-backend:
	@echo "Linting backend..."
	. $(VENV)/bin/activate && black --check $(BACKEND_DIR)
	. $(VENV)/bin/activate && flake8 $(BACKEND_DIR)
	. $(VENV)/bin/activate && mypy $(BACKEND_DIR)

lint-frontend:
	@echo "Linting frontend..."
	cd $(FRONTEND_DIR) && $(NPM) run lint
	cd $(FRONTEND_DIR) && $(NPM) run type-check

# Formatting
format: format-backend format-frontend

format-backend:
	@echo "Formatting backend..."
	. $(VENV)/bin/activate && black $(BACKEND_DIR)
	. $(VENV)/bin/activate && isort $(BACKEND_DIR)

format-frontend:
	@echo "Formatting frontend..."
	cd $(FRONTEND_DIR) && $(NPM) run format

# Clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(FRONTEND_DIR)/dist
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf custom_components/dashview_v2/panel
	rm -rf $(VENV)
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

# Release
release: clean install lint test build
	@echo "Creating release package..."
	mkdir -p dist
	cp -r custom_components dist/
	cd dist && zip -r dashview-v2-$(shell date +%Y%m%d).zip custom_components
	@echo "Release package created: dist/dashview-v2-$(shell date +%Y%m%d).zip"

# Development helpers
watch-backend:
	@echo "Watching backend files..."
	. $(VENV)/bin/activate && watchmedo auto-restart -d $(BACKEND_DIR) -p "*.py" -- python -m custom_components.dashview_v2

watch-frontend:
	@echo "Watching frontend files..."
	cd $(FRONTEND_DIR) && $(NPM) run dev

# Quality checks
quality: lint test
	@echo "Running quality checks..."
	. $(VENV)/bin/activate && pytest tests --cov=custom_components.dashview_v2 --cov-report=term-missing
	cd $(FRONTEND_DIR) && $(NPM) run test:coverage

# Docker support (optional)
docker-build:
	docker build -t dashview-v2:latest .

docker-run:
	docker run -p 8123:8123 -v $(PWD)/config:/config dashview-v2:latest

# CI/CD helpers
ci-test:
	@echo "Running CI tests..."
	$(MAKE) install
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) build