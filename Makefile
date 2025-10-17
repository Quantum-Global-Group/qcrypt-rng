# QCrypt RNG Makefile

.PHONY: help install test run clean

help:
	@echo "Available commands:"
	@echo "  make install  - Install dependencies"
	@echo "  make test     - Run test script"
	@echo "  make run      - Run test script"
	@echo "  make clean    - Clean cache files"

install:
	pip install -r requirements.txt

test:
	python test_qrng.py

run:
	python test_qrng.py

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf logs/*.log
