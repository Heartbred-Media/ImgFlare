# ImgFlare Makefile
# Helper commands for project management

.PHONY: install test lint build run-dev link unlink publish help clean test-single

# Detect OS for 'open' command
UNAME := $(shell uname)
ifeq ($(UNAME), Darwin)
	OPEN := open
else ifeq ($(UNAME), Linux)
	OPEN := xdg-open
else
	OPEN := start
endif

help:
	@echo "ImgFlare Project Management Commands"
	@echo "-----------------------------------"
	@echo "make install       Install dependencies"
	@echo "make test          Run all tests"
	@echo "make test-single   Run a single test (TEST_NAME=pattern)"
	@echo "make lint          Run linter"
	@echo "make build         Build the project"
	@echo "make run-dev       Run CLI in dev mode"
	@echo "make link          Create global symlink (for local development)"
	@echo "make unlink        Remove global symlink"
	@echo "make publish       Publish to npm"
	@echo "make clean         Clean temporary files"
	@echo "make audit         Run security audit"
	@echo "make audit-fix     Run security audit and fix"
	@echo "make docs          Open documentation (if available)"

install:
	npm install

test:
	npm test

test-single:
	npm test -- -t "$(TEST_NAME)"

lint:
	npm run lint

build:
	npm run build

run-dev:
	node bin/imgflare.js

link:
	npm link

unlink:
	npm unlink

publish:
	npm publish

clean:
	rm -rf node_modules
	rm -f package-lock.json
	@echo "Cleaned project files"

audit:
	npm audit

audit-fix:
	npm audit fix

docs:
	@if [ -f "README.md" ]; then \
		$(OPEN) README.md; \
	else \
		echo "Documentation not found"; \
	fi